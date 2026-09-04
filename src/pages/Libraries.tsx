import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ControlCategory, ControlNature, RiskCategory } from '@/types/grc';
import { useData } from '@/store/useData';
import { useUi } from '@/store/useUi';
import { mainProcessOfRisk, sortRisksBySeverity } from '@/lib/selectors';
import { formatDate, isOutsideAppetite, monthsSince, riskLevel, score } from '@/lib/riskMath';
import {
  controlCategoryLabels, controlEffectivenessLabels, controlExecutionLabels,
  controlFrequencyLabels, controlNatureLabels, cosoComponentLabels, riskCategoryLabels,
  riskLevelLabels, riskStatusLabels, riskTreatmentLabels,
} from '@/lib/labels';
import { userName } from '@/data/org';
import { Badge, EmptyState, Metric, ScoreChip, Segmented, TrendIcon } from '@/components/common/Primitives';
import { LevelLegend, StackedBarList, levelMark } from '@/components/charts/Charts';
import { SelectionDrawer } from '@/components/process/DetailPanel';
import { IconSearch } from '@/components/common/Icons';

/* ================================================================== */
/* Risk Kütüphanesi                                                    */
/* ================================================================== */

export function RiskLibrary() {
  const data = useData((s) => s.data);
  const { select } = useUi();
  const { riskId } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [sort, setSort] = useState<'severity' | 'code' | 'assessed'>('severity');

  useEffect(() => {
    if (riskId) select('risk', riskId);
  }, [riskId, select]);

  const rows = useMemo(() => {
    let list = data.risks;
    if (query.trim()) {
      const q = query.toLocaleLowerCase('tr-TR');
      list = list.filter((r) => `${r.code} ${r.name} ${r.description}`.toLocaleLowerCase('tr-TR').includes(q));
    }
    if (category) list = list.filter((r) => r.category === category);
    if (level) list = list.filter((r) => riskLevel(r.residual) === level);
    if (sort === 'severity') return sortRisksBySeverity(list);
    if (sort === 'code') return [...list].sort((a, b) => a.code.localeCompare(b.code));
    return [...list].sort((a, b) => a.lastAssessedAt.localeCompare(b.lastAssessedAt));
  }, [data, query, category, level, sort]);

  const byCategory = useMemo(() => {
    const map = new Map<RiskCategory, { total: number; byLevel: Record<string, number> }>();
    for (const r of data.risks) {
      const entry = map.get(r.category) ?? { total: 0, byLevel: { low: 0, medium: 0, high: 0, critical: 0 } };
      entry.total += 1;
      entry.byLevel[riskLevel(r.residual)] += 1;
      map.set(r.category, entry);
    }
    return [...map.entries()]
      .map(([key, v]) => ({ key, label: riskCategoryLabels[key], total: v.total, byLevel: v.byLevel as never }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack">
          <span className="eyebrow">Risk Kütüphanesi</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>Kurumsal risk envanteri</h1>
          <p className="lede">
            Tüm risklerin merkezî kaydı. Riskler ISO 31000 kategorileriyle sınıflandırılır; her risk bir veya
            daha fazla süreç adımı ve kontrolle ilişkilendirilir.
          </p>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 'var(--s5)' }}>
        <div className="card card-pad"><Metric compact label="Toplam risk" value={data.risks.length} /></div>
        <div className="card card-pad"><Metric compact label="Kritik" value={data.risks.filter((r) => riskLevel(r.residual) === 'critical').length} tone="alert" /></div>
        <div className="card card-pad"><Metric compact label="İştah aşımı" value={data.risks.filter(isOutsideAppetite).length} tone="warn" /></div>
        <div className="card card-pad"><Metric compact label="Kontrolsüz risk" value={data.risks.filter((r) => r.controlIds.length === 0).length} tone={data.risks.some((r) => !r.controlIds.length) ? 'alert' : 'default'} /></div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 0.5fr)', marginBottom: 'var(--s5)' }}>
        <div className="card">
          <div className="card-head">
            <h4>Risk kategorisi dağılımı</h4>
            <LevelLegend />
          </div>
          <div className="card-body"><StackedBarList rows={byCategory} onSelect={(k) => setCategory(k === category ? '' : k)} selectedKey={category} /></div>
        </div>
        <div className="card">
          <div className="card-head"><h4>Değerlendirme güncelliği</h4></div>
          <div className="card-body stack gap-3">
            {[3, 6, 12].map((m) => {
              const count = data.risks.filter((r) => monthsSince(r.lastAssessedAt) > m).length;
              return (
                <div className="row between" key={m} style={{ fontSize: 'var(--text-sm)' }}>
                  <span className="muted">{m} aydan eski değerlendirme</span>
                  <span className="num" style={{ fontWeight: 600 }}>{count}</span>
                </div>
              );
            })}
            <div className="hairline" />
            <p className="dim" style={{ fontSize: 'var(--text-xs)' }}>
              Risk Yönetimi Politikası uyarınca tüm riskler en geç 6 ayda bir yeniden değerlendirilir.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="row gap-3 wrap grow">
            <label className="row gap-2" style={{ flex: '1 1 240px', maxWidth: 360 }}>
              <span className="input row gap-2" style={{ display: 'flex', alignItems: 'center' }}>
                <IconSearch size={14} className="dim" />
                <input
                  value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Risk ara…"
                  style={{ border: 0, outline: 'none', background: 'none', width: '100%' }}
                />
              </span>
            </label>
            <select className="select" style={{ width: 'auto' }} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Tüm kategoriler</option>
              {(Object.keys(riskCategoryLabels) as RiskCategory[]).map((c) => <option key={c} value={c}>{riskCategoryLabels[c]}</option>)}
            </select>
            <select className="select" style={{ width: 'auto' }} value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Tüm seviyeler</option>
              {Object.entries(riskLevelLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <Segmented
            ariaLabel="Sıralama"
            value={sort}
            onChange={setSort}
            options={[
              { id: 'severity', label: 'Skora göre' },
              { id: 'code', label: 'Koda göre' },
              { id: 'assessed', label: 'En eski değerlendirme' },
            ]}
          />
        </div>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Kod</th><th>Risk</th><th>Kategori</th><th>Süreç</th><th>Sahip</th>
                <th className="num">Doğal</th><th className="num">Artık</th><th>Seviye</th>
                <th className="num">Kontrol</th><th>Strateji</th><th>Durum</th><th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const proc = mainProcessOfRisk(data, r);
                return (
                  <tr key={r.id} className="clickable" onClick={() => navigate(`/riskler/${r.id}`)}>
                    <td className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{r.code}</td>
                    <td style={{ maxWidth: 320 }}>
                      <div className="stack" style={{ gap: 2 }}>
                        <span style={{ fontWeight: 500 }}>{r.name}</span>
                        <span className="dim clamp-2" style={{ fontSize: 'var(--text-2xs)' }}>{r.description}</span>
                      </div>
                    </td>
                    <td className="dim">{riskCategoryLabels[r.category]}</td>
                    <td className="dim">{proc?.name ?? '—'}</td>
                    <td className="dim">{userName(r.ownerId)}</td>
                    <td className="num dim">{score(r.inherent)}</td>
                    <td className="num"><ScoreChip assessment={r.residual} /></td>
                    <td>
                      <Badge level={riskLevel(r.residual)}><span className="dot" />{riskLevelLabels[riskLevel(r.residual)]}</Badge>
                      {isOutsideAppetite(r) ? <Badge level="critical" className="mono" title="Risk iştahı bandı aşıldı">!</Badge> : null}
                    </td>
                    <td className="num">{r.controlIds.length || <Badge level="critical">0</Badge>}</td>
                    <td className="dim">{riskTreatmentLabels[r.treatment]}</td>
                    <td className="dim">{riskStatusLabels[r.status]}</td>
                    <td><TrendIcon trend={r.trend} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length ? <EmptyState title="Kriterlere uyan risk yok" /> : null}
      </div>

      <SelectionDrawer />
    </div>
  );
}

/* ================================================================== */
/* Kontrol Kütüphanesi                                                 */
/* ================================================================== */

export function ControlLibrary() {
  const data = useData((s) => s.data);
  const { select } = useUi();
  const { controlId } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [nature, setNature] = useState<string>('');
  const [execution, setExecution] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [effectiveness, setEffectiveness] = useState<string>('');
  const [keyOnly, setKeyOnly] = useState(false);

  useEffect(() => {
    if (controlId) select('control', controlId);
  }, [controlId, select]);

  const rows = useMemo(() => {
    let list = data.controls;
    if (query.trim()) {
      const q = query.toLocaleLowerCase('tr-TR');
      list = list.filter((c) => `${c.code} ${c.name} ${c.description} ${c.method} ${c.evidence}`.toLocaleLowerCase('tr-TR').includes(q));
    }
    if (nature) list = list.filter((c) => c.nature === nature);
    if (execution) list = list.filter((c) => c.execution === execution);
    if (category) list = list.filter((c) => c.categories.includes(category as ControlCategory));
    if (effectiveness) list = list.filter((c) => c.effectiveness === effectiveness);
    if (keyOnly) list = list.filter((c) => c.keyControl);
    return [...list].sort((a, b) => Number(b.keyControl) - Number(a.keyControl) || a.code.localeCompare(b.code));
  }, [data, query, nature, execution, category, effectiveness, keyOnly]);

  const natureCounts = (Object.keys(controlNatureLabels) as ControlNature[]).map((n) => ({
    key: n, label: controlNatureLabels[n], count: data.controls.filter((c) => c.nature === n).length,
  }));

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack">
          <span className="eyebrow">Kontrol Kütüphanesi</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>Merkezî kontrol envanteri</h1>
          <p className="lede">
            Kontroller tek bir kütüphanede tutulur ve birden fazla süreç ya da riskle ilişkilendirilebilir.
            COSO kontrol faaliyetleri sınıflandırmasıyla uyumludur.
          </p>
        </div>
      </div>

      <div className="grid cols-5" style={{ marginBottom: 'var(--s5)' }}>
        <div className="card card-pad"><Metric compact label="Toplam kontrol" value={data.controls.length} /></div>
        <div className="card card-pad"><Metric compact label="Kritik kontrol" value={data.controls.filter((c) => c.keyControl).length} /></div>
        <div className="card card-pad"><Metric compact label="Otomatik" value={data.controls.filter((c) => c.execution === 'automated').length} sub={`%${Math.round((data.controls.filter((c) => c.execution === 'automated').length / data.controls.length) * 100)} oran`} /></div>
        <div className="card card-pad"><Metric compact label="Etkin olmayan" value={data.controls.filter((c) => c.effectiveness === 'ineffective').length} tone="alert" /></div>
        <div className="card card-pad"><Metric compact label="Kısmen etkin" value={data.controls.filter((c) => c.effectiveness === 'partially_effective').length} tone="warn" /></div>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 'var(--s5)' }}>
        {natureCounts.map((n) => (
          <button className="card card-pad" key={n.key} onClick={() => setNature(nature === n.key ? '' : n.key)}
            style={{ textAlign: 'left', cursor: 'pointer', borderColor: nature === n.key ? 'var(--brand-400)' : undefined }}>
            <span className="eyebrow">{n.label} kontroller</span>
            <div className="row between items-baseline">
              <span className="metric-value" style={{ fontSize: 'var(--text-xl)' }}>{n.count}</span>
              <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>
                {data.controls.filter((c) => c.nature === n.key && c.effectiveness !== 'effective').length} zayıf
              </span>
            </div>
            <span className="bar-track" style={{ marginTop: 'var(--s2)' }}>
              <span style={{ width: `${(n.count / data.controls.length) * 100}%`, background: levelMark.low }} />
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="row gap-3 wrap grow">
            <span className="input row gap-2" style={{ display: 'flex', alignItems: 'center', flex: '1 1 220px', maxWidth: 320 }}>
              <IconSearch size={14} className="dim" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kontrol ara…"
                style={{ border: 0, outline: 'none', background: 'none', width: '100%' }} />
            </span>
            <select className="select" style={{ width: 'auto' }} value={execution} onChange={(e) => setExecution(e.target.value)}>
              <option value="">Uygulama (tümü)</option>
              {Object.entries(controlExecutionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="select" style={{ width: 'auto' }} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Kontrol türü (tümü)</option>
              {Object.entries(controlCategoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="select" style={{ width: 'auto' }} value={effectiveness} onChange={(e) => setEffectiveness(e.target.value)}>
              <option value="">Etkinlik (tümü)</option>
              {Object.entries(controlEffectivenessLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <label className="row gap-2" style={{ fontSize: 'var(--text-sm)' }}>
              <input type="checkbox" checked={keyOnly} onChange={(e) => setKeyOnly(e.target.checked)} />
              Yalnızca kritik kontroller
            </label>
          </div>
          <span className="dim num" style={{ fontSize: 'var(--text-xs)' }}>{rows.length} kontrol</span>
        </div>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Kod</th><th>Kontrol</th><th>Tür</th><th>Uygulama</th><th>Sıklık</th>
                <th>Sahip</th><th className="num">Risk</th><th className="num">Süreç</th>
                <th>Etkinlik</th><th>Son test</th><th>COSO</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => navigate(`/kontroller/${c.id}`)}>
                  <td className="mono dim" style={{ fontSize: 'var(--text-2xs)' }}>{c.code}</td>
                  <td style={{ maxWidth: 340 }}>
                    <div className="stack" style={{ gap: 2 }}>
                      <span className="row gap-2">
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                        {c.keyControl ? <Badge tone="brand">Kritik</Badge> : null}
                      </span>
                      <span className="dim clamp-2" style={{ fontSize: 'var(--text-2xs)' }}>{c.description}</span>
                    </div>
                  </td>
                  <td><Badge tone={c.nature === 'preventive' ? 'brand' : 'neutral'}>{controlNatureLabels[c.nature]}</Badge></td>
                  <td className="dim">{controlExecutionLabels[c.execution]}</td>
                  <td className="dim">{controlFrequencyLabels[c.frequency]}</td>
                  <td className="dim">{userName(c.ownerId)}</td>
                  <td className="num">{c.riskIds.length}</td>
                  <td className="num">{c.processNodeIds.length}</td>
                  <td>
                    <span className="row gap-2">
                      <span className={`eff eff-${c.effectiveness}`} style={{ width: 8, height: 8, borderRadius: '50%' }} />
                      <span className="dim">{controlEffectivenessLabels[c.effectiveness]}</span>
                    </span>
                  </td>
                  <td className="dim">{c.lastTestedAt ? formatDate(c.lastTestedAt) : '—'}</td>
                  <td className="dim" style={{ fontSize: 'var(--text-2xs)' }}>{cosoComponentLabels[c.cosoComponent]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length ? <EmptyState title="Kriterlere uyan kontrol yok" /> : null}
      </div>

      <SelectionDrawer />
    </div>
  );
}
