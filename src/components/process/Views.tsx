import { useMemo } from 'react';
import type { ProcessNode } from '@/types/grc';
import { useData } from '@/store/useData';
import { useUi } from '@/store/useUi';
import { controlsOf, descendants, risksOf, rollup, sortRisksBySeverity, type NodeTree } from '@/lib/selectors';
import { formatDate, isReviewOverdue, levelOf, monthsSince, score } from '@/lib/riskMath';
import {
  controlEffectivenessLabels, controlExecutionLabels, controlNatureLabels, nodeKindLabels,
  riskLevelLabels,
} from '@/lib/labels';
import { userById, userName } from '@/data/org';
import {
  Avatar, Badge, Collapsible, EmptyState, Maturity, Meter, ScoreChip,
} from '@/components/common/Primitives';
import { ControlCard, RiskCard } from './DetailPanel';
import {
  IconChevronRight, IconClock, IconControl, IconRisk, IconWarning,
} from '@/components/common/Icons';

/* ================================================================== */
/* 1) Süreç haritası — ana süreç kartları                              */
/* ================================================================== */

export function ProcessMap({ nodes, onOpen }: { nodes: ProcessNode[]; onOpen: (id: string) => void }) {
  const data = useData((s) => s.data);
  const { expanded, toggleExpanded } = useUi();

  return (
    <div className="proc-grid">
      {nodes.map((node) => {
        const roll = rollup(data, node.id);
        const level = levelOf(roll.maxResidualScore);
        const open = Boolean(expanded[node.id]);
        const children = data.nodes.filter((n) => n.parentId === node.id).sort((a, b) => a.order - b.order);

        return (
          <div className={`proc-card lvl-${level} ${open ? 'open' : ''}`} key={node.id}>
            <div className="proc-card-head">
              <div className="stack grow" style={{ minWidth: 0 }}>
                <span className="code">{node.code}</span>
                <h3>{node.name}</h3>
              </div>
              <Avatar user={userById.get(node.ownerId)} />
            </div>
            <p className="desc clamp-2">{node.description}</p>

            <div className="proc-stats">
              <div className="stat">
                <div className="k">Alt süreç</div>
                <div className="v num">{roll.subprocessCount}</div>
              </div>
              <div className="stat">
                <div className="k">Risk</div>
                <div className="v num">{roll.riskIds.length}</div>
              </div>
              <div className="stat">
                <div className="k">Kritik</div>
                <div className={`v num ${roll.criticalRiskCount ? 'alert' : ''}`}>{roll.criticalRiskCount}</div>
              </div>
              <div className="stat">
                <div className="k">Kontrol</div>
                <div className="v num">{roll.controlIds.length}</div>
              </div>
            </div>
            <div className="proc-stats" style={{ borderTop: 0 }}>
              <div className="stat">
                <div className="k">Açık aksiyon</div>
                <div className={`v num ${roll.overdueActionCount ? 'warn' : ''}`}>{roll.openActionCount}</div>
              </div>
              <div className="stat">
                <div className="k">Zayıf kontrol</div>
                <div className={`v num ${roll.ineffectiveControlCount ? 'warn' : ''}`}>{roll.ineffectiveControlCount}</div>
              </div>
              <div className="stat" style={{ gridColumn: 'span 2' }}>
                <div className="k">Olgunluk</div>
                <div className="row gap-2" style={{ marginTop: 4 }}>
                  <Maturity level={roll.averageMaturity} />
                  <span className="num dim" style={{ fontSize: 'var(--text-xs)' }}>
                    {roll.averageMaturity.toFixed(1)}/5
                  </span>
                </div>
              </div>
            </div>

            <Collapsible open={open}>
              <div className="stack gap-1" style={{ padding: 'var(--s3) var(--s4)', borderTop: '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
                {children.map((child) => {
                  const cr = rollup(data, child.id);
                  return (
                    <button className="tree-row" key={child.id} onClick={() => onOpen(child.id)}>
                      <span className="kind-dot subprocess" />
                      <span className="label">{child.name}</span>
                      <span className="meta">
                        {cr.criticalRiskCount ? <Badge level="critical">{cr.criticalRiskCount}</Badge> : null}
                        <span className="dim num" style={{ fontSize: 'var(--text-2xs)' }}>{cr.activityCount} faaliyet</span>
                        <IconChevronRight size={13} className="dim" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </Collapsible>

            <div className="proc-card-foot">
              {roll.reviewOverdue ? (
                <Badge level="high" title={`Son gözden geçirme: ${formatDate(node.lastReviewedAt)}`}>
                  <IconClock size={11} /> Gözden geçirme gecikmiş
                </Badge>
              ) : (
                <span className="row gap-1"><IconClock size={12} /> Güncelleme {formatDate(roll.lastUpdatedAt)}</span>
              )}
              <span className="spacer" />
              <button className="btn btn-sm btn-ghost" onClick={() => toggleExpanded(node.id)}>
                {open ? 'Kapat' : 'Alt süreçler'}
                <IconChevronRight size={13} className={`chevron ${open ? 'open' : ''}`} />
              </button>
              <button className="btn btn-sm btn-primary" onClick={() => onOpen(node.id)}>Süreci aç</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/* 2) Hiyerarşik ağaç                                                  */
/* ================================================================== */

export function ProcessTree({
  tree, onSelect, selectedId, depth = 0,
}: { tree: NodeTree; onSelect: (id: string) => void; selectedId?: string | null; depth?: number }) {
  const data = useData((s) => s.data);
  const { expanded, toggleExpanded } = useUi();
  const open = depth === 0 ? true : Boolean(expanded[tree.id]);
  const hasChildren = tree.children.length > 0;
  const risks = risksOf(data, tree.riskIds);
  const worst = risks.length ? Math.max(...risks.map((r) => score(r.residual))) : 0;

  return (
    <div className="tree-node">
      <div
        className={`tree-row ${selectedId === tree.id ? 'selected' : ''}`}
        role="treeitem"
        aria-expanded={hasChildren ? open : undefined}
      >
        <button
          className={`tree-toggle ${hasChildren ? '' : 'placeholder'}`}
          onClick={() => hasChildren && toggleExpanded(tree.id)}
          aria-label={open ? 'Daralt' : 'Genişlet'}
        >
          <IconChevronRight size={13} className={`chevron ${open ? 'open' : ''}`} />
        </button>
        <span className={`kind-dot ${tree.kind}`} />
        <button
          className="label"
          onClick={() => onSelect(tree.id)}
          style={{ border: 0, background: 'none', textAlign: 'left', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}
        >
          {tree.name}
        </button>
        <span className="meta">
          <span className="code">{tree.code}</span>
          {tree.controlIds.length ? (
            <span className="dim num tip" style={{ fontSize: 'var(--text-2xs)' }}>
              <IconControl size={11} /> {tree.controlIds.length}
              <span className="tip-content">{tree.controlIds.length} kontrol</span>
            </span>
          ) : null}
          {risks.length ? <ScoreChip assessment={{ likelihood: 1, impact: worst }} /> : null}
          {isReviewOverdue(tree) && tree.kind !== 'step' ? (
            <Badge level="high" title={`${monthsSince(tree.lastReviewedAt)} aydır gözden geçirilmedi`}>
              <IconClock size={10} />
            </Badge>
          ) : null}
        </span>
      </div>

      {hasChildren ? (
        <Collapsible open={open}>
          <div className="tree-children">
            {tree.children.map((child) => (
              <ProcessTree key={child.id} tree={child} onSelect={onSelect} selectedId={selectedId} depth={depth + 1} />
            ))}
          </div>
        </Collapsible>
      ) : null}
    </div>
  );
}

/* ================================================================== */
/* 3) Akış (journey) görünümü                                          */
/* ================================================================== */

export function FlowView({ rootId, onSelect, selectedId }: { rootId: string; onSelect: (id: string) => void; selectedId?: string | null }) {
  const data = useData((s) => s.data);
  const lanes = useMemo(() => {
    const root = data.nodes.find((n) => n.id === rootId);
    if (!root) return [];
    const children = data.nodes.filter((n) => n.parentId === rootId).sort((a, b) => a.order - b.order);
    if (!children.length) return [{ lane: root, steps: [] as ProcessNode[] }];

    // Çocuklar zaten faaliyet ya da iş adımı ise tek şerit olarak akıtılır; böylece
    // akış her zaman risk ve kontrolleri taşıyan seviyeyi gösterir.
    if (children.every((c) => c.kind === 'activity' || c.kind === 'step')) {
      return [{ lane: root, steps: children }];
    }
    return children.map((sub) => ({
      lane: sub,
      steps: data.nodes.filter((n) => n.parentId === sub.id).sort((a, b) => a.order - b.order),
    }));
  }, [data, rootId]);

  let sequence = 0;

  return (
    <div className="flow">
      {lanes.map(({ lane, steps }) => (
        <div className="flow-lane" key={lane.id}>
          <div className="flow-lane-head">
            <span className="eyebrow">{nodeKindLabels[lane.kind]}</span>
            <button
              onClick={() => onSelect(lane.id)}
              style={{ border: 0, background: 'none', padding: 0, font: 'inherit', fontWeight: 600, color: 'var(--ink-900)', cursor: 'pointer', fontSize: 'var(--text-md)' }}
            >
              {lane.name}
            </button>
            {lane.slaDays ? <Badge tone="plain">{lane.slaDays} iş günü</Badge> : null}
            <span className="rail" />
            <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>{userName(lane.ownerId)}</span>
          </div>

          <div className="flow-track">
            {steps.map((step) => {
              sequence += 1;
              // Sayımlar adımın kendisini ve alt adımlarını kapsar.
              const roll = rollup(data, step.id);
              const risks = risksOf(data, roll.riskIds);
              const worst = risks.length ? Math.max(...risks.map((r) => score(r.residual))) : 0;
              const controls = controlsOf(data, roll.controlIds);
              const weak = controls.filter((c) => c.effectiveness !== 'effective').length;
              return (
                <button
                  key={step.id}
                  className={`flow-step ${selectedId === step.id ? 'selected' : ''}`}
                  onClick={() => onSelect(step.id)}
                >
                  <span className="row gap-2">
                    <span className="seq">{sequence}</span>
                    {step.criticalPoints.length ? (
                      <span className="tip" style={{ display: 'inline-flex', color: 'var(--risk-high)' }}>
                        <IconWarning size={14} />
                        <span className="tip-content">{step.criticalPoints.map((c) => c.label).join(' · ')}</span>
                      </span>
                    ) : null}
                    <span className="spacer" />
                    {risks.length ? <ScoreChip assessment={{ likelihood: 1, impact: worst }} /> : null}
                  </span>
                  <h4>{step.name}</h4>
                  <span className="dim clamp-2" style={{ fontSize: 'var(--text-xs)' }}>{step.description}</span>
                  <span className="chips">
                    <Badge tone="plain"><IconRisk size={10} /> {risks.length}</Badge>
                    <Badge tone="plain"><IconControl size={10} /> {controls.length}</Badge>
                    {weak ? <Badge level="medium">{weak} zayıf</Badge> : null}
                  </span>
                </button>
              );
            })}
            {!steps.length ? <EmptyState title="Bu alt süreçte tanımlı faaliyet yok" /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/* 4) Risk görünümü                                                    */
/* ================================================================== */

export function RiskView({ rootId }: { rootId: string }) {
  const data = useData((s) => s.data);
  const { select, highlighted, setHighlighted } = useUi();

  const groups = useMemo(() => {
    const root = data.nodes.find((n) => n.id === rootId);
    if (!root) return [];
    const all = [root, ...descendants(data.nodes, rootId)];
    return all
      .filter((n) => n.riskIds.length > 0)
      .map((n) => ({ node: n, risks: sortRisksBySeverity(risksOf(data, n.riskIds)) }));
  }, [data, rootId]);

  if (!groups.length) {
    return <EmptyState icon={<IconRisk size={30} />} title="Bu kapsamda tanımlı risk bulunmuyor" />;
  }

  return (
    <div className="stack gap-6">
      {groups.map(({ node, risks }) => (
        <div key={node.id}>
          <div className="section-head">
            <div className="row gap-2">
              <span className={`kind-dot ${node.kind}`} style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--brand-500)' }} />
              <button className="row gap-2" onClick={() => select('node', node.id)}
                style={{ border: 0, background: 'none', padding: 0, font: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
                {node.name}
              </button>
              <span className="dim mono" style={{ fontSize: 'var(--text-2xs)' }}>{node.code}</span>
            </div>
            <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>{risks.length} risk · {node.controlIds.length} kontrol</span>
          </div>

          {node.criticalPoints.length ? (
            <div className="critical-list" style={{ marginBottom: 'var(--s3)' }}>
              {node.criticalPoints.map((cp) => (
                <div className={`critical-item ${cp.kind}`} key={cp.id}>
                  <span className="icon"><IconWarning size={15} /></span>
                  <span className="stack" style={{ gap: 2 }}>
                    <span className="t">⚠ {cp.label}</span>
                    <span className="n">{cp.note}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="rc-grid">
            {risks.map((risk) => (
              <RiskCard
                key={risk.id}
                risk={risk}
                highlighted={highlighted.has(risk.id)}
                faded={highlighted.size > 0 && !highlighted.has(risk.id)}
                onClick={() => {
                  setHighlighted([risk.id, ...risk.controlIds]);
                  select('risk', risk.id);
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/* 5) Kontrol görünümü                                                 */
/* ================================================================== */

export function ControlView({ rootId }: { rootId: string }) {
  const data = useData((s) => s.data);
  const { select, highlighted, setHighlighted } = useUi();

  const controls = useMemo(() => {
    const root = data.nodes.find((n) => n.id === rootId);
    if (!root) return [];
    const ids = new Set([root.id, ...descendants(data.nodes, rootId).map((n) => n.id)]);
    return data.controls.filter((c) => !c.archived && c.processNodeIds.some((id) => ids.has(id)));
  }, [data, rootId]);

  const byNature = useMemo(() => {
    const map = new Map<string, typeof controls>();
    for (const c of controls) map.set(c.nature, [...(map.get(c.nature) ?? []), c]);
    return [...map.entries()];
  }, [controls]);

  if (!controls.length) {
    return <EmptyState icon={<IconControl size={30} />} title="Bu kapsamda tanımlı kontrol bulunmuyor" />;
  }

  return (
    <div className="stack gap-6">
      <div className="grid cols-4">
        {(['preventive', 'detective', 'corrective'] as const).map((n) => (
          <div className="card card-pad" key={n}>
            <span className="eyebrow">{controlNatureLabels[n]}</span>
            <div className="metric-value" style={{ fontSize: 'var(--text-xl)' }}>
              {controls.filter((c) => c.nature === n).length}
            </div>
          </div>
        ))}
        <div className="card card-pad">
          <span className="eyebrow">Otomatik kontrol oranı</span>
          <div className="metric-value" style={{ fontSize: 'var(--text-xl)' }}>
            %{Math.round((controls.filter((c) => c.execution === 'automated').length / controls.length) * 100)}
          </div>
        </div>
      </div>

      {byNature.map(([nature, list]) => (
        <div key={nature}>
          <div className="section-head">
            <h4>{controlNatureLabels[nature as 'preventive']} kontroller</h4>
            <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>{list.length} kontrol</span>
          </div>
          <div className="rc-grid">
            {list.map((control) => (
              <ControlCard
                key={control.id}
                control={control}
                highlighted={highlighted.has(control.id)}
                faded={highlighted.size > 0 && !highlighted.has(control.id)}
                onClick={() => {
                  setHighlighted([control.id, ...control.riskIds]);
                  select('control', control.id);
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/* 6) Yönetim görünümü                                                 */
/* ================================================================== */

export function ManagementView({ rootId, onSelect }: { rootId: string; onSelect: (id: string) => void }) {
  const data = useData((s) => s.data);
  const rows = useMemo(() => {
    const root = data.nodes.find((n) => n.id === rootId);
    if (!root) return [];
    const kids = data.nodes.filter((n) => n.parentId === rootId).sort((a, b) => a.order - b.order);
    const targets = kids.length ? kids : [root];
    return targets.map((n) => ({ node: n, roll: rollup(data, n.id) }));
  }, [data, rootId]);

  return (
    <div className="card">
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Süreç</th>
              <th>Sahip</th>
              <th className="num">Risk</th>
              <th className="num">Kritik</th>
              <th className="num">Yüksek</th>
              <th className="num">Kontrol</th>
              <th className="num">Zayıf kontrol</th>
              <th className="num">Açık aksiyon</th>
              <th className="num">Gecikmiş</th>
              <th>En yüksek artık risk</th>
              <th>Olgunluk</th>
              <th>Gözden geçirme</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ node, roll }) => (
              <tr key={node.id} className="clickable" onClick={() => onSelect(node.id)}>
                <td>
                  <div className="stack" style={{ gap: 2 }}>
                    <span style={{ fontWeight: 600 }}>{node.name}</span>
                    <span className="dim mono" style={{ fontSize: 'var(--text-2xs)' }}>{node.code} · {nodeKindLabels[node.kind]}</span>
                  </div>
                </td>
                <td>
                  <div className="row gap-2">
                    <Avatar user={userById.get(node.ownerId)} size="sm" />
                    <span className="truncate">{userName(node.ownerId)}</span>
                  </div>
                </td>
                <td className="num">{roll.riskIds.length}</td>
                <td className="num">{roll.criticalRiskCount ? <Badge level="critical">{roll.criticalRiskCount}</Badge> : '—'}</td>
                <td className="num">{roll.highRiskCount ? <Badge level="high">{roll.highRiskCount}</Badge> : '—'}</td>
                <td className="num">{roll.controlIds.length}</td>
                <td className="num">{roll.ineffectiveControlCount || '—'}</td>
                <td className="num">{roll.openActionCount || '—'}</td>
                <td className="num">{roll.overdueActionCount ? <Badge level="high">{roll.overdueActionCount}</Badge> : '—'}</td>
                <td>
                  <div className="row gap-2">
                    <ScoreChip assessment={{ likelihood: 1, impact: roll.maxResidualScore }} />
                    <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>
                      {riskLevelLabels[levelOf(roll.maxResidualScore)]}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="row gap-2">
                    <Maturity level={roll.averageMaturity} />
                    <span className="dim num" style={{ fontSize: 'var(--text-2xs)' }}>{roll.averageMaturity.toFixed(1)}</span>
                  </div>
                </td>
                <td>
                  {roll.reviewOverdue
                    ? <Badge level="high">Gecikmiş</Badge>
                    : <span className="dim">{formatDate(node.nextReviewAt)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Kontrol etkinlik dağılımı — yönetim görünümü kartı. */
export function EffectivenessSummary({ rootId }: { rootId: string }) {
  const data = useData((s) => s.data);
  const controls = useMemo(() => {
    const ids = new Set([rootId, ...descendants(data.nodes, rootId).map((n) => n.id)]);
    return data.controls.filter((c) => !c.archived && c.processNodeIds.some((id) => ids.has(id)));
  }, [data, rootId]);

  const groups = (['effective', 'partially_effective', 'ineffective', 'not_tested'] as const)
    .map((e) => ({ key: e, label: controlEffectivenessLabels[e], count: controls.filter((c) => c.effectiveness === e).length }))
    .filter((g) => g.count > 0);

  return (
    <div className="card card-pad stack gap-3">
      <span className="eyebrow">Kontrol etkinliği</span>
      {groups.map((g) => (
        <div className="stack gap-1" key={g.key}>
          <div className="row between" style={{ fontSize: 'var(--text-sm)' }}>
            <span className="row gap-2">
              <span className={`eff eff-${g.key}`} style={{ width: 8, height: 8, borderRadius: '50%' }} />
              {g.label}
            </span>
            <span className="num">{g.count}</span>
          </div>
          <Meter value={(g.count / Math.max(1, controls.length)) * 100} />
        </div>
      ))}
      <div className="hairline" />
      <div className="row between" style={{ fontSize: 'var(--text-xs)' }}>
        <span className="dim">Manuel / otomatik</span>
        <span>
          {controls.filter((c) => c.execution === 'manual').length} / {controls.filter((c) => c.execution === 'automated').length}
          <span className="dim"> ({controlExecutionLabels.semi_automated}: {controls.filter((c) => c.execution === 'semi_automated').length})</span>
        </span>
      </div>
    </div>
  );
}
