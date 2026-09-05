import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  ActionItem, Control, GrcDocument, ProcessNode, Risk,
} from '@/types/grc';
import { useData } from '@/store/useData';
import {
  useAuth, canEditNode, canArchiveRecords, canCreateRecords, canEditAction, canEditRecord,
} from '@/store/useAuth';
import { useUi } from '@/store/useUi';
import {
  actionPriorityLabels, actionSourceLabels, actionStatusLabels, controlCategoryLabels,
  controlEffectivenessLabels, controlExecutionLabels, controlFrequencyLabels,
  controlNatureLabels, cosoComponentLabels, criticalPointLabels, documentTypeLabels,
  impactLabels, likelihoodLabels, nodeKindLabels, processClassLabels, processStatusLabels,
  riskAppetiteLabels, riskCategoryLabels, riskLevelLabels, riskStatusLabels,
  riskTreatmentLabels, riskTrendLabels,
} from '@/lib/labels';
import {
  combinedMitigation, daysBetween, formatDate, isOutsideAppetite, isOverdue, isReviewOverdue,
  mitigationPercent, monthsSince, riskLevel, score,
} from '@/lib/riskMath';
import {
  actionsOf, controlsOf, documentsOf, krisOf, pathTo, risksOf, rollup, sortRisksBySeverity,
} from '@/lib/selectors';
import { analyseProcesses, suggestControls, suggestRisks } from '@/lib/ai';
import { userById, userName, unitName } from '@/data/org';
import {
  Avatar, Badge, Collapsible, Drawer, EmptyState, Maturity, Meter, ScoreChip,
  SectionHeading, Tabs, TrendIcon,
} from '@/components/common/Primitives';
import { ScoreScale } from '@/components/charts/Charts';
import { RiskFormModal } from '@/components/forms/RiskForm';
import { ControlFormModal } from '@/components/forms/ControlForm';
import { ActionFormModal } from '@/components/forms/ActionForm';
import { LinkEditorModal, type LinkEditorMode } from '@/components/forms/LinkEditor';
import {
  IconArrowRight, IconCheck, IconChevronRight, IconClock, IconControl, IconDoc,
  IconExternal, IconLayers, IconLock, IconMoney, IconPlus, IconRisk, IconSettings,
  IconShieldAlert, IconSparkles, IconWarning,
} from '@/components/common/Icons';

/* ================================================================== */
/* Ortak parçalar                                                      */
/* ================================================================== */

export function CrumbTrail({ nodeId }: { nodeId: string }) {
  const data = useData((s) => s.data);
  const trail = pathTo(data.nodes, nodeId);
  return (
    <div className="detail-crumbs">
      {trail.map((n, i) => (
        <span key={n.id} className="row gap-1">
          {i > 0 ? <span className="sep">/</span> : null}
          <span>{n.name}</span>
        </span>
      ))}
    </div>
  );
}

