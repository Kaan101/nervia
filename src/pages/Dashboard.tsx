import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/store/useData';
import { useAuth } from '@/store/useAuth';
import { useUi } from '@/store/useUi';
import {
  distributionBy, mainProcessOfRisk, portfolio, riskTrend, rollup, sortRisksBySeverity,
} from '@/lib/selectors';
import { analyseProcesses } from '@/lib/ai';
import { formatDate, isOverdue, kriStatus, kriValue, monthsSince, riskLevel } from '@/lib/riskMath';
import {
  controlEffectivenessLabels, riskCategoryLabels, riskLevelLabels,
} from '@/lib/labels';
import { unitName, userName } from '@/data/org';
import {
  Badge, EmptyState, Metric, Meter, ScoreChip, SectionHeading, TrendIcon,
} from '@/components/common/Primitives';
import { Donut, LevelLegend, Sparkline, StackedBarList, TrendChart, levelMark } from '@/components/charts/Charts';
import { SelectionDrawer } from '@/components/process/DetailPanel';
import {
  IconAction, IconArrowRight, IconClock, IconSparkles, IconWarning,
} from '@/components/common/Icons';

export function Dashboard() {
  const data = useData((s) => s.data);
  const activeControls = useData((s) => s.activeControls);
  const activeActions = useData((s) => s.activeActions);
  const currentUser = useAuth((s) => s.currentUser);
  const select = useUi((s) => s.select);
  const navigate = useNavigate();

  const stats = useMemo(() => portfolio(data), [data]);
  const trend = useMemo(() => riskTrend(data, 12), [data]);
  const findings = useMemo(() => analyseProcesses(data), [data]);

  const byUnit = useMemo(
    () => distributionBy(data, (r) => ({ key: r.unitId, label: unitName(r.unitId) })).slice(0, 8),
    [data],
  );
  const byProcess = useMemo(
    () => distributionBy(data, (r) => {
      const p = mainProcessOfRisk(data, r);
      return p ? { key: p.id, label: p.name } : null;
    }).slice(0, 8),
    [data],
  );

  const topRisks = useMemo(() => sortRisksBySeverity(data.risks).slice(0, 6), [data]);
  const overdueActions = useMemo(
    () => activeActions
      .filter((a) => (a.status === 'open' || a.status === 'in_progress') && isOverdue(a.dueDate))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [data],
  );
  const staleProcesses = useMemo(
    () => data.nodes
      .filter((n) => (n.kind === 'process' || n.kind === 'subprocess' || n.kind === 'activity') && new Date(n.nextReviewAt) < new Date('2026-09-04'))
      .sort((a, b) => a.lastReviewedAt.localeCompare(b.lastReviewedAt))
      .slice(0, 6),
    [data],
  );

  const effectivenessSlices = (['effective', 'partially_effective', 'ineffective', 'not_tested'] as const)
    .map((e, i) => ({
      key: e,
      label: controlEffectivenessLabels[e],
      value: activeControls.filter((c) => c.effectiveness === e).length,
      color: [levelMark.low, levelMark.medium, levelMark.critical, 'var(--ink-300)'][i],
    }))
    .filter((s) => s.value > 0);

  const breachedKris = data.kris.filter((k) => kriStatus(k) !== 'green');

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack">
          <span className="eyebrow">Kurumsal Risk Görünümü · {formatDate('2026-09-04')}</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>
            İyi günler{currentUser ? `, ${currentUser.name.split(' ')[0]}` : ''}
          </h1>
          <p className="lede">
            Organizasyonun {stats.processCount} ana sürecinde {stats.riskCount} risk ve {stats.controlCount} kontrol
            izleniyor. Bugün dikkat isteyen {findings.filter((f) => f.severity === 'critical').length} kritik tespit var.
          </p>
        </div>
        <div className="row gap-2">
          <button className="btn" onClick={() => navigate('/isi-haritasi')}>Risk ısı haritası</button>
          <button className="btn btn-primary" onClick={() => navigate('/asistan')}>
            <IconSparkles size={14} /> Analiz Asistanı
          </button>
        </div>
      </div>

      {/* Özet göstergeler */}
      <div className="grid cols-5">
        <div className="card card-pad"><Metric compact label="Toplam süreç" value={stats.processCount} sub={`${stats.activityCount} faaliyet`} /></div>
        <div className="card card-pad"><Metric compact label="Toplam risk" value={stats.riskCount} sub={`Ort. artık skor ${stats.averageResidual.toFixed(1)}`} /></div>
        <div className="card card-pad"><Metric compact label="Kritik risk" value={stats.criticalRiskCount} tone={stats.criticalRiskCount ? 'alert' : 'default'} sub={`${stats.highRiskCount} yüksek risk`} /></div>
        <div className="card card-pad"><Metric compact label="Toplam kontrol" value={stats.controlCount} sub={`${stats.keyControlCount} kritik kontrol`} /></div>
        <div className="card card-pad"><Metric compact label="Etkin olmayan kontrol" value={stats.ineffectiveControlCount} tone={stats.ineffectiveControlCount ? 'warn' : 'default'} sub={`${stats.untestedControlCount} test edilmemiş`} /></div>
      </div>

      <div className="grid cols-5" style={{ marginTop: 'var(--s4)' }}>
        <div className="card card-pad"><Metric compact label="Açık aksiyon" value={stats.openActionCount} sub={`${stats.actionCount} toplam aksiyon`} /></div>
        <div className="card card-pad"><Metric compact label="Gecikmiş aksiyon" value={stats.overdueActionCount} tone={stats.overdueActionCount ? 'alert' : 'default'} /></div>
        <div className="card card-pad"><Metric compact label="Gözden geçirmesi geçen" value={stats.reviewOverdueCount} tone={stats.reviewOverdueCount ? 'warn' : 'default'} sub={`${stats.reviewDueSoonCount} süreç 45 gün içinde`} /></div>
        <div className="card card-pad"><Metric compact label="Risk iştahı aşımı" value={stats.outsideAppetiteCount} tone={stats.outsideAppetiteCount ? 'warn' : 'default'} sub="Aksiyon planı zorunlu" /></div>
        <div className="card card-pad"><Metric compact label="Süresi geçen doküman" value={stats.expiredDocumentCount} tone={stats.expiredDocumentCount ? 'warn' : 'default'} sub={`${stats.documentCount} doküman`} /></div>
      </div>

      {/* Trend + dağılımlar */}
      <div className="section grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)' }}>
        <div className="card">
          <div className="card-head">
            <div className="stack" style={{ gap: 2 }}>
              <h4>Risk trendi</h4>
              <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>Son 12 ay · güncel değerlendirmelerden ve trend yönlerinden projekte edilmiştir</span>
            </div>
          </div>
          <div className="card-body">
            <TrendChart points={trend} />
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h4>Kontrol etkinliği</h4></div>
          <div className="card-body">
            <Donut
              slices={effectivenessSlices}
              heroValue={`%${Math.round((activeControls.filter((c) => c.effectiveness === 'effective').length / Math.max(1, activeControls.length)) * 100)}`}
              heroLabel="Etkin"
            />
          </div>
        </div>
      </div>

      <div className="section grid cols-2">
        <div className="card">
          <div className="card-head">
            <h4>Birim bazlı risk dağılımı</h4>
            <LevelLegend />
          </div>
          <div className="card-body"><StackedBarList rows={byUnit} /></div>
        </div>
        <div className="card">
          <div className="card-head">
            <h4>Süreç bazlı risk dağılımı</h4>
            <LevelLegend />
          </div>
          <div className="card-body">
            <StackedBarList rows={byProcess} onSelect={(key) => navigate(`/surecler/${key}`)} />
          </div>
        </div>
      </div>

      {/* En yüksek riskler + tespitler */}
      <div className="section grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <div className="card">
          <div className="card-head">
            <h4>En yüksek artık riskler</h4>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/riskler')}>Tümü <IconArrowRight size={13} /></button>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Risk</th><th>Süreç</th><th className="num">Skor</th><th>Seviye</th><th>Trend</th></tr>
              </thead>
              <tbody>
                {topRisks.map((r) => {
                  const proc = mainProcessOfRisk(data, r);
                  return (
                    <tr key={r.id} className="clickable" onClick={() => select('risk', r.id)}>
                      <td>
                        <div className="stack" style={{ gap: 2 }}>
                          <span style={{ fontWeight: 500 }}>{r.name}</span>
                          <span className="dim mono" style={{ fontSize: 'var(--text-2xs)' }}>{r.code} · {riskCategoryLabels[r.category]}</span>
                        </div>
                      </td>
                      <td className="dim">{proc?.name ?? '—'}</td>
                      <td className="num"><ScoreChip assessment={r.residual} /></td>
                      <td><Badge level={riskLevel(r.residual)}><span className="dot" />{riskLevelLabels[riskLevel(r.residual)]}</Badge></td>
                      <td><TrendIcon trend={r.trend} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h4>Dikkat isteyen tespitler</h4>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/asistan')}>Analiz <IconArrowRight size={13} /></button>
          </div>
          <div className="card-body stack gap-2" style={{ maxHeight: 420, overflowY: 'auto' }}>
            {findings.slice(0, 10).map((f) => (
              <div
                key={f.id}
                className={`callout lvl-${f.severity === 'critical' ? 'critical' : f.severity === 'high' ? 'high' : f.severity === 'medium' ? 'medium' : 'low'}`}
              >
                <IconWarning size={15} style={{ flex: '0 0 auto', marginTop: 2 }} />
                <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                  <span className="callout-title">{f.title}{f.processName ? ` · ${f.processName}` : ''}</span>
                  <span className="clamp-2">{f.detail}</span>
                </span>
              </div>
            ))}
            {!findings.length ? <EmptyState title="Açık tespit yok" /> : null}
          </div>
        </div>
      </div>

      {/* KRI + gecikmişler */}
      <div className="section grid cols-3">
        <div className="card">
          <div className="card-head">
            <h4>KRI göstergeleri</h4>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/kri')}>Tümü</button>
          </div>
          <div className="card-body stack gap-4">
            {(breachedKris.length ? breachedKris : data.kris).slice(0, 3).map((k) => {
              const status = kriStatus(k);
              const value = kriValue(k);
              return (
                <div className="stack gap-2" key={k.id}>
                  <div className="row between gap-3">
                    <span className="stack" style={{ gap: 1, minWidth: 0 }}>
                      <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{k.name}</span>
                      <span className="dim" style={{ fontSize: 'var(--text-2xs)' }}>Eşik: {k.greenMax} / {k.amberMax} {k.unit}</span>
                    </span>
                    <span className={`num status-${status}`} style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>
                      {value}{k.unit === '%' ? '%' : ''}
                    </span>
                  </div>
                  <Sparkline values={k.readings.map((r) => r.value)} greenMax={k.greenMax} amberMax={k.amberMax} direction={k.direction} width={280} height={40} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h4>Gecikmiş aksiyonlar</h4>
            <Badge level={overdueActions.length ? 'critical' : 'low'}>{overdueActions.length}</Badge>
          </div>
          <div className="card-body stack gap-3" style={{ maxHeight: 320, overflowY: 'auto' }}>
            {overdueActions.slice(0, 6).map((a) => (
              <button className="stack gap-1" key={a.id} onClick={() => select('action', a.id)}
                style={{ border: 0, background: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}>
                <span className="row between gap-2">
                  <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{a.title}</span>
                  <span className="num dim" style={{ fontSize: 'var(--text-xs)' }}>%{a.progress}</span>
                </span>
                <Meter value={a.progress} />
                <span className="row gap-2 dim" style={{ fontSize: 'var(--text-2xs)' }}>
                  <IconClock size={11} /> {formatDate(a.dueDate)} · {userName(a.ownerId)}
                </span>
              </button>
            ))}
            {!overdueActions.length ? <EmptyState icon={<IconAction size={26} />} title="Gecikmiş aksiyon yok" /> : null}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h4>Gözden geçirme bekleyen süreçler</h4>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/gozden-gecirme')}>Tümü</button>
          </div>
          <div className="card-body stack gap-3" style={{ maxHeight: 320, overflowY: 'auto' }}>
            {staleProcesses.map((n) => (
              <button className="stack gap-1" key={n.id} onClick={() => select('node', n.id)}
                style={{ border: 0, background: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}>
                <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{n.name}</span>
                <span className="row gap-2 dim" style={{ fontSize: 'var(--text-2xs)' }}>
                  <IconClock size={11} />
                  Bu süreç {monthsSince(n.lastReviewedAt)} aydır gözden geçirilmedi · {userName(n.ownerId)}
                </span>
              </button>
            ))}
            {!staleProcesses.length ? <EmptyState title="Tüm süreçler güncel" /> : null}
          </div>
        </div>
      </div>

      {/* Süreç sağlığı tablosu */}
      <div className="section">
        <SectionHeading title="Süreç sağlık özeti" />
        <div className="card">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Ana süreç</th><th>Sahip</th><th className="num">Risk</th><th className="num">Kritik</th>
                  <th className="num">Kontrol</th><th className="num">Zayıf</th><th className="num">Açık aksiyon</th>
                  <th>Risk profili</th>
                </tr>
              </thead>
              <tbody>
                {data.nodes.filter((n) => n.kind === 'process').map((n) => {
                  const roll = rollup(data, n.id);
                  const total = Math.max(1, roll.riskIds.length);
                  const risks = roll.riskIds.map((id) => data.risks.find((r) => r.id === id)!).filter(Boolean);
                  return (
                    <tr key={n.id} className="clickable" onClick={() => navigate(`/surecler/${n.id}`)}>
                      <td style={{ fontWeight: 600 }}>{n.name}</td>
                      <td className="dim">{userName(n.ownerId)}</td>
                      <td className="num">{roll.riskIds.length}</td>
                      <td className="num">{roll.criticalRiskCount || '—'}</td>
                      <td className="num">{roll.controlIds.length}</td>
                      <td className="num">{roll.ineffectiveControlCount || '—'}</td>
                      <td className="num">{roll.openActionCount || '—'}</td>
                      <td style={{ minWidth: 180 }}>
                        <span className="bar-track">
                          {(['low', 'medium', 'high', 'critical'] as const).map((lvl) => {
                            const count = risks.filter((r) => riskLevel(r.residual) === lvl).length;
                            if (!count) return null;
                            return (
                              <span key={lvl} title={`${riskLevelLabels[lvl]}: ${count}`}
                                style={{ width: `${(count / total) * 100}%`, background: levelMark[lvl], borderRight: '2px solid var(--surface)' }} />
                            );
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SelectionDrawer />
    </div>
  );
}
