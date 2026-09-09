import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ProcessNode } from '@/types/grc';
import { useData } from '@/store/useData';
import { useUi } from '@/store/useUi';
import {
  useAuth, canEditNode, canCreateRecords, userCan,
} from '@/store/useAuth';
import {
  activeNodes, controlsOf, descendants, documentsOf, pathTo, risksOf, rollup,
  sortRisksBySeverity,
} from '@/lib/selectors';
import { childKindOf } from '@/lib/entityMeta';
import { nodeKindLabels } from '@/lib/labels';
import { unitName, userName } from '@/data/org';
import {
  Badge, EmptyState, ScoreChip, SectionHeading, Segmented,
} from '@/components/common/Primitives';
import {
  IconArrowDown, IconBook, IconChevronDown, IconChevronRight, IconControl, IconDoc,
  IconFlow, IconList, IconPlus, IconProcess, IconRisk, IconSettings, IconWarning,
} from '@/components/common/Icons';
import { NodeFormModal } from '@/components/forms/NodeForm';
import { useApprovalSave } from '@/components/forms/useApprovalSave';
import { RiskFormModal } from '@/components/forms/RiskForm';
import { ControlFormModal } from '@/components/forms/ControlForm';
import { DocumentFormModal } from '@/components/forms/DocumentForm';
import { DocumentFlowView } from '@/pages/FlowPage';
import { ControlView, ManagementView, RiskView } from '@/components/process/Views';

/**
 * SÜREÇ AKIŞI — tek ekran
 *
 * Bu ekran daha önce üçe bölünmüş olan Süreç Haritası, Süreç Kanvası ve
 * Hasar İş Akışı'nın yerini alır. Üçü de aynı ağacı farklı kabuklarla
 * gösteriyordu: harita ağacı listeliyor, kanvas seviye seviye derinleşiyor,
 * akış sırayı çiziyordu. Tek yapı, tek ekran:
 *
 *   akış (sıra) + yerinde derinleşme (kanvas) + adım detayı (harita)
 *
 * Akış yukarıdan aşağı okunur: her kutu bir süreç adımıdır, kutular okla
 * bağlanır. Bir kutuya tıklandığında alt adımları AYNI AKIŞIN İÇİNDE,
 * girintili olarak açılır ve altındaki adımlar aşağı kayar — başka bir
 * ekrana gidilmez. Böylece akışın tamamı tek ekranda, istenen derinlikte
 * görünür.
 *
 * Süreç Kanvası'ndan farkı: kanvas her tıklamada bir seviye DERİNLEŞİR ve
 * üst seviyeyi görüntüden çıkarır; burada seviyeler İÇ İÇE açılır ve akış
 * bütünlüğü bozulmaz. Ayrıca burası salt görüntü değil, düzenleyicidir.
 *
 * Kutunun kendisi bir süreç düğümüdür; risk, kontrol, prosedür ve doküman
 * sayıları altındaki her şeyin toplamıdır. Sayaç doluysa tıklanabilir ve
 * o kayıtların listesini açar.
 *
 * Düzenleme mevcut mutasyonlar üzerinden yapılır: her ekleme, taşıma ve
 * arşivleme audit trail'e yazılır, kritik alan değişiklikleri onay
 * zincirine düşer. Bu ekran kendi veri yolunu açmaz.
 */

type Slot = 'risk' | 'control' | 'procedure' | 'document';

/** Bir düğümün doğrudan alt adımları, akıştaki sıralarıyla. */
function stepsOf(nodes: ProcessNode[], parentId: string): ProcessNode[] {
  return nodes.filter((n) => n.parentId === parentId).sort((a, b) => a.order - b.order);
}

/**
 * Bir adımın taşıdığı her şey.
 *
 * rollup yalnızca kimlik listesi döndürür; kutuda sayaç, panelde kaydın
 * kendisi gerekir. İlgili birimler alt ağacın tamamından toplanır: bir
 * aşamanın hangi birimleri ilgilendirdiği, tek tek adımlara girmeden
 * görünsün.
 */
