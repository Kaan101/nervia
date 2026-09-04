import { useMemo, useState } from 'react';
import { useData } from '@/store/useData';
import { useUi } from '@/store/useUi';
import { HeatMap } from '@/components/charts/HeatMap';
import { SelectionDrawer } from '@/components/process/DetailPanel';
import { Badge, EmptyState, Metric, ScoreChip, Segmented } from '@/components/common/Primitives';
import { descendants, mainProcessOfRisk, sortRisksBySeverity } from '@/lib/selectors';
import { monthsSince, riskLevel, score } from '@/lib/riskMath';
import {
  controlEffectivenessLabels, riskCategoryLabels, riskLevelLabels,
} from '@/lib/labels';
import { unitName, userName } from '@/data/org';
import { IconFilter, IconRefresh } from '@/components/common/Icons';
import type { RiskCategory, RiskLevel } from '@/types/grc';

export function RiskHeatmapPage() {
  const data = useData((s) => s.data);
  const { select, filters, setFilter, resetFilters } = useUi();
  const [basis, setBasis] = useState<'residual' | 'inherent'>('residual');

  const filtered = useMemo(() => {
    let list = data.risks;
    if (filters.unitId) list = list.filter((r) => r.unitId === filters.unitId);
    if (filters.processId) {
      const ids = new Set([filters.processId, ...descendants(data.nodes, filters.processId).map((n) => n.id)]);
      list = list.filter((r) => r.processNodeIds.some((id) => ids.has(id)));
    }
    if (filters.category) list = list.filter((r) => r.category === filters.category);
    if (filters.ownerId) list = list.filter((r) => r.ownerId === filters.ownerId);
    if (filters.level) list = list.filter((r) => riskLevel(r.residual) === filters.level);
    if (filters.effectiveness) {
      list = list.filter((r) =>
        r.controlIds.some((cid) => data.controls.find((c) => c.id === cid)?.effectiveness === filters.effectiveness));
    }
    if (filters.assessedWithinMonths) {
      list = list.filter((r) => monthsSince(r.lastAssessedAt) <= filters.assessedWithinMonths!);
    }
    return list;
  }, [data, filters]);

  const sorted = sortRisksBySeverity(filtered);
  const activeFilters = Object.values(filters).filter((v) => v !== null).length;

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack">
          <span className="eyebrow">Risk Isı Haritası</span>
          <h1 style={{ marginTop: 'var(--s2)' }}>Olasılık × Etki matrisi</h1>
          <p className="lede">
            Her nokta bir riski temsil eder. Bir riske tıkladığınızda ilgili süreç adımı, kontroller ve
            aksiyonlar açılır. Hücrelerdeki sayı, o hücrenin risk skorudur.
          </p>
        </div>
        <Segmented
          ariaLabel="Değerlendirme temeli"
          value={basis}
          onChange={(v) => setBasis(v)}
          options={[{ id: 'residual', label: 'Artık risk' }, { id: 'inherent', label: 'Doğal risk' }]}
        />
      </div>

      {/* Filtreler — tek satır, grafiklerin üstünde */}
      <div className="card card-pad" style={{ marginBottom: 'var(--s5)' }}>
        <div className="row gap-3 wrap">
          <span className="row gap-2 eyebrow" style={{ alignSelf: 'center' }}>
            <IconFilter size={13} /> Filtreler
          </span>
          <select className="select" style={{ width: 'auto' }} value={filters.unitId ?? ''}
            onChange={(e) => setFilter('unitId', e.target.value || null)}>
            <option value="">Tüm birimler</option>
            {data.units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} value={filters.processId ?? ''}
            onChange={(e) => setFilter('processId', e.target.value || null)}>
            <option value="">Tüm süreçler</option>
            {data.nodes.filter((n) => n.kind === 'process').map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} value={filters.category ?? ''}
            onChange={(e) => setFilter('category', e.target.value || null)}>
            <option value="">Tüm risk türleri</option>
            {(Object.keys(riskCategoryLabels) as RiskCategory[]).map((c) => (
              <option key={c} value={c}>{riskCategoryLabels[c]}</option>
            ))}
          </select>
          <select className="select" style={{ width: 'auto' }} value={filters.ownerId ?? ''}
            onChange={(e) => setFilter('ownerId', e.target.value || null)}>
            <option value="">Tüm risk sahipleri</option>
            {[...new Set(data.risks.map((r) => r.ownerId))].map((id) => (
              <option key={id} value={id}>{userName(id)}</option>
            ))}
          </select>
          <select className="select" style={{ width: 'auto' }} value={filters.level ?? ''}
            onChange={(e) => setFilter('level', e.target.value || null)}>
            <option value="">Tüm seviyeler</option>
            {(Object.keys(riskLevelLabels) as RiskLevel[]).map((l) => (
              <option key={l} value={l}>{riskLevelLabels[l]}</option>
            ))}
          </select>
          <select className="select" style={{ width: 'auto' }} value={filters.effectiveness ?? ''}
            onChange={(e) => setFilter('effectiveness', e.target.value || null)}>
            <option value="">Kontrol etkinliği (tümü)</option>
            {Object.entries(controlEffectivenessLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} value={filters.assessedWithinMonths ?? ''}
            onChange={(e) => setFilter('assessedWithinMonths', e.target.value ? Number(e.target.value) : null)}>
            <option value="">Değerlendirme tarihi (tümü)</option>
            <option value="3">Son 3 ayda değerlendirilen</option>
            <option value="6">Son 6 ayda değerlendirilen</option>
            <option value="12">Son 12 ayda değerlendirilen</option>
          </select>
          {activeFilters ? (
            <button className="btn btn-sm btn-ghost" onClick={resetFilters}>
              <IconRefresh size={13} /> Filtreleri temizle ({activeFilters})
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 1fr)' }}>
        <div className="card card-pad">
          {filtered.length ? (
            <HeatMap risks={filtered} basis={basis} onSelect={(r) => select('risk', r.id)} />
          ) : (
            <EmptyState title="Seçilen kriterlere uyan risk bulunamadı" hint="Filtreleri gevşetmeyi deneyin." />
          )}
        </div>

        <div className="stack gap-4">
          <div className="grid cols-2">
            <div className="card card-pad"><Metric compact label="Gösterilen risk" value={filtered.length} sub={`${data.risks.length} toplam`} /></div>
            <div className="card card-pad">
              <Metric compact label="Kritik" value={filtered.filter((r) => riskLevel(r.residual) === 'critical').length}
                tone="alert" sub={`${filtered.filter((r) => riskLevel(r.residual) === 'high').length} yüksek`} />
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h4>Öncelik sırası</h4></div>
            <div className="card-body stack gap-2" style={{ maxHeight: 520, overflowY: 'auto' }}>
              {sorted.slice(0, 24).map((r) => {
                const proc = mainProcessOfRisk(data, r);
                return (
                  <button className="rel-control" key={r.id} onClick={() => select('risk', r.id)}>
                    <ScoreChip assessment={basis === 'residual' ? r.residual : r.inherent} />
                    <span className="stack grow" style={{ gap: 2, minWidth: 0 }}>
                      <span className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{r.name}</span>
                      <span className="dim truncate" style={{ fontSize: 'var(--text-2xs)' }}>
                        {r.code} · {proc?.name ?? unitName(r.unitId)} · {userName(r.ownerId)}
                      </span>
                    </span>
                    <Badge level={riskLevel(r.residual)}>{score(r.residual)}</Badge>
                  </button>
                );
              })}
              {!sorted.length ? <EmptyState title="Sonuç yok" /> : null}
            </div>
          </div>
        </div>
      </div>

      <SelectionDrawer />
    </div>
  );
}
