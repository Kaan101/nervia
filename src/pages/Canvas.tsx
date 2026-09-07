import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/store/useData';
import { useAuth, userCan } from '@/store/useAuth';
import {
  activeNodes, controlsOf, documentsOf, pathTo, risksOf, rollup,
} from '@/lib/selectors';
import { riskLevel, score } from '@/lib/riskMath';
import { nodeKindLabels } from '@/lib/labels';
import { userName } from '@/data/org';
import type { ProcessNode } from '@/types/grc';
import { Badge } from '@/components/common/Primitives';
import {
  IconArrowRight, IconChevronRight, IconControl, IconDoc, IconPlus, IconProcess, IconRisk,
} from '@/components/common/Icons';
import { RiskFormModal } from '@/components/forms/RiskForm';
import { ControlFormModal } from '@/components/forms/ControlForm';
import { DocumentFormModal } from '@/components/forms/DocumentForm';

/**
 * SÜREÇ KANVASI
 *
 * Süreci tıkladıkça derinleşen kutular hâlinde gösterir:
 *
 *   varyant seçimi → ana süreç → alt süreç → faaliyet → iş adımı
 *
 * Her kutu, altındaki her şeyin toplamını taşır (risk, kontrol, prosedür,
 * doküman). Böylece "bu kutunun altında ne var" sorusu kutuya girmeden
 * cevaplanır — asıl fikir bu: bilgiyi aramak yerine görmek.
 *
 * Her seviyede yerinde ekleme yapılabilir; eklenen kayıt bulunduğunuz
 * düğüme bağlanır.
 */

/* ------------------------------------------------------------------ */
/* Giriş: varyant seçimi                                               */
/* ------------------------------------------------------------------ */

/** Kanvasın giriş ekranında öne çıkarılan süreç çiftleri. */
const featuredPairs: { title: string; hint: string; codes: string[] }[] = [
  {
    title: 'Hasar Yönetimi',
    hint: 'Hasarın nerede gerçekleştiği süreci baştan aşağı değiştirir. Hangisini açmak istiyorsunuz?',
    codes: ['HSR', 'HSD'],
  },
];

export function CanvasPage() {
  const { nodeId } = useParams();
  const data = useData((s) => s.data);

  const node = nodeId ? data.nodes.find((n) => n.id === nodeId) : undefined;
  if (!node) return <CanvasEntry />;
  return <CanvasLevel node={node} />;
}