function contentOf(data: ReturnType<typeof useData.getState>['data'], nodeId: string) {
  const r = rollup(data, nodeId);
  const documents = documentsOf(data, r.documentIds);
  const visible = activeNodes(data.nodes);
  const node = visible.find((n) => n.id === nodeId);
  const subtree = node ? [node, ...descendants(visible, nodeId)] : [];

  const unitIds: string[] = [];
  for (const n of subtree) if (!unitIds.includes(n.unitId)) unitIds.push(n.unitId);

  return {
    risks: sortRisksBySeverity(risksOf(data, r.riskIds)),
    controls: controlsOf(data, r.controlIds),
    procedures: documents.filter((d) => d.type === 'procedure'),
    documents,
    reviewOverdue: r.reviewOverdue,
    /** Doğrudan alt adımlar, akış sırasıyla. */
    steps: stepsOf(visible, nodeId),
    /** Bu adımın ve altındaki her şeyin dokunduğu birimler. */
    unitIds,
  };
}


/** Akış olarak gezilebilecek ana süreçler. */
function useFlowRoots(): ProcessNode[] {
  const data = useData((s) => s.data);
  return useMemo(
    () => activeNodes(data.nodes)
      .filter((n) => n.kind === 'process')
      .sort((a, b) => a.order - b.order),
    [data.nodes],
  );
}

/**
 * Akış içindeki görünümler.
 *
 * Eski Süreç Haritası altı görünüm sunuyordu: Harita, Ağaç, Akış, Risk,
 * Kontrol, Yönetim. İlk üçü birleşik akışın kendisi oldu (seçici = harita,
 * iç içe açılma = ağaç, sıra = akış). Kalan üçü aynı ağaca farklı mercekler
 * olduğu için buraya taşındı — ekran birleşirken özellik kaybolmasın.
 */
type View = 'flow' | 'risk' | 'control' | 'management';

type Mode = 'editor' | 'document';

/**
 * Ekranın kabuğu: iki görünüm arasında geçiş.
 *
 * "Akış Editörü" kurumun kendi akışıdır — düzenlenebilir, canlı veriden
 * okur. "Doküman Şeması" ise TMTB Süreç Dokümanı v10.0'daki resmî
 * şemalardır — değiştirilemez, çünkü onlar yayımlanmış belgenin kendisi.
 * İkisini tek ekranda tutmak, "bizim akışımız belgeyle uyuşuyor mu?"
 * sorusunu tek yerde cevaplatıyor.
 */
export function FlowPage() {
  const [mode, setMode] = useState<Mode>('editor');
  return (
    <>
      <div className="fe-mode">
        <Segmented<Mode>
          ariaLabel="Akış görünümü"
          value={mode}
          onChange={setMode}
          options={[
            { id: 'editor', label: 'Akış Editörü', icon: <IconFlow size={14} /> },
            { id: 'document', label: 'Doküman Şeması', icon: <IconBook size={14} /> },
          ]}
        />
      </div>
      {mode === 'editor' ? <FlowEditorPage /> : <DocumentFlowView />}
    </>
  );
}

