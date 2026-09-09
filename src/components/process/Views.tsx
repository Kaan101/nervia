import { useMemo } from 'react';
import { useData } from '@/store/useData';
import { useUi } from '@/store/useUi';
import {
  activeNodes, descendants, risksOf, rollup, sortRisksBySeverity,
} from '@/lib/selectors';
import { formatDate, levelOf } from '@/lib/riskMath';
import { controlNatureLabels, nodeKindLabels, riskLevelLabels } from '@/lib/labels';
import { userById, userName } from '@/data/org';
import { Avatar, Badge, EmptyState, Maturity, ScoreChip } from '@/components/common/Primitives';
import { ControlCard, RiskCard } from './DetailPanel';
import { IconControl, IconRisk, IconWarning } from '@/components/common/Icons';

/* ================================================================== */
/* Analiz mercekleri                                                   */
/*                                                                     */
/* Süreç haritası, ağaç ve yatay akış görünümleri Süreç Akışı ekranında  */
/* birleşti: seçici haritanın, iç içe açılma ağacın, dikey sıra da      */
/* akışın yerini aldı. Aynı ağaca farklı açılardan bakan üç mercek      */
/* burada kaldı ve o ekranın görünüm şeridinden açılır.                 */
/* ================================================================== */

/* ---- Risk görünümü ---- */

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

/* ---- Kontrol görünümü ---- */

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

/* ---- Yönetim görünümü ---- */

export function ManagementView({ rootId, onSelect }: { rootId: string; onSelect: (id: string) => void }) {
  const data = useData((s) => s.data);
  const rows = useMemo(() => {
    const root = data.nodes.find((n) => n.id === rootId);
    if (!root) return [];
    const kids = activeNodes(data.nodes)
      .filter((n) => n.parentId === rootId)
      .sort((a, b) => a.order - b.order);
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