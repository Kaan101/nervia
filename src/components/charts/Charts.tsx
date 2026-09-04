import { useId, useMemo, useState, type ReactNode } from 'react';
import type { RiskLevel } from '@/types/grc';
import { riskLevelLabels } from '@/lib/labels';

/**
 * El yazımı SVG grafikler.
 *
 * Renk kullanımı: risk seviyesi sıralı bir *durum* paletidir ve yalnızca
 * seviye göstermek için kullanılır. Her grafikte seviye adı ya doğrudan
 * etiket ya da açıklama (legend) olarak yazılır; renk tek başına anlam
 * taşımaz. Nicel karşılaştırmalarda tek hue’lu kurumsal mavi ramp kullanılır.
 */

export const levelMark: Record<RiskLevel, string> = {
  low: 'var(--risk-low-mark)',
  medium: 'var(--risk-medium-mark)',
  high: 'var(--risk-high-mark)',
  critical: 'var(--risk-critical-mark)',
};

export const levelOrderAsc: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

/* ------------------------------------------------------------------ */
/* Açıklama (legend)                                                   */
/* ------------------------------------------------------------------ */

export function Legend({ items }: { items: { color: string; label: string; value?: ReactNode }[] }) {
  return (
    <ul className="row wrap gap-4" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((i) => (
        <li key={i.label} className="row gap-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-600)' }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: i.color, flex: '0 0 auto' }} />
          <span>{i.label}</span>
          {i.value !== undefined ? <span className="num" style={{ color: 'var(--ink-900)', fontWeight: 600 }}>{i.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export function LevelLegend({ counts }: { counts?: Record<RiskLevel, number> }) {
  return (
    <Legend
      items={levelOrderAsc.map((l) => ({
        color: levelMark[l],
        label: riskLevelLabels[l],
        value: counts ? counts[l] : undefined,
      }))}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Yığılmış çubuk listesi                                              */
/* ------------------------------------------------------------------ */

export interface StackedRow {
  key: string;
  label: string;
  total: number;
  byLevel: Record<RiskLevel, number>;
}

export function StackedBarList({
  rows, max, onSelect, selectedKey,
}: { rows: StackedRow[]; max?: number; onSelect?: (key: string) => void; selectedKey?: string | null }) {
  const peak = max ?? Math.max(1, ...rows.map((r) => r.total));
  return (
    <div className="stack gap-3">
      {rows.map((row) => {
        const active = selectedKey === row.key;
        return (
          <button
            key={row.key}
            className="stack gap-2"
            onClick={onSelect ? () => onSelect(row.key) : undefined}
            style={{
              border: 0, background: active ? 'var(--brand-050)' : 'none', textAlign: 'left',
              padding: 'var(--s2)', margin: 'calc(-1 * var(--s2))', borderRadius: 'var(--radius)',
              cursor: onSelect ? 'pointer' : 'default', width: 'calc(100% + var(--s4))',
            }}
          >
            <span className="row between gap-3" style={{ fontSize: 'var(--text-sm)' }}>
              <span className="truncate" style={{ color: 'var(--ink-800)' }}>{row.label}</span>
              <span className="num" style={{ color: 'var(--ink-500)', fontVariantNumeric: 'tabular-nums' }}>{row.total}</span>
            </span>
            <span className="bar-track" role="img" aria-label={levelOrderAsc.map((l) => `${riskLevelLabels[l]}: ${row.byLevel[l]}`).join(', ')}>
              {levelOrderAsc.map((level) => {
                const v = row.byLevel[level];
                if (!v) return null;
                return (
                  <span
                    key={level}
                    title={`${riskLevelLabels[level]}: ${v}`}
                    style={{
                      width: `${(v / peak) * 100}%`,
                      background: levelMark[level],
                      borderRight: '2px solid var(--surface)',
                      borderRadius: level === 'low' ? '99px 0 0 99px' : undefined,
                    }}
                  />
                );
              })}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Trend çizgisi — iki seri, imleç + ipucu                             */
/* ------------------------------------------------------------------ */

export interface TrendPoint { period: string; critical: number; high: number }

export function TrendChart({ points, height = 190 }: { points: TrendPoint[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId();
  const w = 640;
  const h = height;
  const pad = { top: 16, right: 44, bottom: 26, left: 34 };
  const iw = w - pad.left - pad.right;
  const ih = h - pad.top - pad.bottom;
  const maxY = Math.max(4, ...points.flatMap((p) => [p.critical, p.high])) * 1.15;

  const x = (i: number) => pad.left + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => pad.top + ih - (v / maxY) * ih;
  const line = (key: 'critical' | 'high') =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');

  const ticks = [0, Math.round(maxY / 2), Math.round(maxY)];
  const active = hover !== null ? points[hover] : null;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img"
        aria-label="Kritik ve yüksek seviyeli risk sayısının aylık seyri"
        onMouseLeave={() => setHover(null)}>
        <defs>
          <clipPath id={clipId}><rect x={pad.left} y={0} width={iw} height={h} /></clipPath>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={w - pad.right} y1={y(t)} y2={y(t)} stroke="var(--ink-100)" strokeWidth={1} />
            <text x={pad.left - 8} y={y(t) + 3.5} textAnchor="end" fontSize={10} fill="var(--ink-400)">{t}</text>
          </g>
        ))}
        <g clipPath={`url(#${clipId})`}>
          <path d={line('high')} fill="none" stroke={levelMark.high} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={line('critical')} fill="none" stroke={levelMark.critical} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {points.map((p, i) => (
          <g key={p.period}>
            {i % 2 === 0 ? (
              <text x={x(i)} y={h - 8} textAnchor="middle" fontSize={9.5} fill="var(--ink-400)">
                {p.period.slice(5)}/{p.period.slice(2, 4)}
              </text>
            ) : null}
            <rect x={x(i) - iw / points.length / 2} y={pad.top} width={iw / points.length} height={ih}
              fill="transparent" onMouseEnter={() => setHover(i)} />
          </g>
        ))}
        {hover !== null ? (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + ih} stroke="var(--ink-300)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(points[hover].high)} r={4.5} fill={levelMark.high} stroke="var(--surface)" strokeWidth={2} />
            <circle cx={x(hover)} cy={y(points[hover].critical)} r={4.5} fill={levelMark.critical} stroke="var(--surface)" strokeWidth={2} />
          </g>
        ) : null}
        {/* Seri sonu doğrudan etiketleri */}
        <text x={w - pad.right + 6} y={y(points[points.length - 1].critical) + 3.5} fontSize={10} fill="var(--ink-600)" fontWeight={600}>
          {points[points.length - 1].critical}
        </text>
        <text x={w - pad.right + 6} y={y(points[points.length - 1].high) + 3.5} fontSize={10} fill="var(--ink-600)" fontWeight={600}>
          {points[points.length - 1].high}
        </text>
      </svg>
      {active ? (
        <div style={{
          position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--ink-900)', color: '#fff', borderRadius: 'var(--radius)',
          padding: '6px 10px', fontSize: 'var(--text-xs)', boxShadow: 'var(--shadow-md)',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          <strong>{active.period}</strong> · Kritik {active.critical} · Yüksek {active.high}
        </div>
      ) : null}
      <div style={{ marginTop: 'var(--s2)' }}>
        <Legend items={[
          { color: levelMark.critical, label: 'Kritik risk' },
          { color: levelMark.high, label: 'Yüksek risk' },
        ]} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Halka grafik                                                        */
/* ------------------------------------------------------------------ */

export interface DonutSlice { key: string; label: string; value: number; color: string }

export function Donut({
  slices, heroValue, heroLabel, size = 168,
}: { slices: DonutSlice[]; heroValue: ReactNode; heroLabel: string; size?: number }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="row gap-5 wrap" style={{ alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
          aria-label={slices.map((s) => `${s.label}: ${s.value}`).join(', ')}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ink-100)" strokeWidth={13} />
            {slices.map((s) => {
              const len = (s.value / total) * c;
              const el = (
                <circle
                  key={s.key} cx={size / 2} cy={size / 2} r={r} fill="none"
                  stroke={s.color} strokeWidth={13}
                  strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`}
                  strokeDashoffset={-offset}
                >
                  <title>{`${s.label}: ${s.value}`}</title>
                </circle>
              );
              offset += len;
              return el;
            })}
          </g>
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
              {heroValue}
            </div>
            <div className="eyebrow" style={{ marginTop: 2 }}>{heroLabel}</div>
          </div>
        </div>
      </div>
      <ul className="stack gap-2 grow" style={{ listStyle: 'none', padding: 0, margin: 0, minWidth: 160 }}>
        {slices.map((s) => (
          <li key={s.key} className="row gap-2" style={{ fontSize: 'var(--text-sm)' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flex: '0 0 auto' }} />
            <span className="grow truncate" style={{ color: 'var(--ink-600)' }}>{s.label}</span>
            <span className="num" style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline — KRI seyri                                               */
/* ------------------------------------------------------------------ */

export function Sparkline({
  values, greenMax, amberMax, direction, width = 180, height = 44,
}: {
  values: number[]; greenMax: number; amberMax: number;
  direction: 'lower_better' | 'higher_better'; width?: number; height?: number;
}) {
  const { path, dots, scale } = useMemo(() => {
    const min = Math.min(...values, greenMax, amberMax);
    const max = Math.max(...values, greenMax, amberMax);
    const span = max - min || 1;
    const y = (v: number) => height - 4 - ((v - min) / span) * (height - 10);
    const x = (i: number) => (values.length === 1 ? width / 2 : (i / (values.length - 1)) * (width - 4) + 2);
    return {
      path: values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' '),
      dots: values.map((v, i) => ({ cx: x(i), cy: y(v), v })),
      scale: { y },
    };
  }, [values, greenMax, amberMax, width, height]);

  const last = values[values.length - 1];
  const status = direction === 'lower_better'
    ? (last <= greenMax ? 'low' : last <= amberMax ? 'medium' : 'critical')
    : (last >= greenMax ? 'low' : last >= amberMax ? 'medium' : 'critical');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img"
      aria-label={`Son değer ${last}. Eşikler: ${greenMax} / ${amberMax}.`}>
      <line x1={0} x2={width} y1={scale.y(amberMax)} y2={scale.y(amberMax)}
        stroke="var(--risk-critical-line)" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={0} x2={width} y1={scale.y(greenMax)} y2={scale.y(greenMax)}
        stroke="var(--risk-low-line)" strokeWidth={1} strokeDasharray="3 3" />
      <path d={path} fill="none" stroke="var(--brand-500)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={dots[dots.length - 1].cx} cy={dots[dots.length - 1].cy} r={4}
        fill={levelMark[status as RiskLevel]} stroke="var(--surface)" strokeWidth={2} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Yatay ölçek karşılaştırması (doğal → artık)                         */
/* ------------------------------------------------------------------ */

export function ScoreScale({ inherent, residual, target }: { inherent: number; residual: number; target?: number }) {
  const pct = (v: number) => `${(v / 25) * 100}%`;
  return (
    <div className="stack gap-2">
      <div style={{ position: 'relative', height: 8, borderRadius: 99, background: 'linear-gradient(90deg, var(--risk-low-bg), var(--risk-medium-bg) 34%, var(--risk-high-bg) 58%, var(--risk-critical-bg))', border: '1px solid var(--border)' }}>
        <span title={`Doğal risk: ${inherent}`} style={{
          position: 'absolute', left: pct(inherent), top: -3, width: 2, height: 12,
          background: 'var(--ink-400)', transform: 'translateX(-1px)', borderRadius: 1,
        }} />
        <span title={`Artık risk: ${residual}`} style={{
          position: 'absolute', left: pct(residual), top: -5, width: 10, height: 16,
          background: 'var(--ink-900)', transform: 'translateX(-5px)', borderRadius: 3,
          border: '2px solid var(--surface)',
        }} />
        {target !== undefined ? (
          <span title={`Hedef: ${target}`} style={{
            position: 'absolute', left: pct(target), top: -2, width: 8, height: 8,
            border: '2px solid var(--brand-600)', background: 'var(--surface)',
            borderRadius: '50%', transform: 'translateX(-4px)',
          }} />
        ) : null}
      </div>
      <div className="row between" style={{ fontSize: 'var(--text-2xs)', color: 'var(--ink-400)' }}>
        <span>0</span><span>Doğal {inherent} → Artık {residual}{target !== undefined ? ` · Hedef ${target}` : ''}</span><span>25</span>
      </div>
    </div>
  );
}