export function FlowEditorPage() {
  const roots = useFlowRoots();
  const data = useData((s) => s.data);
  const { nodeId } = useParams();
  const navigate = useNavigate();

  const [rootId, setRootId] = useState<string | null>(null);
  /** Açık olan kutular. Kök her zaman açıktır. */
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /**
   * Adres çubuğundan gelen düğüm.
   *
   * Eski Süreç Haritası ve Kanvas bağlantıları (/surecler/:id, /kanvas/:id)
   * buraya yönleniyor; arama, asistan ve dashboard da doğrudan buraya
   * bağlanıyor. Gelen düğümün ATALARI açılır, kendisi seçilir — böylece
   * derin bir adım da akışın içinde, bağlamıyla birlikte görünür.
   */
  useEffect(() => {
    if (!nodeId) return;
    const target = data.nodes.find((n) => n.id === nodeId);
    if (!target) return;
    const trail = pathTo(data.nodes, nodeId);
    const mainProcess = trail.find((n) => n.kind === 'process');
    if (mainProcess) setRootId(mainProcess.id);
    // Hedefin kendisi de açılır: alt adımları varsa görünsün.
    setOpen(new Set([...trail.map((n) => n.id), nodeId]));
    setSelectedId(nodeId);
  }, [nodeId, data.nodes]);

  const root = roots.find((r) => r.id === rootId) ?? roots[0];

  const currentUser = useAuth((s) => s.currentUser);
  const canCreateProcess = userCan(currentUser, 'process.create');
  const [addingRoot, setAddingRoot] = useState(false);
  const [view, setView] = useState<View>('flow');
  /** Ana süreçler organizasyon düğümünün altına açılır. */
  const orgNode = data.nodes.find((n) => n.kind === 'organization');

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!root) {
    return (
      <div className="page">
        <EmptyState title="Akışa dönüştürülecek ana süreç yok" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack gap-1">
          <span className="eyebrow">İş Akışı</span>
          <h1>{root.name}</h1>
          <p className="muted" style={{ maxWidth: '92ch' }}>
            Akış yukarıdan aşağı okunur. Bir kutuya tıklayın; alt adımları aynı akışın içinde
            açılır. Kutular arasındaki <strong>+</strong> ile araya yeni adım eklenir. Her adımın
            riski, kontrolü, prosedürü ve dokümanı kutunun üzerindedir.
          </p>
        </div>
      </div>

      <div className="row gap-2 wrap fe-variants">
        {roots.map((r) => (
          <button
            key={r.id}
            className={`btn fe-variant${r.id === root.id ? ' is-active' : ''}`}
            onClick={() => {
              setRootId(r.id); setOpen(new Set()); setSelectedId(null);
              if (nodeId) navigate('/akis', { replace: true });
            }}
          >
            <IconProcess size={14} /> {r.name}
          </button>
        ))}
        {/* Eski Süreç Haritası'nın "Yeni ana süreç" düğmesi buraya taşındı:
            akış ekranı artık süreç envanterinin de tek girişi. */}
        {canCreateProcess ? (
          <button className="btn fe-new-root" onClick={() => setAddingRoot(true)}>
            <IconPlus size={14} /> Yeni ana süreç
          </button>
        ) : null}
      </div>

      <div className="fe-views">
        <Segmented<View>
          ariaLabel="Görünüm"
          value={view}
          onChange={setView}
          options={[
            { id: 'flow', label: 'Akış', icon: <IconFlow size={13} /> },
            { id: 'risk', label: 'Risk', icon: <IconRisk size={13} /> },
            { id: 'control', label: 'Kontrol', icon: <IconControl size={13} /> },
            { id: 'management', label: 'Yönetim', icon: <IconList size={13} /> },
          ]}
        />
      </div>

      {view !== 'flow' ? (
        <div className="fe-analysis">
          {view === 'risk' ? <RiskView rootId={root.id} /> : null}
          {view === 'control' ? <ControlView rootId={root.id} /> : null}
          {view === 'management' ? (
            <ManagementView
              rootId={root.id}
              onSelect={(id) => { setView('flow'); setSelectedId(id); setOpen((o) => new Set([...o, id])); }}
            />
          ) : null}
        </div>
      ) : (
      <div className="fe-body">
        <div className="card fe-canvas">
          <FlowBranch
            parent={root}
            depth={0}
            open={open}
            toggle={toggle}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        <aside className="card fe-inspector">
          {selectedId
            ? (
              <StepPanel
                nodeId={selectedId}
                onClose={() => setSelectedId(null)}
                onSelect={(id) => { setSelectedId(id); setOpen((o) => new Set([...o, id])); }}
              />
            )
            : (
              <EmptyState
                icon={<IconArrowDown size={26} />}
                title="Bir adım seçin"
                hint="Akıştaki kutuya tıklayın; o adımın riskleri, kontrolleri, prosedürleri ve dokümanları burada açılır ve buradan düzenlenir."
              />
            )}
        </aside>
      </div>
      )}

      <NodeFormModal
        open={addingRoot && Boolean(orgNode)}
        onClose={() => setAddingRoot(false)}
        parentId={orgNode?.id ?? null}
        onSaved={(id) => {
          setRootId(id);
          setOpen(new Set());
          setSelectedId(id);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bir üst düğümün çocukları: kutular ve aralarındaki oklar            */
/* ------------------------------------------------------------------ */

function FlowBranch({
  parent, depth, open, toggle, selectedId, onSelect,
}: {
  parent: ProcessNode;
  depth: number;
  open: Set<string>;
  toggle: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const data = useData((s) => s.data);
  const currentUser = useAuth((s) => s.currentUser);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [addingUnder, setAddingUnder] = useState(false);

  const steps = useMemo(
    () => stepsOf(activeNodes(data.nodes), parent.id),
    [data.nodes, parent.id],
  );

  const childKind = childKindOf(parent.kind);
  const canAdd = Boolean(childKind) && userCan(currentUser, 'process.create');

  if (!steps.length) {
    return (
      <div className="fe-branch" data-depth={depth}>
        <div className="fe-leaf">
          <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>
            Bu adımın altında tanımlı bir alt adım yok.
          </span>
          {canAdd ? (
            <button className="btn btn-sm" onClick={() => setAddingUnder(true)}>
              <IconPlus size={13} /> {nodeKindLabels[childKind!]} ekle
            </button>
          ) : null}
        </div>
        <NodeFormModal
          open={addingUnder}
          onClose={() => setAddingUnder(false)}
          parentId={parent.id}
          onSaved={(id) => { onSelect(id); }}
        />
      </div>
    );
  }

  return (
    <div className="fe-branch" data-depth={depth}>
      {steps.map((node, i) => (
        <div key={node.id} className="fe-slot">
          {/* Araya ekleme: bu adımın ÖNÜNE yeni adım koyar. */}
          {canAdd ? (
            <InsertHandle
              label={`${i + 1}. sıraya adım ekle`}
              onClick={() => setInsertAt(node.order)}
            />
          ) : null}

          <StepBox
            node={node}
            index={i + 1}
            depth={depth}
            expanded={open.has(node.id)}
            onToggle={() => toggle(node.id)}
            selected={selectedId === node.id}
            onSelect={() => onSelect(node.id)}
            isLast={i === steps.length - 1}
          />

          {/* Alt adımlar aynı akışın içinde, girintili açılır. */}
          {open.has(node.id) ? (
            <div className="fe-nest">
              <FlowBranch
                parent={node}
                depth={depth + 1}
                open={open}
                toggle={toggle}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            </div>
          ) : null}

          {i < steps.length - 1 ? <FlowArrow /> : null}
        </div>
      ))}

      {canAdd ? (
        <InsertHandle label="Akışın sonuna adım ekle" onClick={() => setInsertAt(steps.length)} />
      ) : null}

      <NodeFormModal
        open={insertAt !== null}
        onClose={() => setInsertAt(null)}
        parentId={parent.id}
        insertAt={insertAt}
        onSaved={(id) => { onSelect(id); }}
      />
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="fe-arrow" aria-hidden="true">
      <span className="fe-arrow-line" />
      <IconArrowDown size={13} />
    </div>
  );
}

function InsertHandle({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="fe-insert">
      <button className="fe-insert-btn" onClick={onClick} title={label} aria-label={label}>
        <IconPlus size={12} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Akış kutusu                                                         */
/* ------------------------------------------------------------------ */

function StepBox({
  node, index, depth, expanded, onToggle, selected, onSelect, isLast,
}: {
  node: ProcessNode;
  index: number;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
  selected: boolean;
  onSelect: () => void;
  isLast: boolean;
}) {
  const data = useData((s) => s.data);
  const reorderNode = useData((s) => s.reorderNode);
  const currentUser = useAuth((s) => s.currentUser);
  const saveWithApproval = useApprovalSave('process');
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const counts = useMemo(() => contentOf(data, node.id), [data, node.id]);
  const hasChildren = stepsOf(activeNodes(data.nodes), node.id).length > 0;
  /**
   * Alt adımı olmayan ama olabilecek kutular da açılabilir olmalı.
   * Aksi hâlde boş bir adımın altına ilk adımı eklemenin yolu kalmıyor —
   * "… ekle" düğmesi yalnızca açık dalda görünüyor.
   */
  const canHaveChildren = childKindOf(node.kind) !== null;
  const openable = hasChildren || canHaveChildren;
  const canEdit = canEditNode(currentUser, node);

  const chips: { slot: Slot; label: string; n: number }[] = [
    { slot: 'risk', label: 'Risk', n: counts.risks.length },
    { slot: 'control', label: 'Kontrol', n: counts.controls.length },
    { slot: 'procedure', label: 'Prosedür', n: counts.procedures.length },
    { slot: 'document', label: 'Doküman', n: counts.documents.length },
  ];

  const move = (direction: 'up' | 'down') => {
    if (!currentUser) return;
    reorderNode(node.id, direction, currentUser.id);
    setMenuOpen(false);
  };

  /**
   * Adımı akıştan çıkarır.
   *
   * Süreçte `status` kritik alandır: doğrudan arşivlemez, onay zincirine
   * düşer. Bu bilinçli — bir adımın akıştan çıkması alt ağacını da
   * görünmez yapar, tek kişinin kararı olmamalı.
   */
  const archive = () => {
    if (!currentUser) return;
    saveWithApproval(
      node.id,
      { ...node, status: 'archived' } as unknown as Record<string, unknown>,
      'Akış editöründen çıkarıldı.',
      currentUser.id,
    );
    setMenuOpen(false);
  };

  return (
    <div className={`fe-box${selected ? ' is-selected' : ''}${expanded ? ' is-open' : ''}`}>
      {/* Ok işareti yalnızca açıp kapar; gövde seçer ve kapalıysa açar.
          Açık bir kutuyu seçmek onu kapatmamalı — kullanıcı içeriğine
          bakmak için tıklıyor, akışı toplamak için değil. */}
      {openable ? (
        <button
          className={`fe-box-caret fe-box-caret-btn${hasChildren ? '' : ' is-empty'}`}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          aria-expanded={expanded}
          aria-label={`${node.name} alt adımlarını ${expanded ? 'kapat' : 'aç'}`}
        >
          {expanded ? <IconChevronDown size={15} /> : <IconChevronRight size={15} />}
        </button>
      ) : (
        <span className="fe-box-caret"><span className="fe-box-dot" /></span>
      )}
      <button
        className="fe-box-main"
        onClick={() => { onSelect(); if (openable && !expanded) onToggle(); }}
      >
        <span className="fe-box-no">{index}</span>
        <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
          <span className="row gap-2" style={{ alignItems: 'center' }}>
            <strong className="truncate">{node.name}</strong>
            <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{node.code}</span>
          </span>
          <span className="dim truncate" style={{ fontSize: 'var(--text-xs)' }}>
            {nodeKindLabels[node.kind]} · {userName(node.ownerId)}
          </span>
        </span>
      </button>

      <div className="fe-box-chips">
        {chips.map((c) => (
          <span key={c.slot} className={`fe-chip${c.n ? '' : ' is-zero'}`}>
            {c.label} <b>{c.n}</b>
          </span>
        ))}
        {counts.reviewOverdue ? (
          <span className="fe-chip is-alert" title="Gözden geçirmesi gecikmiş">
            <IconWarning size={11} /> Gecikmiş
          </span>
        ) : null}

        {canEdit ? (
          <span className="fe-box-menu">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={`${node.name} adımı için işlemler`}
              aria-expanded={menuOpen}
            >
              <IconSettings size={14} />
            </button>
            {menuOpen ? (
              <span className="fe-menu" role="menu">
                <button role="menuitem" onClick={() => { setEditing(true); setMenuOpen(false); }}>
                  Adımı düzenle
                </button>
                <button role="menuitem" onClick={() => move('up')} disabled={index === 1}>
                  Yukarı taşı
                </button>
                <button role="menuitem" onClick={() => move('down')} disabled={isLast}>
                  Aşağı taşı
                </button>
                <button role="menuitem" className="is-danger" onClick={archive}>
                  Akıştan çıkar (arşivle)
                </button>
              </span>
            ) : null}
          </span>
        ) : null}
      </div>

      <NodeFormModal open={editing} onClose={() => setEditing(false)} nodeId={node.id} />
      {/* Derinlik göstergesi: girintili dallarda kutu soluna çizgi düşer. */}
      <span className="fe-box-depth" data-depth={depth} aria-hidden="true" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sağ panel: seçili adımın içeriği                                    */
/* ------------------------------------------------------------------ */

function StepPanel({
  nodeId, onClose, onSelect,
}: {
  nodeId: string;
  onClose: () => void;
  /** İş adımına tıklandığında akışta o adıma geçilir. */
  onSelect: (id: string) => void;
}) {
  const data = useData((s) => s.data);
  const currentUser = useAuth((s) => s.currentUser);
  const select = useUi((s) => s.select);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState<Slot | null>(null);

  const node = data.nodes.find((n) => n.id === nodeId);
  const info = useMemo(() => (node ? contentOf(data, node.id) : null), [data, node]);

  if (!node || !info) {
    return <EmptyState title="Adım bulunamadı" hint="Arşivlenmiş ya da silinmiş olabilir." />;
  }

  const canEdit = canEditNode(currentUser, node);
  const canCreate = canCreateRecords(currentUser);
  const procedures = info.procedures;
  const others = info.documents.filter((d) => d.type !== 'procedure');

  return (
    <div className="stack gap-4">
      <div className="stack gap-2">
        <div className="row gap-2 between" style={{ alignItems: 'flex-start' }}>
          <span className="stack gap-1" style={{ minWidth: 0 }}>
            <Badge tone="plain">{nodeKindLabels[node.kind]}</Badge>
            <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{node.name}</h2>
            <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{node.code}</span>
          </span>
          <button className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Paneli kapat">×</button>
        </div>
        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>{node.description}</p>
        {node.purpose ? (
          <p className="dim" style={{ fontSize: 'var(--text-xs)' }}><strong>Amaç:</strong> {node.purpose}</p>
        ) : null}
        {canEdit ? (
          <div className="row gap-2 wrap">
            <button className="btn btn-sm" onClick={() => setEditing(true)}>Adımı düzenle</button>
          </div>
        ) : null}
      </div>

      {/* Künye: eskiden Süreç Haritası'nın detay panelindeydi. */}
      <div className="detail-section">
        <SectionHeading title="Sorumluluk" />
        <dl className="dl">
          <dt>Süreç sahibi</dt><dd>{userName(node.ownerId)}</dd>
          <dt>Sorumlu birim</dt><dd>{unitName(node.unitId)}</dd>
          {info.unitIds.length > 1 ? (
            <>
              <dt>İlgili birimler</dt>
              <dd>
                <span className="row gap-2 wrap">
                  {info.unitIds.map((u) => <span key={u} className="tag">{unitName(u)}</span>)}
                </span>
              </dd>
            </>
          ) : null}
          {node.participantIds.length ? (
            <>
              <dt>Görevli kişiler</dt>
              <dd>{node.participantIds.map((id) => userName(id)).join(' · ')}</dd>
            </>
          ) : null}
          {node.systems.length ? (<><dt>Kullanılan sistem</dt><dd>{node.systems.join(' · ')}</dd></>) : null}
          {node.inputs.length ? (<><dt>Girdi</dt><dd>{node.inputs.join(' · ')}</dd></>) : null}
          {node.outputs.length ? (<><dt>Çıktı</dt><dd>{node.outputs.join(' · ')}</dd></>) : null}
          {node.slaDays ? (<><dt>Hedef süre</dt><dd>{node.slaDays} iş günü</dd></>) : null}
        </dl>
      </div>

      {/* İş adımları: bu adımın altındaki sıra. Akıştaki kutuya bağlıdır. */}
      <PanelSection
        title="İş adımları"
        count={info.steps.length}
        addLabel=""
        empty="Bu adımın altında iş adımı tanımlı değil."
      >
        {info.steps.map((st, i) => (
          <button key={st.id} className="rel-control" onClick={() => onSelect(st.id)}>
            <span className="fe-box-no">{i + 1}</span>
            <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
              <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{st.name}</span>
              <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>
                {st.code} · {unitName(st.unitId)}
              </span>
            </span>
            <IconChevronRight size={14} className="dim" />
          </button>
        ))}
      </PanelSection>

      <PanelSection
        title="Riskler"
        count={info.risks.length}
        onAdd={canCreate ? () => setAdding('risk') : undefined}
        addLabel="Risk ekle"
        empty="Bu adımda tanımlı risk yok."
      >
        {info.risks.map((r) => (
          <button key={r.id} className="rel-control" onClick={() => select('risk', r.id)}>
            <IconRisk size={15} className="dim" />
            <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
              <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{r.name}</span>
              <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{r.code}</span>
            </span>
            <ScoreChip assessment={r.residual} />
          </button>
        ))}
      </PanelSection>

      <PanelSection
        title="Kontroller"
        count={info.controls.length}
        onAdd={canCreate ? () => setAdding('control') : undefined}
        addLabel="Kontrol ekle"
        empty="Bu adımda tanımlı kontrol yok."
      >
        {info.controls.map((c) => (
          <button key={c.id} className="rel-control" onClick={() => select('control', c.id)}>
            <IconControl size={15} className="dim" />
            <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
              <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{c.name}</span>
              <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{c.code}</span>
            </span>
            {c.keyControl ? <Badge tone="brand">Kritik</Badge> : null}
          </button>
        ))}
      </PanelSection>

      <PanelSection
        title="Prosedürler"
        count={procedures.length}
        onAdd={canCreate ? () => setAdding('procedure') : undefined}
        addLabel="Prosedür ekle"
        empty="Bu adıma bağlı prosedür yok."
      >
        {procedures.map((d) => (
          <button key={d.id} className="rel-control" onClick={() => navigate(`/dokumanlar/${d.id}`)}>
            <IconDoc size={15} className="dim" />
            <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
              <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{d.name}</span>
              <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{d.code} · v{d.version}</span>
            </span>
          </button>
        ))}
      </PanelSection>

      <PanelSection
        title="Diğer dokümanlar"
        count={others.length}
        onAdd={canCreate ? () => setAdding('document') : undefined}
        addLabel="Doküman ekle"
        empty="Bu adıma bağlı başka doküman yok."
      >
        {others.map((d) => (
          <button key={d.id} className="rel-control" onClick={() => navigate(`/dokumanlar/${d.id}`)}>
            <IconDoc size={15} className="dim" />
            <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
              <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{d.name}</span>
              <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{d.code} · v{d.version}</span>
            </span>
          </button>
        ))}
      </PanelSection>

      <NodeFormModal open={editing} onClose={() => setEditing(false)} nodeId={node.id} />
      <RiskFormModal
        open={adding === 'risk'} onClose={() => setAdding(null)} defaultNodeId={node.id}
      />
      <ControlFormModal
        open={adding === 'control'} onClose={() => setAdding(null)} defaultNodeId={node.id}
      />
      <DocumentFormModal
        open={adding === 'procedure' || adding === 'document'}
        onClose={() => setAdding(null)}
        defaultNodeId={node.id}
      />
    </div>
  );
}

function PanelSection({
  title, count, onAdd, addLabel, empty, children,
}: {
  title: string;
  count: number;
  onAdd?: () => void;
  addLabel: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div className="detail-section">
      <SectionHeading
        title={title}
        count={count}
        action={onAdd && addLabel ? (
          <button className="btn btn-sm btn-ghost" onClick={onAdd}>
            <IconPlus size={12} /> {addLabel}
          </button>
        ) : undefined}
      />
      {count ? (
        <div className="stack gap-2">{children}</div>
      ) : (
        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>{empty}</p>
      )}
    </div>
  );
}