function PersonLine({ userId, role }: { userId: string; role: string }) {
  const user = userById.get(userId);
  return (
    <div className="row gap-2">
      <Avatar user={user} size="sm" />
      <span className="stack" style={{ lineHeight: 1.3 }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{user?.name ?? '—'}</span>
        <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{role}{user ? ` · ${user.title}` : ''}</span>
      </span>
    </div>
  );
}

const criticalIcon: Record<string, React.ReactNode> = {
  control: <IconShieldAlert size={16} />,
  authorization: <IconLock size={16} />,
  financial: <IconMoney size={16} />,
  privacy: <IconLock size={16} />,
  regulatory: <IconWarning size={16} />,
  continuity: <IconClock size={16} />,
};

export function CriticalPoints({ node }: { node: ProcessNode }) {
  if (!node.criticalPoints.length) return null;
  return (
    <div className="critical-list">
      {node.criticalPoints.map((cp) => (
        <div className={`critical-item ${cp.kind}`} key={cp.id}>
          <span className="icon">{criticalIcon[cp.kind]}</span>
          <span className="stack" style={{ gap: 2 }}>
            <span className="t">⚠ {cp.label || criticalPointLabels[cp.kind]}</span>
            <span className="n">{cp.note}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function RiskCard({
  risk, onClick, highlighted, faded,
}: { risk: Risk; onClick?: () => void; highlighted?: boolean; faded?: boolean }) {
  const level = riskLevel(risk.residual);
  const outside = isOutsideAppetite(risk);
  return (
    <button
      className={`entity-card risk lvl-${level} ${highlighted ? 'highlighted' : ''} ${faded ? 'faded' : ''}`}
      onClick={onClick}
    >
      <span className="row between gap-2">
        <span className="code">{risk.code}</span>
        <span className="row gap-2">
          <TrendIcon trend={risk.trend} />
          <ScoreChip assessment={risk.residual} />
        </span>
      </span>
      <h4>{risk.name}</h4>
      <span className="snippet clamp-2">{risk.description}</span>
      <span className="foot">
        <Badge level={level}><span className="dot" />{riskLevelLabels[level]}</Badge>
        <Badge tone="plain">{riskCategoryLabels[risk.category]}</Badge>
        {outside ? <Badge level="critical" title="Artık risk, tanımlı risk iştahı bandını aşıyor">İştah aşımı</Badge> : null}
        <span className="spacer" />
        <Avatar user={userById.get(risk.ownerId)} size="sm" />
      </span>
    </button>
  );
}

export function ControlCard({
  control, onClick, highlighted, faded,
}: { control: Control; onClick?: () => void; highlighted?: boolean; faded?: boolean }) {
  return (
    <button
      className={`entity-card control ${highlighted ? 'highlighted' : ''} ${faded ? 'faded' : ''}`}
      onClick={onClick}
    >
      <span className="row between gap-2">
        <span className="code">{control.code}</span>
        <span className="row gap-2">
          {control.keyControl ? <Badge tone="brand">Kritik kontrol</Badge> : null}
          <span className={`eff eff-${control.effectiveness}`} style={{ width: 8, height: 8, borderRadius: '50%' }}
            title={controlEffectivenessLabels[control.effectiveness]} />
        </span>
      </span>
      <h4>{control.name}</h4>
      <span className="snippet clamp-2">{control.description}</span>
      <span className="foot">
        <Badge tone={control.nature === 'preventive' ? 'brand' : 'neutral'}>{controlNatureLabels[control.nature]}</Badge>
        <Badge tone="plain">{controlExecutionLabels[control.execution]}</Badge>
        <Badge tone="plain">{controlFrequencyLabels[control.frequency]}</Badge>
        <span className="spacer" />
        <Avatar user={userById.get(control.ownerId)} size="sm" />
      </span>
    </button>
  );
}

export function ActionRow({ action, onClick }: { action: ActionItem; onClick?: () => void }) {
  const overdue = (action.status === 'open' || action.status === 'in_progress') && isOverdue(action.dueDate);
  return (
    <button className="rel-control" onClick={onClick} style={{ width: '100%', textAlign: 'left' }}>
      <span className="stack grow" style={{ gap: 3, minWidth: 0 }}>
        <span className="row gap-2">
          <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{action.code}</span>
          <Badge tone="plain">{actionStatusLabels[action.status]}</Badge>
          {overdue ? <Badge level="critical">Gecikmiş · {Math.abs(daysBetween(action.dueDate))} gün</Badge> : null}
        </span>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }} className="truncate">{action.title}</span>
        <span className="row gap-2" style={{ fontSize: 'var(--text-2xs)', color: 'var(--ink-500)' }}>
          <span>{userName(action.ownerId)}</span>
          <span>·</span>
          <span>Hedef {formatDate(action.dueDate)}</span>
        </span>
        <span style={{ maxWidth: 200 }}><Meter value={action.progress} /></span>
      </span>
      <span className="num dim" style={{ fontSize: 'var(--text-xs)' }}>%{action.progress}</span>
    </button>
  );
}

/**
 * Kayıt araç çubuğu — detay panellerinin altında görünen düzenle / ilişkilendir /
 * arşivle düğmeleri. Yetkisi olmayan kullanıcıya düğme yerine gerekçe gösterilir.
 */
function RecordToolbar({
  canEdit, canArchive, archived, onEdit, onArchive, extra, deniedNote,
}: {
  canEdit: boolean;
  canArchive: boolean;
  archived: boolean;
  onEdit: () => void;
  onArchive: () => void;
  extra?: ReactNode;
  deniedNote: string;
}) {
  if (!canEdit && !canArchive) {
    return <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>{deniedNote}</span>;
  }
  return (
    <div className="row gap-2 wrap">
      {canEdit ? (
        <button className="btn btn-sm btn-primary" onClick={onEdit}>
          <IconSettings size={13} /> Düzenle
        </button>
      ) : null}
      {extra}
      <span className="spacer" />
      {canArchive ? (
        <button className={`btn btn-sm ${archived ? '' : 'btn-danger'}`} onClick={onArchive}>
          {archived ? 'Arşivden geri al' : 'Arşivle'}
        </button>
      ) : null}
    </div>
  );
}

/** Arşivlenmiş kayıtlarda panelin üstünde gösterilen şerit. */
function ArchivedNotice({ archived }: { archived?: boolean }) {
  if (!archived) return null;
  return (
    <div className="callout lvl-medium" style={{ marginBottom: 'var(--s4)' }}>
      <IconWarning size={15} style={{ flex: '0 0 auto', marginTop: 2 }} />
      <span>
        <span className="callout-title">Bu kayıt arşivde. </span>
        Listelerden, sayımlardan, aramadan ve analizden düşürüldü; geçmiş raporlarda ve
        audit trail’de yerinde duruyor.
      </span>
    </div>
  );
}

/* ================================================================== */
/* Süreç / iş adımı detay paneli                                       */
/* ================================================================== */

type ProcessTab = 'overview' | 'controls' | 'risks' | 'procedure' | 'examples' | 'insight';

export function NodeDetail({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  const data = useData((s) => s.data);
  const markReviewed = useData((s) => s.markReviewed);
  const currentUser = useAuth((s) => s.currentUser);
  const select = useUi((s) => s.select);
  const [tab, setTab] = useState<ProcessTab>('overview');
  const [openDoc, setOpenDoc] = useState<GrcDocument | null>(null);
  const [addingRisk, setAddingRisk] = useState(false);
  const [addingControl, setAddingControl] = useState(false);
  const [addingAction, setAddingAction] = useState(false);
  const navigate = useNavigate();

  const node = data.nodes.find((n) => n.id === nodeId);
  const info = useMemo(() => {
    if (!node) return null;
    const risks = sortRisksBySeverity(risksOf(data, node.riskIds));
    const controls = controlsOf(data, node.controlIds);
    return {
      risks,
      controls,
      documents: documentsOf(data, node.documentIds),
      actions: actionsOf(data, node.actionIds),
      roll: rollup(data, node.id),
      suggestedRisks: suggestRisks(node, risks),
      suggestedControls: suggestControls(node, risks, controls),
    };
  }, [data, node]);

  if (!node || !info) return null;
  const editable = canEditNode(currentUser, node);
  const canCreate = canCreateRecords(currentUser);
  const siblings = data.nodes
    .filter((n) => n.parentId === node.parentId)
    .sort((a, b) => a.order - b.order);
  const idx = siblings.findIndex((n) => n.id === node.id);

  return (
    <Drawer
      open
      wide
      onClose={onClose}
      eyebrow={
        <>
          <CrumbTrail nodeId={node.id} />
          <div className="row gap-2 wrap" style={{ marginBottom: 6 }}>
            <Badge tone="brand">{nodeKindLabels[node.kind]}</Badge>
            <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{node.code}</span>
            <Badge tone="plain">{processStatusLabels[node.status]}</Badge>
            <Badge tone="plain">v{node.version}</Badge>
          </div>
        </>
      }
      title={node.name}
      subtitle={node.description}
      actions={
        <>
          <Badge tone="plain"><Maturity level={node.maturity} /></Badge>
          {info.roll.criticalRiskCount > 0 ? (
            <Badge level="critical">{info.roll.criticalRiskCount} kritik risk</Badge>
          ) : null}
          {isReviewOverdue(node) ? (
            <Badge level="high" title={`Son gözden geçirme: ${formatDate(node.lastReviewedAt)}`}>
              {monthsSince(node.lastReviewedAt)} aydır gözden geçirilmedi
            </Badge>
          ) : null}
          <span className="spacer" />
          {canCreate ? (
            <>
              <button className="btn btn-sm" onClick={() => setAddingRisk(true)}>
                <IconPlus size={13} /> Risk
              </button>
              <button className="btn btn-sm" onClick={() => setAddingControl(true)}>
                <IconPlus size={13} /> Kontrol
              </button>
              <button className="btn btn-sm" onClick={() => setAddingAction(true)}>
                <IconPlus size={13} /> Aksiyon
              </button>
            </>
          ) : null}
          {editable ? (
            <button className="btn btn-sm" onClick={() => markReviewed(node.id, currentUser!.id)}>
              <IconCheck size={14} /> Gözden geçirildi
            </button>
          ) : null}
          <button className="btn btn-sm" onClick={() => { onClose(); navigate(`/iliskiler?dugum=${node.id}`); }}>
            Bağlantı ağı
          </button>
        </>
      }
      footer={
        <div className="row between gap-3">
          <div className="row gap-2">
            {idx > 0 ? (
              <button className="btn btn-sm" onClick={() => select('node', siblings[idx - 1].id)}>
                ← {siblings[idx - 1].name}
              </button>
            ) : null}
            {idx >= 0 && idx < siblings.length - 1 ? (
              <button className="btn btn-sm" onClick={() => select('node', siblings[idx + 1].id)}>
                {siblings[idx + 1].name} →
              </button>
            ) : null}
          </div>
          <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>
            Son güncelleme {formatDate(node.updatedAt)}
          </span>
        </div>
      }
    >
      <Tabs<ProcessTab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Genel' },
          { id: 'controls', label: 'Kontroller', count: info.controls.length },
          { id: 'risks', label: 'Riskler', count: info.risks.length },
          { id: 'procedure', label: 'Prosedür', count: info.documents.length },
          { id: 'examples', label: 'Örnekler', count: node.examples.length },
          { id: 'insight', label: 'Analiz' },
        ]}
      />

      <div style={{ marginTop: 'var(--s5)' }}>
        {tab === 'overview' ? (
          <>
            {node.purpose ? (
              <div className="detail-section">
                <SectionHeading title="Amaç" />
                <p style={{ fontSize: 'var(--text-sm)' }}>{node.purpose}</p>
              </div>
            ) : null}

            <div className="detail-section">
              <SectionHeading title="Süreç Bilgisi" />
              <dl className="dl">
                <dt>Süreç sahibi</dt>
                <dd><PersonLine userId={node.ownerId} role="Süreç sahibi" /></dd>
                <dt>Sorumlu birim</dt>
                <dd>{unitName(node.unitId)}</dd>
                {node.participantIds.length ? (
                  <>
                    <dt>Görevli kişiler</dt>
                    <dd>
                      <span className="row gap-2 wrap">
                        {node.participantIds.map((id) => (
                          <span key={id} className="tag row gap-1">
                            <Avatar user={userById.get(id)} size="sm" />{userName(id)}
                          </span>
                        ))}
                      </span>
                    </dd>
                  </>
                ) : null}
                {node.systems.length ? (<><dt>Kullanılan sistem</dt><dd>{node.systems.join(' · ')}</dd></>) : null}
                {node.inputs.length ? (<><dt>Girdi</dt><dd>{node.inputs.join(' · ')}</dd></>) : null}
                {node.outputs.length ? (<><dt>Çıktı</dt><dd>{node.outputs.join(' · ')}</dd></>) : null}
                {node.customer ? (<><dt>Çıktı alıcısı</dt><dd>{node.customer}</dd></>) : null}
                {node.slaDays ? (<><dt>Hedef süre</dt><dd>{node.slaDays} iş günü</dd></>) : null}
                <dt>Sınıf</dt>
                <dd>{processClassLabels[node.processClass]}</dd>
                {node.standards.length ? (<><dt>Standart</dt><dd>{node.standards.join(' · ')}</dd></>) : null}
              </dl>
            </div>

            {(idx > 0 || idx < siblings.length - 1) ? (
              <div className="detail-section">
                <SectionHeading title="Süreç Akışındaki Yeri" />
                <div className="row gap-2 wrap" style={{ fontSize: 'var(--text-sm)' }}>
                  <span className="tag">{idx > 0 ? `Önceki: ${siblings[idx - 1].name}` : 'Başlangıç adımı'}</span>
                  <IconArrowRight size={14} className="dim" />
                  <span className="tag" style={{ borderColor: 'var(--brand-400)', color: 'var(--brand-700)', fontWeight: 600 }}>{node.name}</span>
                  <IconArrowRight size={14} className="dim" />
                  <span className="tag">{idx < siblings.length - 1 ? `Sonraki: ${siblings[idx + 1].name}` : 'Son adım'}</span>
                </div>
              </div>
            ) : null}

            {node.criticalPoints.length ? (
              <div className="detail-section">
                <SectionHeading title="Kritik Noktalar" count={node.criticalPoints.length} />
                <CriticalPoints node={node} />
              </div>
            ) : null}

            <div className="detail-section">
              <SectionHeading title="Gözden Geçirme" />
              <dl className="dl">
                <dt>Son gözden geçirme</dt>
                <dd>{formatDate(node.lastReviewedAt)} <span className="dim">({monthsSince(node.lastReviewedAt)} ay önce)</span></dd>
                <dt>Sonraki gözden geçirme</dt>
                <dd className={isReviewOverdue(node) ? 'status-red' : undefined}>
                  {formatDate(node.nextReviewAt)}
                  {isReviewOverdue(node) ? ' · gecikmiş' : ''}
                </dd>
                <dt>Periyot</dt>
                <dd>{node.reviewFrequencyMonths} ay</dd>
              </dl>
            </div>

            {info.actions.length ? (
              <div className="detail-section">
                <SectionHeading title="Aksiyonlar" count={info.actions.length} />
                <div className="stack gap-2">
                  {info.actions.map((a) => (
                    <ActionRow key={a.id} action={a} onClick={() => { onClose(); navigate(`/aksiyonlar/${a.id}`); }} />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {tab === 'controls' ? (
          info.controls.length ? (
            <div className="stack gap-3">
              {info.controls.map((c) => (
                <ControlDetailCard key={c.id} control={c} onOpen={() => select('control', c.id)} />
              ))}
              {canCreate ? (
                <button className="btn" onClick={() => setAddingControl(true)}>
                  <IconPlus size={14} /> Bu adıma kontrol tanımla
                </button>
              ) : null}
            </div>
          ) : (
            <div className="stack gap-4">
              <EmptyState
                icon={<IconControl size={28} />}
                title="Bu adımda tanımlı kontrol yok"
                hint="Analiz sekmesinde bu adım için önerilen kontrolleri görebilirsiniz."
              />
              {canCreate ? (
                <button className="btn btn-primary" style={{ alignSelf: 'center' }} onClick={() => setAddingControl(true)}>
                  <IconPlus size={14} /> Bu adıma kontrol tanımla
                </button>
              ) : null}
            </div>
          )
        ) : null}

        {tab === 'risks' ? (
          info.risks.length ? (
            <div className="stack gap-3">
              {info.risks.map((r) => (
                <RiskDetailCard key={r.id} risk={r} onOpen={() => select('risk', r.id)} />
              ))}
              {canCreate ? (
                <button className="btn" onClick={() => setAddingRisk(true)}>
                  <IconPlus size={14} /> Bu adıma risk tanımla
                </button>
              ) : null}
            </div>
          ) : (
            <div className="stack gap-4">
              <EmptyState icon={<IconRisk size={28} />} title="Bu adımda tanımlı risk yok" />
              {canCreate ? (
                <button className="btn btn-primary" style={{ alignSelf: 'center' }} onClick={() => setAddingRisk(true)}>
                  <IconPlus size={14} /> Bu adıma risk tanımla
                </button>
              ) : null}
            </div>
          )
        ) : null}

        {tab === 'procedure' ? (
          info.documents.length ? (
            <div className="stack gap-3">
              {info.documents.map((d) => (
                <div className="card" key={d.id}>
                  <div className="card-head">
                    <div className="stack" style={{ gap: 4 }}>
                      <span className="row gap-2">
                        <Badge tone="brand">{documentTypeLabels[d.type]}</Badge>
                        <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{d.code}</span>
                        <Badge tone="plain">v{d.version}</Badge>
                        {d.status === 'expired' ? <Badge level="high">Gözden geçirme gecikmiş</Badge> : null}
                      </span>
                      <h4>{d.name}</h4>
                      <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>{d.summary}</span>
                    </div>
                  </div>
                  <div className="card-body tight">
                    <dl className="dl">
                      <dt>Doküman sahibi</dt><dd>{userName(d.ownerId)}</dd>
                      <dt>Yayın tarihi</dt><dd>{formatDate(d.publishedAt)}</dd>
                      <dt>Son güncelleme</dt><dd>{formatDate(d.updatedAt)}</dd>
                      <dt>Sonraki gözden geçirme</dt>
                      <dd className={d.status === 'expired' ? 'status-red' : undefined}>{formatDate(d.nextReviewAt)}</dd>
                    </dl>
                    <button className="btn btn-sm btn-primary" style={{ marginTop: 'var(--s3)' }} onClick={() => setOpenDoc(d)}>
                      <IconDoc size={14} /> Prosedürü Gör
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<IconDoc size={28} />} title="Bağlı doküman yok"
              hint="Bu adım için prosedür, talimat veya kontrol listesi tanımlanmamış." />
          )
        ) : null}

        {tab === 'examples' ? (
          node.examples.length ? (
            <div className="stack gap-4">
              {node.examples.map((ex) => (
                <div className="example" key={ex.id}>
                  <div className="ex-head"><span className="t">Örnek senaryo · {ex.title}</span></div>
                  <div className="ex-body">
                    <div className="ex-row"><span className="k">Ne oluyor</span><span className="v">{ex.scenario}</span></div>
                    <div className="ex-row"><span className="k">Risk</span><span className="v">{ex.risk}</span></div>
                    <div className="ex-row"><span className="k">Kontrol</span><span className="v">{ex.control}</span></div>
                    <div className="ex-row"><span className="k">Kontrol türü</span><span className="v">{ex.controlType}</span></div>
                    <div className="ex-row"><span className="k">Kanıt</span><span className="v">{ex.evidence}</span></div>
                    <div className="ex-row crit"><span className="k">Kritik nokta</span><span className="v">⚠ {ex.criticalNote}</span></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Bu adım için örnek senaryo tanımlanmamış"
              hint="Örnekler, çalışanların riski ve kontrolü somut bir olay üzerinden anlamasını sağlar." />
          )
        ) : null}

        {tab === 'insight' ? (
          <NodeInsights node={node} suggestedRisks={info.suggestedRisks} suggestedControls={info.suggestedControls} />
        ) : null}
      </div>

      {openDoc ? <DocumentViewer document={openDoc} onClose={() => setOpenDoc(null)} /> : null}
      <RiskFormModal open={addingRisk} onClose={() => setAddingRisk(false)} defaultNodeId={node.id} />
      <ControlFormModal open={addingControl} onClose={() => setAddingControl(false)} defaultNodeId={node.id} />
      <ActionFormModal
        open={addingAction}
        onClose={() => setAddingAction(false)}
        defaults={{ processNodeId: node.id }}
      />
    </Drawer>
  );
}

function NodeInsights({
  node, suggestedRisks, suggestedControls,
}: {
  node: ProcessNode;
  suggestedRisks: ReturnType<typeof suggestRisks>;
  suggestedControls: ReturnType<typeof suggestControls>;
}) {
  const data = useData((s) => s.data);
  const findings = useMemo(() => analyseProcesses(data, node.id), [data, node.id]);

  return (
    <div className="stack gap-6">
      <div>
        <SectionHeading title="Tespitler" count={findings.length} />
        {findings.length ? (
          <div className="stack gap-2">
            {findings.slice(0, 8).map((f) => (
              <div className={`callout lvl-${f.severity === 'critical' ? 'critical' : f.severity === 'high' ? 'high' : f.severity === 'medium' ? 'medium' : 'low'}`} key={f.id}>
                <IconWarning size={16} style={{ flex: '0 0 auto', marginTop: 2 }} />
                <span className="stack" style={{ gap: 3 }}>
                  <span className="callout-title">{f.title}</span>
                  <span>{f.detail}</span>
                  <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>→ {f.recommendation}</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>Bu adımda açık bir tespit bulunmuyor.</p>
        )}
      </div>

      {suggestedRisks.length ? (
        <div>
          <SectionHeading title="Önerilen Riskler" count={suggestedRisks.length} />
          <p className="muted" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--s3)' }}>
            Adımın metni ve sistem/girdi/çıktı bilgisi, GRC bilgi tabanındaki desenlerle eşleştirilerek üretilir.
          </p>
          <div className="stack gap-2">
            {suggestedRisks.map((s) => (
              <div className="rel-control" key={s.id}>
                <IconSparkles size={15} className="dim" style={{ flex: '0 0 auto' }} />
                <span className="stack grow" style={{ gap: 3 }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{s.title}</span>
                  <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>{s.rationale}</span>
                  <span className="row gap-1 wrap">
                    {s.category ? <Badge tone="plain">{riskCategoryLabels[s.category]}</Badge> : null}
                    {s.triggers.slice(0, 3).map((t) => <Badge key={t} tone="plain">“{t}”</Badge>)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {suggestedControls.length ? (
        <div>
          <SectionHeading title="Önerilen Kontroller" count={suggestedControls.length} />
          <div className="stack gap-2">
            {suggestedControls.map((s) => (
              <div className="rel-control" key={s.id}>
                <IconSparkles size={15} className="dim" style={{ flex: '0 0 auto' }} />
                <span className="stack grow" style={{ gap: 3 }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{s.title}</span>
                  <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>{s.rationale}</span>
                  {s.nature ? <span><Badge tone="brand">{controlNatureLabels[s.nature]}</Badge></span> : null}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ================================================================== */
/* Risk detay kartı ve paneli                                          */
/* ================================================================== */

export function RiskDetailCard({ risk, onOpen }: { risk: Risk; onOpen: () => void }) {
  const data = useData((s) => s.data);
  const [open, setOpen] = useState(false);
  const controls = controlsOf(data, risk.controlIds);
  const level = riskLevel(risk.residual);

  return (
    <div className={`card lvl-${level}`} style={{ borderLeft: '3px solid var(--lvl)' }}>
      <div className="card-body tight stack gap-3">
        <div className="row between gap-3 items-start">
          <div className="stack" style={{ gap: 4, minWidth: 0 }}>
            <span className="row gap-2">
              <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{risk.code}</span>
              <Badge tone="plain">{riskCategoryLabels[risk.category]}</Badge>
              <Badge tone="plain">{riskStatusLabels[risk.status]}</Badge>
            </span>
            <h4 style={{ fontSize: 'var(--text-sm)' }}>{risk.name}</h4>
          </div>
          <div className="row gap-2">
            <TrendIcon trend={risk.trend} />
            <ScoreChip assessment={risk.residual} />
          </div>
        </div>

        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>{risk.description}</p>

        <div className="grid cols-2 gap-3">
          <div className="stack" style={{ gap: 2 }}>
            <span className="eyebrow">Risk nedeni</span>
            <span style={{ fontSize: 'var(--text-sm)' }}>{risk.cause}</span>
          </div>
          <div className="stack" style={{ gap: 2 }}>
            <span className="eyebrow">Risk sonucu</span>
            <span style={{ fontSize: 'var(--text-sm)' }}>{risk.consequence}</span>
          </div>
        </div>

        <div className="grid cols-4 gap-3" style={{ padding: 'var(--s3)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <Metricish label="Olasılık" value={likelihoodLabels[Math.round(risk.residual.likelihood)]} sub={`${risk.residual.likelihood}/5`} />
          <Metricish label="Etki" value={impactLabels[Math.round(risk.residual.impact)]} sub={`${risk.residual.impact}/5`} />
          <Metricish label="Doğal risk" value={String(score(risk.inherent))} sub={riskLevelLabels[riskLevel(risk.inherent)]} />
          <Metricish label="Artık risk" value={String(score(risk.residual))} sub={riskLevelLabels[level]} />
        </div>

        <ScoreScale inherent={score(risk.inherent)} residual={score(risk.residual)} target={score(risk.target)} />

        <div className="row gap-2 wrap">
          <Badge tone="plain">Risk iştahı: {riskAppetiteLabels[risk.appetite]}</Badge>
          <Badge tone="plain">Strateji: {riskTreatmentLabels[risk.treatment]}</Badge>
          <Badge tone="plain">Trend: {riskTrendLabels[risk.trend]}</Badge>
          {isOutsideAppetite(risk) ? <Badge level="critical">İştah bandı aşıldı</Badge> : <Badge level="low">İştah bandı içinde</Badge>}
          <span className="spacer" />
          <button className="btn btn-sm" onClick={() => setOpen((v) => !v)}>
            {controls.length} kontrol <IconChevronRight size={13} className={`chevron ${open ? 'open' : ''}`} />
          </button>
          <button className="btn btn-sm btn-ghost" onClick={onOpen}><IconExternal size={13} /> Aç</button>
        </div>

        <Collapsible open={open}>
          <div style={{ paddingTop: 'var(--s3)' }}>
            <RiskControlChain risk={risk} />
          </div>
        </Collapsible>
      </div>
    </div>
  );
}

function Metricish({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stack" style={{ gap: 1 }}>
      <span className="eyebrow">{label}</span>
      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--ink-900)' }}>{value}</span>
      {sub ? <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{sub}</span> : null}
    </div>
  );
}

/** RİSK → kontroller → kontrol etkinliği → artık risk zinciri. */
export function RiskControlChain({ risk }: { risk: Risk }) {
  const data = useData((s) => s.data);
  const select = useUi((s) => s.select);
  const controls = controlsOf(data, risk.controlIds);
  const mitigation = combinedMitigation(controls);
  const level = riskLevel(risk.residual);

  return (
    <div className="rel-chain">
      <div className={`rel-band lvl-${riskLevel(risk.inherent)}`}>
        <span className="eyebrow" style={{ width: 92 }}>Doğal risk</span>
        <ScoreChip assessment={risk.inherent} />
        <span className="grow truncate" style={{ fontSize: 'var(--text-sm)' }}>{risk.name}</span>
      </div>

      <div className="rel-arrow"><IconArrowRight size={16} style={{ transform: 'rotate(90deg)' }} /></div>

      <div className="stack gap-2">
        <span className="eyebrow">Bu riski azaltan kontroller ({controls.length})</span>
        <div className="rel-controls">
          {controls.length ? controls.map((c) => (
            <button className="rel-control" key={c.id} onClick={() => select('control', c.id)}>
              <span className={`eff eff-${c.effectiveness}`} />
              <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{c.name}</span>
                <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>
                  {c.code} · {controlNatureLabels[c.nature]} · {controlExecutionLabels[c.execution]} · {controlEffectivenessLabels[c.effectiveness]}
                </span>
              </span>
              {c.keyControl ? <Badge tone="brand">Kritik</Badge> : null}
            </button>
          )) : (
            <div className="callout lvl-critical">
              <IconWarning size={16} />
              <span><span className="callout-title">Kontrolsüz risk. </span>Bu riski azaltan tanımlı bir kontrol bulunmuyor.</span>
            </div>
          )}
        </div>
      </div>

      <div className="rel-arrow"><IconArrowRight size={16} style={{ transform: 'rotate(90deg)' }} /></div>

      <div className="rel-band">
        <span className="eyebrow" style={{ width: 92 }}>Kontrol etkinliği</span>
        <span className="grow"><Meter value={mitigation * 100} /></span>
        <span className="num" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
          %{Math.round(mitigation * 100)}
        </span>
      </div>

      <div className="rel-arrow"><IconArrowRight size={16} style={{ transform: 'rotate(90deg)' }} /></div>

      <div className={`rel-band lvl-${level}`}>
        <span className="eyebrow" style={{ width: 92 }}>Artık risk</span>
        <ScoreChip assessment={risk.residual} />
        <span className="grow" style={{ fontSize: 'var(--text-sm)' }}>
          {riskLevelLabels[level]} · doğal riske göre %{mitigationPercent(risk, controls)} azalma
        </span>
        {isOutsideAppetite(risk) ? <Badge level="critical">İştah aşımı</Badge> : null}
      </div>
    </div>
  );
}

export function RiskDetail({ riskId, onClose }: { riskId: string; onClose: () => void }) {
  const data = useData((s) => s.data);
  const setArchived = useData((s) => s.setArchived);
  const select = useUi((s) => s.select);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [linking, setLinking] = useState<LinkEditorMode | null>(null);
  const [addingAction, setAddingAction] = useState(false);
  const risk = data.risks.find((r) => r.id === riskId);
  if (!risk) return null;
  const canEdit = canEditRecord(currentUser, risk);
  const canArchive = canArchiveRecords(currentUser);
  const nodes = risk.processNodeIds.map((id) => data.nodes.find((n) => n.id === id)!).filter(Boolean);
  const actions = actionsOf(data, risk.actionIds);
  const kris = krisOf(data, risk.kriIds);
  const level = riskLevel(risk.residual);

  return (
    <Drawer
      open onClose={onClose} wide
      eyebrow={
        <div className="row gap-2 wrap" style={{ marginBottom: 6 }}>
          <Badge level={level}><span className="dot" />{riskLevelLabels[level]} risk</Badge>
          <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{risk.code}</span>
          <Badge tone="plain">{riskCategoryLabels[risk.category]}</Badge>
        </div>
      }
      title={risk.name}
      subtitle={risk.description}
      actions={
        <>
          <ScoreChip assessment={risk.residual} suffix="artık" />
          <Badge tone="plain">Doğal {score(risk.inherent)}</Badge>
          <Badge tone="plain">Hedef {score(risk.target)}</Badge>
          {risk.archived ? <Badge level="medium">Arşivde</Badge> : null}
          <span className="spacer" />
          <span className="row gap-2"><TrendIcon trend={risk.trend} /><span className="dim" style={{ fontSize: 'var(--text-xs)' }}>{riskTrendLabels[risk.trend]}</span></span>
        </>
      }
      footer={
        <RecordToolbar
          canEdit={canEdit}
          canArchive={canArchive}
          archived={Boolean(risk.archived)}
          onEdit={() => setEditing(true)}
          onArchive={() => setArchived('risk', risk.id, !risk.archived, currentUser!.id)}
          deniedNote="Bu riski düzenleme yetkiniz yok. Risk sahibi, birim yöneticisi, Risk Yönetimi veya İç Kontrol düzenleyebilir."
          extra={
            canEdit ? (
              <>
                <button className="btn btn-sm" onClick={() => setLinking({ kind: 'risk-controls', riskId: risk.id })}>
                  <IconControl size={13} /> Kontrolleri bağla
                </button>
                <button className="btn btn-sm" onClick={() => setLinking({ kind: 'risk-nodes', riskId: risk.id })}>
                  <IconLayers size={13} /> Süreç adımları
                </button>
                <button className="btn btn-sm" onClick={() => setAddingAction(true)}>
                  <IconPlus size={13} /> Aksiyon aç
                </button>
              </>
            ) : null
          }
        />
      }
    >
      <ArchivedNotice archived={risk.archived} />

      <div className="detail-section">
        <SectionHeading title="Risk – Kontrol İlişkisi" />
        <RiskControlChain risk={risk} />
      </div>

      <div className="detail-section">
        <SectionHeading title="Değerlendirme" />
        <dl className="dl">
          <dt>Risk nedeni</dt><dd>{risk.cause}</dd>
          <dt>Risk sonucu</dt><dd>{risk.consequence}</dd>
          <dt>Risk sahibi</dt><dd><PersonLine userId={risk.ownerId} role="Risk sahibi" /></dd>
          <dt>Sorumlu birim</dt><dd>{unitName(risk.unitId)}</dd>
          <dt>Risk iştahı</dt><dd>{riskAppetiteLabels[risk.appetite]}</dd>
          <dt>Yönetim stratejisi</dt><dd>{riskTreatmentLabels[risk.treatment]}</dd>
          <dt>Durum</dt><dd>{riskStatusLabels[risk.status]}</dd>
          <dt>Tanımlanma</dt><dd>{formatDate(risk.identifiedAt)}</dd>
          <dt>Son değerlendirme</dt><dd>{formatDate(risk.lastAssessedAt)} <span className="dim">({monthsSince(risk.lastAssessedAt)} ay önce)</span></dd>
          <dt>Sonraki değerlendirme</dt><dd>{formatDate(risk.nextAssessmentAt)}</dd>
          {risk.standards?.length ? (<><dt>Standart</dt><dd>{risk.standards.join(' · ')}</dd></>) : null}
        </dl>
      </div>

      {nodes.length ? (
        <div className="detail-section">
          <SectionHeading title="İlgili Süreç Adımları" count={nodes.length} />
          <div className="stack gap-2">
            {nodes.map((n) => (
              <button className="rel-control" key={n.id} onClick={() => select('node', n.id)}>
                <span className={`kind-dot ${n.kind}`} style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--brand-500)' }} />
                <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                  <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{n.name}</span>
                  <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{nodeKindLabels[n.kind]} · {n.code}</span>
                </span>
                <IconChevronRight size={14} className="dim" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {kris.length ? (
        <div className="detail-section">
          <SectionHeading title="Bağlı KRI Göstergeleri" count={kris.length} />
          <div className="stack gap-2">
            {kris.map((k) => (
              <button className="rel-control" key={k.id} onClick={() => { onClose(); navigate('/kri'); }}>
                <span className="stack grow" style={{ gap: 2 }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{k.name}</span>
                  <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{k.definition}</span>
                </span>
                <span className="num" style={{ fontWeight: 600 }}>
                  {k.readings[k.readings.length - 1]?.value}{k.unit === '%' ? '%' : ` ${k.unit}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="detail-section">
        <SectionHeading title="Aksiyonlar" count={actions.length} />
        {actions.length ? (
          <div className="stack gap-2">
            {actions.map((a) => <ActionRow key={a.id} action={a} onClick={() => { onClose(); navigate(`/aksiyonlar/${a.id}`); }} />)}
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>Bu risk için açılmış aksiyon bulunmuyor.</p>
        )}
      </div>

      <RiskFormModal open={editing} onClose={() => setEditing(false)} riskId={risk.id} />
      <LinkEditorModal open={Boolean(linking)} onClose={() => setLinking(null)} mode={linking} />
      <ActionFormModal
        open={addingAction}
        onClose={() => setAddingAction(false)}
        defaults={{ riskId: risk.id, processNodeId: risk.processNodeIds[0] ?? null }}
      />
    </Drawer>
  );
}

/* ================================================================== */
/* Kontrol detay                                                       */
/* ================================================================== */

export function ControlDetailCard({ control, onOpen }: { control: Control; onOpen: () => void }) {
  return (
    <div className="card">
      <div className="card-body tight stack gap-3">
        <div className="row between gap-3 items-start">
          <div className="stack" style={{ gap: 4, minWidth: 0 }}>
            <span className="row gap-2 wrap">
              <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{control.code}</span>
              <Badge tone={control.nature === 'preventive' ? 'brand' : 'neutral'}>{controlNatureLabels[control.nature]}</Badge>
              <Badge tone="plain">{controlExecutionLabels[control.execution]}</Badge>
              {control.keyControl ? <Badge tone="solid">Kritik kontrol</Badge> : null}
            </span>
            <h4 style={{ fontSize: 'var(--text-sm)' }}>{control.name}</h4>
          </div>
          <Badge level={control.effectiveness === 'effective' ? 'low' : control.effectiveness === 'partially_effective' ? 'medium' : control.effectiveness === 'ineffective' ? 'critical' : undefined}>
            <span className="dot" />{controlEffectivenessLabels[control.effectiveness]}
          </Badge>
        </div>

        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>{control.description}</p>

        <dl className="dl">
          <dt>Kontrol sahibi</dt><dd><PersonLine userId={control.ownerId} role="Kontrol sahibi" /></dd>
          <dt>Kontrol sıklığı</dt><dd>{controlFrequencyLabels[control.frequency]}</dd>
          <dt>Kontrol yöntemi</dt><dd>{control.method}</dd>
          <dt>Kontrol kanıtı</dt><dd>{control.evidence}</dd>
          <dt>Kategori</dt><dd>{control.categories.map((c) => controlCategoryLabels[c]).join(' · ')}</dd>
          <dt>Son uygulanma</dt><dd>{formatDate(control.lastPerformedAt)}</dd>
          <dt>Son test</dt>
          <dd>
            {control.lastTestedAt ? `${formatDate(control.lastTestedAt)} (${monthsSince(control.lastTestedAt)} ay önce)` : 'Test edilmedi'}
          </dd>
        </dl>

        {control.testResult ? (
          <div className={`callout lvl-${control.effectiveness === 'ineffective' ? 'critical' : control.effectiveness === 'partially_effective' ? 'medium' : 'low'}`}>
            <IconWarning size={15} style={{ flex: '0 0 auto', marginTop: 2 }} />
            <span><span className="callout-title">Test sonucu. </span>{control.testResult}</span>
          </div>
        ) : null}

        <div className="row gap-2">
          <span className="spacer" />
          <button className="btn btn-sm btn-ghost" onClick={onOpen}><IconExternal size={13} /> Kontrolü aç</button>
        </div>
      </div>
    </div>
  );
}

export function ControlDetail({ controlId, onClose }: { controlId: string; onClose: () => void }) {
  const data = useData((s) => s.data);
  const updateEffectiveness = useData((s) => s.updateControlEffectiveness);
  const setArchived = useData((s) => s.setArchived);
  const { currentUser, capabilities } = useAuth();
  const select = useUi((s) => s.select);
  const [editing, setEditing] = useState(false);
  const [linking, setLinking] = useState<LinkEditorMode | null>(null);
  const [addingAction, setAddingAction] = useState(false);
  const control = data.controls.find((c) => c.id === controlId);
  if (!control) return null;
  const canEdit = canEditRecord(currentUser, control);
  const canArchive = canArchiveRecords(currentUser);

  const risks = sortRisksBySeverity(risksOf(data, control.riskIds));
  const nodes = control.processNodeIds.map((id) => data.nodes.find((n) => n.id === id)!).filter(Boolean);
  const docs = documentsOf(data, control.documentIds);
  const actions = actionsOf(data, control.actionIds);

  return (
    <Drawer
      open onClose={onClose} wide
      eyebrow={
        <div className="row gap-2 wrap" style={{ marginBottom: 6 }}>
          <Badge tone="brand">Kontrol</Badge>
          <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{control.code}</span>
          {control.keyControl ? <Badge tone="solid">Kritik kontrol</Badge> : null}
        </div>
      }
      title={control.name}
      subtitle={control.description}
      actions={
        <>
          <Badge tone={control.nature === 'preventive' ? 'brand' : 'neutral'}>{controlNatureLabels[control.nature]}</Badge>
          <Badge tone="plain">{controlExecutionLabels[control.execution]}</Badge>
          <Badge tone="plain">{controlFrequencyLabels[control.frequency]}</Badge>
          <Badge level={control.effectiveness === 'effective' ? 'low' : control.effectiveness === 'partially_effective' ? 'medium' : control.effectiveness === 'ineffective' ? 'critical' : undefined}>
            <span className="dot" />{controlEffectivenessLabels[control.effectiveness]}
          </Badge>
          {control.archived ? <Badge level="medium">Arşivde</Badge> : null}
        </>
      }
      footer={
        <div className="stack gap-3">
          <RecordToolbar
            canEdit={canEdit}
            canArchive={canArchive}
            archived={Boolean(control.archived)}
            onEdit={() => setEditing(true)}
            onArchive={() => setArchived('control', control.id, !control.archived, currentUser!.id)}
            deniedNote="Bu kontrolü düzenleme yetkiniz yok. Kontrol sahibi, birim yöneticisi veya İç Kontrol düzenleyebilir."
            extra={
              canEdit ? (
                <>
                  <button className="btn btn-sm" onClick={() => setLinking({ kind: 'control-risks', controlId: control.id })}>
                    <IconRisk size={13} /> Riskleri bağla
                  </button>
                  <button className="btn btn-sm" onClick={() => setLinking({ kind: 'control-nodes', controlId: control.id })}>
                    <IconLayers size={13} /> Süreç adımları
                  </button>
                  <button className="btn btn-sm" onClick={() => setAddingAction(true)}>
                    <IconPlus size={13} /> Aksiyon aç
                  </button>
                </>
              ) : null
            }
          />
          {capabilities.assessControls && currentUser ? (
            <div className="row gap-2 wrap" style={{ paddingTop: 'var(--s2)', borderTop: '1px solid var(--border)' }}>
              <span className="eyebrow" style={{ alignSelf: 'center' }}>Etkinlik değerlendirmesi</span>
              {(['effective', 'partially_effective', 'ineffective'] as const).map((e) => (
                <button
                  key={e}
                  className={`btn btn-sm ${control.effectiveness === e ? 'btn-primary' : ''}`}
                  onClick={() => updateEffectiveness(control.id, e, currentUser.id, 'İç Kontrol değerlendirmesi')}
                >
                  {controlEffectivenessLabels[e]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      }
    >
      <ArchivedNotice archived={control.archived} />

      <div className="detail-section">
        <SectionHeading title="Kontrol Tasarımı" />
        <dl className="dl">
          <dt>Kontrol sahibi</dt><dd><PersonLine userId={control.ownerId} role="Kontrol sahibi" /></dd>
          <dt>Sorumlu birim</dt><dd>{unitName(control.unitId)}</dd>
          <dt>Kontrol yöntemi</dt><dd>{control.method}</dd>
          <dt>Kontrol kanıtı</dt><dd>{control.evidence}</dd>
          <dt>Kategori</dt><dd>{control.categories.map((c) => controlCategoryLabels[c]).join(' · ')}</dd>
          <dt>COSO bileşeni</dt><dd>{cosoComponentLabels[control.cosoComponent]}</dd>
          <dt>Tasarım yeterliliği</dt>
          <dd>{control.designAdequacy === 'adequate' ? 'Yeterli' : control.designAdequacy === 'needs_improvement' ? 'İyileştirme gerekli' : 'Yetersiz'}</dd>
          <dt>Son uygulanma</dt><dd>{formatDate(control.lastPerformedAt)}</dd>
          <dt>Son test</dt><dd>{control.lastTestedAt ? formatDate(control.lastTestedAt) : 'Test edilmedi'}</dd>
        </dl>
        {control.testResult ? (
          <div className={`callout lvl-${control.effectiveness === 'ineffective' ? 'critical' : 'medium'}`} style={{ marginTop: 'var(--s3)' }}>
            <IconWarning size={15} style={{ flex: '0 0 auto', marginTop: 2 }} />
            <span><span className="callout-title">Test sonucu. </span>{control.testResult}</span>
          </div>
        ) : null}
      </div>

      <div className="detail-section">
        <SectionHeading title="Yönettiği Riskler" count={risks.length} />
        {risks.length ? (
          <div className="stack gap-2">
            {risks.map((r) => (
              <button className="rel-control" key={r.id} onClick={() => select('risk', r.id)}>
                <ScoreChip assessment={r.residual} />
                <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                  <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{r.name}</span>
                  <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{r.code} · {riskCategoryLabels[r.category]}</span>
                </span>
                <IconChevronRight size={14} className="dim" />
              </button>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>Bu kontrol henüz bir riskle ilişkilendirilmemiş.</p>
        )}
      </div>

      <div className="detail-section">
        <SectionHeading title="Uygulandığı Süreç Adımları" count={nodes.length} />
        <div className="row gap-2 wrap">
          {nodes.map((n) => (
            <button className="tag" key={n.id} onClick={() => select('node', n.id)}>{n.name}</button>
          ))}
        </div>
      </div>

      {docs.length ? (
        <div className="detail-section">
          <SectionHeading title="İlgili Dokümanlar" count={docs.length} />
          <div className="row gap-2 wrap">
            {docs.map((d) => <span className="tag" key={d.id}>{d.name} · v{d.version}</span>)}
          </div>
        </div>
      ) : null}

      {actions.length ? (
        <div className="detail-section">
          <SectionHeading title="İyileştirme Aksiyonları" count={actions.length} />
          <div className="stack gap-2">{actions.map((a) => <ActionRow key={a.id} action={a} />)}</div>
        </div>
      ) : null}

      <ControlFormModal open={editing} onClose={() => setEditing(false)} controlId={control.id} />
      <LinkEditorModal open={Boolean(linking)} onClose={() => setLinking(null)} mode={linking} />
      <ActionFormModal
        open={addingAction}
        onClose={() => setAddingAction(false)}
        defaults={{ controlId: control.id, processNodeId: control.processNodeIds[0] ?? null }}
      />
    </Drawer>
  );
}

/* ================================================================== */
/* Doküman görüntüleyici                                               */
/* ================================================================== */

export function DocumentViewer({ document: doc, onClose }: { document: GrcDocument; onClose: () => void }) {
  return (
    <Drawer
      open onClose={onClose} wide
      eyebrow={
        <div className="row gap-2 wrap" style={{ marginBottom: 6 }}>
          <Badge tone="brand">{documentTypeLabels[doc.type]}</Badge>
          <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{doc.code}</span>
          <Badge tone="plain">v{doc.version}</Badge>
          {doc.status === 'expired' ? <Badge level="high">Gözden geçirme gecikmiş</Badge> : <Badge level="low">Yürürlükte</Badge>}
        </div>
      }
      title={doc.name}
      subtitle={doc.summary}
    >
      <div className="doc-view">
        <div className="doc-meta">
          <div className="stack" style={{ gap: 1 }}>
            <span className="eyebrow">Doküman sahibi</span>
            <span>{userName(doc.ownerId)}</span>
          </div>
          <div className="stack" style={{ gap: 1 }}>
            <span className="eyebrow">Versiyon</span><span>{doc.version}</span>
          </div>
          <div className="stack" style={{ gap: 1 }}>
            <span className="eyebrow">Yayın tarihi</span><span>{formatDate(doc.publishedAt)}</span>
          </div>
          <div className="stack" style={{ gap: 1 }}>
            <span className="eyebrow">Son güncelleme</span><span>{formatDate(doc.updatedAt)}</span>
          </div>
          <div className="stack" style={{ gap: 1 }}>
            <span className="eyebrow">Sonraki gözden geçirme</span>
            <span className={doc.status === 'expired' ? 'status-red' : undefined}>{formatDate(doc.nextReviewAt)}</span>
          </div>
        </div>

        {doc.sections.length ? doc.sections.map((s) => (
          <section key={s.heading}>
            <h4>{s.heading}</h4>
            {s.body.map((line, i) => <p key={i}>{line}</p>)}
          </section>
        )) : (
          <EmptyState title="Doküman içeriği sisteme yüklenmemiş"
            hint="Bu kayıt yalnızca meta veri olarak takip edilmektedir." />
        )}
      </div>
    </Drawer>
  );
}

/* ================================================================== */
/* Aksiyon detay                                                       */
/* ================================================================== */

export function ActionDetail({ actionId, onClose }: { actionId: string; onClose: () => void }) {
  const data = useData((s) => s.data);
  const updateAction = useData((s) => s.updateAction);
  const setArchived = useData((s) => s.setArchived);
  const currentUser = useAuth((s) => s.currentUser);
  const select = useUi((s) => s.select);
  const [editing, setEditing] = useState(false);
  const action = data.actions.find((a) => a.id === actionId);
  if (!action) return null;

  const risk = action.riskId ? data.risks.find((r) => r.id === action.riskId) : null;
  const control = action.controlId ? data.controls.find((c) => c.id === action.controlId) : null;
  const node = action.processNodeId ? data.nodes.find((n) => n.id === action.processNodeId) : null;
  const overdue = (action.status === 'open' || action.status === 'in_progress') && isOverdue(action.dueDate);
  const canEdit = canEditAction(currentUser, action);
  const canArchive = canArchiveRecords(currentUser);

  return (
    <Drawer
      open onClose={onClose}
      eyebrow={
        <div className="row gap-2 wrap" style={{ marginBottom: 6 }}>
          <Badge tone="brand">Aksiyon</Badge>
          <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{action.code}</span>
          <Badge tone="plain">{actionSourceLabels[action.source]}</Badge>
          {overdue ? <Badge level="critical">Gecikmiş</Badge> : null}
        </div>
      }
      title={action.title}
      subtitle={action.description}
      actions={
        <>
          <Badge level={action.priority === 'critical' ? 'critical' : action.priority === 'high' ? 'high' : action.priority === 'medium' ? 'medium' : 'low'}>
            {actionPriorityLabels[action.priority]} öncelik
          </Badge>
          <Badge tone="plain">{actionStatusLabels[action.status]}</Badge>
          <span className="spacer" />
          <span className="num" style={{ fontWeight: 600 }}>%{action.progress}</span>
        </>
      }
      footer={
        <div className="stack gap-3">
          <RecordToolbar
            canEdit={canEdit}
            canArchive={canArchive}
            archived={Boolean(action.archived)}
            onEdit={() => setEditing(true)}
            onArchive={() => setArchived('action', action.id, !action.archived, currentUser!.id)}
            deniedNote="Aksiyonu yalnızca sorumlusu, birim yöneticisi veya İç Kontrol güncelleyebilir."
          />
          {canEdit ? (
            <div className="row gap-2 wrap" style={{ paddingTop: 'var(--s2)', borderTop: '1px solid var(--border)' }}>
              <span className="eyebrow" style={{ alignSelf: 'center' }}>Hızlı güncelleme</span>
              {(['open', 'in_progress', 'completed'] as const).map((st) => (
                <button key={st} className={`btn btn-sm ${action.status === st ? 'btn-primary' : ''}`}
                  onClick={() => updateAction(action.id, {
                    status: st,
                    progress: st === 'completed' ? 100 : action.progress,
                  }, currentUser!.id)}>
                  {actionStatusLabels[st]}
                </button>
              ))}
              <span className="spacer" />
              {[25, 50, 75].map((p) => (
                <button key={p} className="btn btn-sm" onClick={() => updateAction(action.id, { progress: p, status: 'in_progress' }, currentUser!.id)}>
                  %{p}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      }
    >
      <ArchivedNotice archived={action.archived} />

      <div className="detail-section">
        <SectionHeading title="İlerleme" />
        <Meter value={action.progress} />
        <dl className="dl" style={{ marginTop: 'var(--s4)' }}>
          <dt>Sorumlu</dt><dd><PersonLine userId={action.ownerId} role="Aksiyon sorumlusu" /></dd>
          <dt>Oluşturan</dt><dd>{userName(action.createdById)}</dd>
          <dt>Oluşturma</dt><dd>{formatDate(action.createdAt)}</dd>
          <dt>Hedef tarih</dt>
          <dd className={overdue ? 'status-red' : undefined}>
            {formatDate(action.dueDate)}{overdue ? ` · ${Math.abs(daysBetween(action.dueDate))} gün gecikme` : ''}
          </dd>
          {action.closedAt ? (<><dt>Kapanış</dt><dd>{formatDate(action.closedAt)}</dd></>) : null}
          <dt>Kaynak</dt><dd>{actionSourceLabels[action.source]}</dd>
        </dl>
      </div>

      {action.evidence ? (
        <div className="detail-section">
          <SectionHeading title="Kanıt" />
          <p style={{ fontSize: 'var(--text-sm)' }}>{action.evidence}</p>
        </div>
      ) : null}

      {action.managerComment ? (
        <div className="detail-section">
          <SectionHeading title="Yönetici Yorumu" />
          <div className="callout"><span>{action.managerComment}</span></div>
        </div>
      ) : null}

      <div className="detail-section">
        <SectionHeading title="İlişkili Kayıtlar" />
        <div className="stack gap-2">
          {risk ? (
            <button className="rel-control" onClick={() => select('risk', risk.id)}>
              <IconRisk size={15} className="dim" />
              <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{risk.name}</span>
                <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>İlgili risk · {risk.code}</span>
              </span>
              <ScoreChip assessment={risk.residual} />
            </button>
          ) : null}
          {control ? (
            <button className="rel-control" onClick={() => select('control', control.id)}>
              <IconControl size={15} className="dim" />
              <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{control.name}</span>
                <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>İlgili kontrol · {control.code}</span>
              </span>
            </button>
          ) : null}
          {node ? (
            <button className="rel-control" onClick={() => select('node', node.id)}>
              <IconChevronRight size={15} className="dim" />
              <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{node.name}</span>
                <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>İlgili süreç adımı · {node.code}</span>
              </span>
            </button>
          ) : null}
        </div>
      </div>

      <ActionFormModal open={editing} onClose={() => setEditing(false)} actionId={action.id} />
    </Drawer>
  );
}

/* ================================================================== */
/* Seçime göre doğru paneli açan sarmalayıcı                           */
/* ================================================================== */

export function SelectionDrawer() {
  const { selection, clearSelection } = useUi();
  if (!selection.id || !selection.kind) return null;
  if (selection.kind === 'node') return <NodeDetail nodeId={selection.id} onClose={clearSelection} />;
  if (selection.kind === 'risk') return <RiskDetail riskId={selection.id} onClose={clearSelection} />;
  if (selection.kind === 'control') return <ControlDetail controlId={selection.id} onClose={clearSelection} />;
  if (selection.kind === 'action') return <ActionDetail actionId={selection.id} onClose={clearSelection} />;
  return null;
}
