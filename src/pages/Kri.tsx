import { useMemo } from 'react';
import { useData } from '@/store/useData';
import { useUi } from '@/store/useUi';
import { kriStatus, kriValue, riskLevel } from '@/lib/riskMath';
import { riskLevelLabels } from '@/lib/labels';
import { userName } from '@/data/org';
import { Badge, EmptyState, Metric, ScoreChip } from '@/components/common/Primitives';
import { Sparkline } from '@/components/charts/Charts';
import { SelectionDrawer } from '@/components/process/DetailPanel';
import { IconTarget } from '@/components/common/Icons';

const statusLabel = { green: 'Yeşil', amber: 'Sarı', red: 'Kırmızı', unknown: 'Veri yok' } as const;

export function KriPage() {
  const data = useData((s) => s.data);
  const select = useUi((s) => s.select);

  const rows = useMemo(
    () => data.kris.map((k) => ({
      kri: k,
      risk: data.risks.find((r) => r.id === k.riskId),
      status: kriStatus(k),
      value: kriValue(k),
    })),
    [data],
  );

  const counts = {
    green: rows.filter((r) => r.status === 'green').length,
    amber: rows.filter((r) => r.status === 'amber').length,
    red: rows.filter((r) => r.status === 'red').length,
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack">
          <span className="eyebrow">KRI · Key Risk Indicators</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>Anahtar risk göstergeleri</h1>
          <p className="lede">
            Her gösterge bir riske bağlıdır ve yeşil / sarı / kırmızı eşikleriyle izlenir. Eşik aşımı,
            bağlı riskin yeniden değerlendirilmesini tetikler.
          </p>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 'var(--s5)' }}>
        <div className="card card-pad"><Metric compact label="Tanımlı KRI" value={data.kris.length} /></div>
        <div className="card card-pad"><Metric compact label="Yeşil bant" value={counts.green} tone="good" /></div>
        <div className="card card-pad"><Metric compact label="Sarı bant" value={counts.amber} tone="warn" /></div>
        <div className="card card-pad"><Metric compact label="Kırmızı bant" value={counts.red} tone={counts.red ? 'alert' : 'default'} /></div>
      </div>

      {rows.length ? (
        <div className="grid auto-lg">
          {rows.map(({ kri, risk, status, value }) => (
            <div className="kri-card" key={kri.id}>
              <div className="row between gap-3 items-start">
                <div className="stack" style={{ gap: 3, minWidth: 0 }}>
                  <span className="row gap-2">
                    <span className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{kri.code}</span>
                    <Badge level={status === 'green' ? 'low' : status === 'amber' ? 'medium' : 'critical'}>
                      <span className="dot" />{statusLabel[status]}
                    </Badge>
                  </span>
                  <h4 style={{ fontSize: 'var(--text-sm)' }}>{kri.name}</h4>
                </div>
                <div className="kri-value">
                  <span className={`v status-${status}`}>{value}</span>
                  <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>{kri.unit}</span>
                </div>
              </div>

              <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>{kri.definition}</p>

              <Sparkline
                values={kri.readings.map((r) => r.value)}
                greenMax={kri.greenMax} amberMax={kri.amberMax}
                direction={kri.direction} width={360} height={54}
              />

              <div className="row gap-3 wrap" style={{ fontSize: 'var(--text-2xs)', color: 'var(--ink-500)' }}>
                <span className="row gap-1">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--risk-low-mark)' }} />
                  Yeşil {kri.direction === 'lower_better' ? `≤ ${kri.greenMax}` : `≥ ${kri.greenMax}`}
                </span>
                <span className="row gap-1">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--risk-medium-mark)' }} />
                  Sarı {kri.direction === 'lower_better' ? `${kri.greenMax}–${kri.amberMax}` : `${kri.amberMax}–${kri.greenMax}`}
                </span>
                <span className="row gap-1">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--risk-critical-mark)' }} />
                  Kırmızı {kri.direction === 'lower_better' ? `> ${kri.amberMax}` : `< ${kri.amberMax}`}
                </span>
              </div>

              {risk ? (
                <button className="rel-control" onClick={() => select('risk', risk.id)}>
                  <ScoreChip assessment={risk.residual} />
                  <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                    <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{risk.name}</span>
                    <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>
                      Bağlı risk · {riskLevelLabels[riskLevel(risk.residual)]} · {userName(kri.ownerId)}
                    </span>
                  </span>
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<IconTarget size={30} />} title="Tanımlı KRI bulunmuyor" />
      )}

      <SelectionDrawer />
    </div>
  );
}