function CanvasEntry() {
  const data = useData((s) => s.data);
  const navigate = useNavigate();

  const visible = activeNodes(data.nodes);
  const byCode = (code: string) => visible.find((n) => n.code === code);
  const mains = visible.filter((n) => n.kind === 'process');
  const featuredCodes = featuredPairs.flatMap((p) => p.codes);
  const others = mains.filter((n) => !featuredCodes.includes(n.code));

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack gap-1">
          <span className="eyebrow">Süreç Kanvası</span>
          <h1>Hangi süreci açmak istiyorsunuz?</h1>
          <p className="muted" style={{ maxWidth: '74ch' }}>
            Süreci kutular hâlinde gezin. Her kutu altındaki risk, kontrol, prosedür ve
            doküman sayısını taşır; tıkladıkça bir alt seviye açılır.
          </p>
        </div>
      </div>

      {featuredPairs.map((pair) => {
        const nodes = pair.codes.map(byCode).filter((n): n is ProcessNode => !!n);
        if (!nodes.length) return null;
        return (
          <div className="stack gap-4" key={pair.title} style={{ marginBottom: 'var(--s7)' }}>
            <div className="stack gap-1">
              <h2>{pair.title}</h2>
              <p className="muted">{pair.hint}</p>
            </div>
            <div className="grid cols-2">
              {nodes.map((n) => (
                <VariantCard key={n.id} node={n} onOpen={() => navigate(`/kanvas/${n.id}`)} />
              ))}
            </div>
          </div>
        );
      })}

      {others.length ? (
        <div className="stack gap-4">
          <h2>Diğer süreçler</h2>
          <div className="grid auto">
            {others.map((n) => (
              <button key={n.id} className="canvas-box" onClick={() => navigate(`/kanvas/${n.id}`)}>
                <BoxHead node={n} />
                <BoxCounts nodeId={n.id} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function VariantCard({ node, onOpen }: { node: ProcessNode; onOpen: () => void }) {
  const data = useData((s) => s.data);
  const roll = useMemo(() => rollup(data, node.id), [data, node.id]);

  return (
    <button className="canvas-variant" onClick={onOpen}>
      <span className="row gap-3" style={{ alignItems: 'flex-start' }}>
        <IconProcess size={22} />
        <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
          <strong style={{ fontSize: 'var(--text-lg)' }}>{node.name}</strong>
          <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>{node.description}</span>
        </span>
        <IconArrowRight size={18} />
      </span>
      <span className="row gap-4 wrap" style={{ marginTop: 'var(--s4)' }}>
        <Stat label="Alt süreç" value={roll.subprocessCount} />
        <Stat label="Faaliyet" value={roll.activityCount} />
        <Stat label="İş adımı" value={roll.stepCount} />
        <Stat label="Risk" value={roll.riskIds.length} />
        <Stat label="Kontrol" value={roll.controlIds.length} />
      </span>
      {roll.criticalRiskCount > 0 || roll.highRiskCount > 0 ? (
        <span className="row gap-2 wrap" style={{ marginTop: 'var(--s3)' }}>
          {roll.criticalRiskCount > 0
            ? <Badge tone="solid" level="critical">{roll.criticalRiskCount} kritik risk</Badge> : null}
          {roll.highRiskCount > 0
            ? <Badge tone="solid" level="high">{roll.highRiskCount} yüksek risk</Badge> : null}
        </span>
      ) : null}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="stack gap-1">
      <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{value}</span>
      <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>{label}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Seviye görünümü                                                     */
/* ------------------------------------------------------------------ */

function CanvasLevel({ node }: { node: ProcessNode }) {
  const data = useData((s) => s.data);
  const navigate = useNavigate();

  const visible = activeNodes(data.nodes);
  const children = visible
    .filter((n) => n.parentId === node.id)
    .sort((a, b) => a.order - b.order);
  const trail = pathTo(visible, node.id).filter((n) => n.kind !== 'organization');

  return (
    <div className="page">
      {/* Kırıntı yolu */}
      <nav className="canvas-trail" aria-label="Süreç yolu">
        <button className="link" onClick={() => navigate('/kanvas')}>Kanvas</button>
        {trail.map((n) => (
          <span key={n.id} className="row gap-1" style={{ alignItems: 'center' }}>
            <IconChevronRight size={14} />
            {n.id === node.id
              ? <strong>{n.name}</strong>
              : <button className="link" onClick={() => navigate(`/kanvas/${n.id}`)}>{n.name}</button>}
          </span>
        ))}
      </nav>

      <div className="page-head">
        <div className="stack gap-1">
          <span className="eyebrow">{nodeKindLabels[node.kind]} · {node.code}</span>
          <h1>{node.name}</h1>
          <p className="muted" style={{ maxWidth: '80ch' }}>{node.description}</p>
          <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            Sahibi: {userName(node.ownerId)}
            {node.slaDays ? ` · Hedef süre: ${node.slaDays} iş günü` : ''}
          </p>
        </div>
      </div>

      {/* Bu düğümün kendi kayıtları ve ekleme */}
      <NodeInspector node={node} />

      {children.length ? (
        <div className="stack gap-4" style={{ marginTop: 'var(--s7)' }}>
          <h2>
            {children[0].kind === 'step' ? 'İş adımları' : `Alt kırılım — ${nodeKindLabels[children[0].kind]}`}
            <span className="muted" style={{ fontWeight: 400 }}> ({children.length})</span>
          </h2>
          <div className="canvas-flow">
            {children.map((child, i) => (
              <div className="canvas-flow-item" key={child.id}>
                <CanvasBox node={child} />
                {i < children.length - 1 ? <span className="canvas-arrow" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="muted" style={{ marginTop: 'var(--s6)' }}>
          Bu {nodeKindLabels[node.kind].toLocaleLowerCase('tr-TR')} en alt seviyede; alt kırılımı yok.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kutu                                                                */
/* ------------------------------------------------------------------ */

function BoxHead({ node }: { node: ProcessNode }) {
  return (
    <span className="stack gap-1" style={{ minWidth: 0, textAlign: 'left' }}>
      <span className="canvas-box-code">{node.code}</span>
      <strong className="canvas-box-name">{node.name}</strong>
    </span>
  );
}

/** Kutunun altındaki her şeyin toplamı: risk, kontrol, prosedür, doküman. */
function BoxCounts({ nodeId }: { nodeId: string }) {
  const data = useData((s) => s.data);
  const counts = useMemo(() => {
    const roll = rollup(data, nodeId);
    const docs = documentsOf(data, roll.documentIds);
    return {
      risk: roll.riskIds.length,
      control: roll.controlIds.length,
      procedure: docs.filter((d) => d.type === 'procedure').length,
      document: docs.filter((d) => d.type !== 'procedure').length,
      critical: roll.criticalRiskCount,
    };
  }, [data, nodeId]);

  return (
    <span className="canvas-counts">
      <CountChip icon={<IconRisk size={13} />} value={counts.risk} label="Risk"
        alert={counts.critical > 0} />
      <CountChip icon={<IconControl size={13} />} value={counts.control} label="Kontrol" />
      <CountChip icon={<IconDoc size={13} />} value={counts.procedure} label="Prosedür" />
      <CountChip icon={<IconDoc size={13} />} value={counts.document} label="Doküman" />
    </span>
  );
}

function CountChip({
  icon, value, label, alert,
}: { icon: React.ReactNode; value: number; label: string; alert?: boolean }) {
  return (
    <span className={`canvas-chip ${value === 0 ? 'is-zero' : ''} ${alert ? 'is-alert' : ''}`}
      title={`${label}: ${value}`}>
      {icon}
      <span>{value}</span>
      <span className="canvas-chip-label">{label}</span>
    </span>
  );
}

function CanvasBox({ node }: { node: ProcessNode }) {
  const data = useData((s) => s.data);
  const navigate = useNavigate();
  const hasChildren = activeNodes(data.nodes).some((n) => n.parentId === node.id);

  return (
    <div className={`canvas-box ${hasChildren ? 'drillable' : 'leaf'}`}>
      <button
        className="canvas-box-main"
        onClick={() => navigate(`/kanvas/${node.id}`)}
        title={hasChildren ? 'Alt kırılımı aç' : 'Detayını aç'}
      >
        <BoxHead node={node} />
        <BoxCounts nodeId={node.id} />
      </button>
      <div className="canvas-box-foot">
        <AddMenu node={node} />
        <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/kanvas/${node.id}`)}>
          {hasChildren ? 'Aç' : 'Detay'} <IconChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Düğüm içeriği ve ekleme                                             */
/* ------------------------------------------------------------------ */

function NodeInspector({ node }: { node: ProcessNode }) {
  const data = useData((s) => s.data);
  const risks = risksOf(data, node.riskIds);
  const controls = controlsOf(data, node.controlIds);
  const docs = documentsOf(data, node.documentIds);
  const procedures = docs.filter((d) => d.type === 'procedure');
  const otherDocs = docs.filter((d) => d.type !== 'procedure');

  // Ana süreç ve alt süreç seviyelerinde kayıtlar genellikle alt düğümlere
  // bağlıdır; dört boş sütun göstermek yer kaplamaktan başka işe yaramaz.
  const isEmpty = risks.length + controls.length + docs.length === 0;

  if (isEmpty) {
    return (
      <div className="canvas-inspector row gap-3 wrap"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="muted" style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
          Bu seviyeye doğrudan bağlı kayıt yok — riskler ve kontroller alt kırılımda tanımlı.
        </p>
        <AddMenu node={node} wide />
      </div>
    );
  }

  return (
    <div className="canvas-inspector">
      <div className="row gap-3 wrap" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Bu seviyeye bağlı kayıtlar</h2>
        <AddMenu node={node} wide />
      </div>

      <div className="grid cols-4" style={{ marginTop: 'var(--s4)' }}>
        <RecordList title="Riskler" items={risks.map((r) => ({
          id: r.id, code: r.code, name: r.name, level: riskLevel(r.residual), extra: `Skor ${score(r.residual)}`,
        }))} to="/riskler" />
        <RecordList title="Kontroller" items={controls.map((c) => ({
          id: c.id, code: c.code, name: c.name,
        }))} to="/kontroller" />
        <RecordList title="Prosedürler" items={procedures.map((d) => ({
          id: d.id, code: d.code, name: d.name, extra: `v${d.version}`,
        }))} to="/dokumanlar" />
        <RecordList title="Dokümanlar" items={otherDocs.map((d) => ({
          id: d.id, code: d.code, name: d.name, extra: `v${d.version}`,
        }))} to="/dokumanlar" />
      </div>
    </div>
  );
}

function RecordList({
  title, items, to,
}: {
  title: string;
  items: { id: string; code: string; name: string; level?: string; extra?: string }[];
  to: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="stack gap-2">
      <div className="sh"><span>{title}</span><span className="n">{items.length}</span></div>
      {items.length === 0 ? (
        <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>Bu seviyede kayıt yok.</p>
      ) : (
        <div className="stack gap-1">
          {items.map((it) => (
            <button
              key={it.id}
              className="canvas-record"
              onClick={() => navigate(`${to}/${it.id}`)}
              title={it.name}
            >
              <span className="canvas-record-code">{it.code}</span>
              <span className="truncate grow">{it.name}</span>
              {it.level ? <span className={`dot lvl-${it.level}`} aria-hidden="true" /> : null}
              {it.extra ? <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>{it.extra}</span> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Bu düğüme risk / kontrol / prosedür / doküman ekler. */
function AddMenu({ node, wide }: { node: ProcessNode; wide?: boolean }) {
  const currentUser = useAuth((s) => s.currentUser);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<null | 'risk' | 'control' | 'document'>(null);

  const target = { ownerId: node.ownerId, unitId: node.unitId };
  const canRisk = userCan(currentUser, 'risk.create', target);
  const canControl = userCan(currentUser, 'control.create', target);
  const canDoc = userCan(currentUser, 'document.create', target);

  if (!canRisk && !canControl && !canDoc) return null;

  return (
    <>
      <div style={{ position: 'relative' }}>
        <button
          className={`btn btn-sm ${wide ? 'btn-primary' : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <IconPlus size={14} /> {wide ? 'Bu seviyeye ekle' : 'Ekle'}
        </button>
        {open ? (
          <div className="menu" style={{ top: 'calc(100% + 4px)', left: 0, minWidth: 190, zIndex: 30 }}>
            <div className="menu-label">{node.code} altına ekle</div>
            {canRisk ? (
              <button onClick={() => { setForm('risk'); setOpen(false); }}>
                <IconRisk size={15} /> Risk
              </button>
            ) : null}
            {canControl ? (
              <button onClick={() => { setForm('control'); setOpen(false); }}>
                <IconControl size={15} /> Kontrol
              </button>
            ) : null}
            {canDoc ? (
              <button onClick={() => { setForm('document'); setOpen(false); }}>
                <IconDoc size={15} /> Prosedür / Doküman
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <RiskFormModal
        open={form === 'risk'}
        onClose={() => setForm(null)}
        defaultNodeId={node.id}
      />
      <ControlFormModal
        open={form === 'control'}
        onClose={() => setForm(null)}
        defaultNodeId={node.id}
      />
      <DocumentFormModal
        open={form === 'document'}
        onClose={() => setForm(null)}
        defaultNodeId={node.id}
      />
    </>
  );
}
