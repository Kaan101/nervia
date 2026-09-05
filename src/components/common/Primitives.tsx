import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Assessment, ControlEffectiveness, RiskLevel, RiskTrend, User } from '@/types/grc';
import { riskLevel, score } from '@/lib/riskMath';
import {
  controlEffectivenessLabels, impactLabels, likelihoodLabels, maturityLabels, riskLevelLabels,
} from '@/lib/labels';
import { IconClose, IconTrendDown, IconTrendFlat, IconTrendUp } from './Icons';

/* ---------- Rozetler ---------- */

export function Badge({
  children, tone = 'neutral', level, className = '', title,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'solid' | 'plain';
  level?: RiskLevel;
  className?: string;
  title?: string;
}) {
  const toneClass = level ? `badge-level lvl-${level}` : tone === 'brand' ? 'badge-brand'
    : tone === 'solid' ? 'badge-solid' : tone === 'plain' ? 'badge-plain' : '';
  return <span className={`badge ${toneClass} ${className}`} title={title}>{children}</span>;
}

export function RiskBadge({ assessment, label }: { assessment: Assessment; label?: string }) {
  const level = riskLevel(assessment);
  return (
    <Badge level={level} title={`Olasılık ${likelihoodLabels[Math.round(assessment.likelihood)]} × Etki ${impactLabels[Math.round(assessment.impact)]}`}>
      <span className="dot" />
      {label ?? riskLevelLabels[level]}
    </Badge>
  );
}

export function ScoreChip({ assessment, suffix }: { assessment: Assessment; suffix?: string }) {
  const level = riskLevel(assessment);
  return (
    <span className={`score-chip lvl-${level}`} title={`${assessment.likelihood} × ${assessment.impact}`}>
      {score(assessment).toFixed(0)}
      {suffix ? <span className="unit">{suffix}</span> : null}
    </span>
  );
}

export function TrendIcon({ trend, size = 14 }: { trend: RiskTrend; size?: number }) {
  const cls = trend === 'up' ? 'status-red' : trend === 'down' ? 'status-green' : 'dim';
  const Icon = trend === 'up' ? IconTrendUp : trend === 'down' ? IconTrendDown : IconTrendFlat;
  return <Icon size={size} className={cls} />;
}

export function EffectivenessDot({ value }: { value: ControlEffectiveness }) {
  return (
    <span className="tip" style={{ display: 'inline-flex' }}>
      <span className={`eff eff-${value}`} style={{ width: 8, height: 8, borderRadius: '50%', display: 'block' }} />
      <span className="tip-content">{controlEffectivenessLabels[value]}</span>
    </span>
  );
}

export function Avatar({ user, size = 'md' }: { user: User | undefined; size?: 'sm' | 'md' | 'lg' }) {
  if (!user) return <span className={`avatar ${size === 'md' ? '' : size}`}>?</span>;
  return (
    <span className={`avatar ${size === 'md' ? '' : size}`} title={`${user.name} · ${user.title}`}>
      {user.initials}
    </span>
  );
}

export function Maturity({ level }: { level: number }) {
  const rounded = Math.round(level);
  return (
    <span className="tip maturity" style={{ display: 'inline-flex' }}>
      {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= rounded ? 'on' : ''} />)}
      <span className="tip-content">Olgunluk {rounded}/5 — {maturityLabels[rounded] ?? '—'}</span>
    </span>
  );
}

export function Meter({ value, level, max = 100 }: { value: number; level?: RiskLevel; max?: number }) {
  return (
    <span className={`meter ${level ? `lvl lvl-${level}` : ''}`}>
      <span style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
    </span>
  );
}

/* ---------- Yapısal bileşenler ---------- */

export function Metric({
  label, value, sub, tone, compact,
}: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'default' | 'alert' | 'warn' | 'good'; compact?: boolean }) {
  const color = tone === 'alert' ? 'var(--risk-critical)' : tone === 'warn' ? 'var(--risk-high)'
    : tone === 'good' ? 'var(--risk-low)' : undefined;
  return (
    <div className={`metric ${compact ? 'compact' : ''}`}>
      <span className="metric-label">{label}</span>
      <span className="metric-value" style={color ? { color } : undefined}>{value}</span>
      {sub ? <span className="metric-sub">{sub}</span> : null}
    </div>
  );
}

export function SectionHeading({ title, count, action }: { title: string; count?: number; action?: ReactNode }) {
  return (
    <div className="sh">
      <span>{title}</span>
      {count !== undefined ? <span className="n">{count}</span> : null}
      <span className="line" />
      {action}
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="empty">
      {icon}
      <div className="empty-title">{title}</div>
      {hint ? <div style={{ fontSize: 'var(--text-sm)', maxWidth: '46ch' }}>{hint}</div> : null}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs, value, onChange,
}: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count !== undefined ? <span className="count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({
  options, value, onChange, ariaLabel,
}: { options: { id: T; label: string; icon?: ReactNode }[]; value: T; onChange: (id: T) => void; ariaLabel?: string }) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button key={o.id} aria-pressed={value === o.id} onClick={() => onChange(o.id)} title={o.label}>
          {o.icon}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Collapsible({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={`collapsible ${open ? 'open' : ''}`}>
      <div className="collapsible-inner">{children}</div>
    </div>
  );
}

/* ---------- Katmanlı bileşenler ---------- */

function useEscape(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
}

export function Drawer({
  open, onClose, title, subtitle, eyebrow, actions, footer, wide, children,
}: {
  open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; eyebrow?: ReactNode;
  actions?: ReactNode; footer?: ReactNode; wide?: boolean; children: ReactNode;
}) {
  useEscape(onClose);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) ref.current?.focus(); }, [open]);
  if (!open) return null;
  return createPortal(
    <>
      <div className="overlay" onClick={onClose} />
      <aside className={`drawer ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" tabIndex={-1} ref={ref}>
        <header className="drawer-head">
          <div className="row between gap-3 items-start">
            <div className="grow">
              {eyebrow}
              <div className="detail-title">
                <h2>{title}</h2>
              </div>
              {subtitle ? <div className="muted" style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>{subtitle}</div> : null}
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Kapat"><IconClose /></button>
          </div>
          {actions ? <div className="row gap-2 wrap" style={{ marginTop: 'var(--s4)' }}>{actions}</div> : null}
        </header>
        <div className="drawer-body">{children}</div>
        {footer ? <footer className="drawer-foot">{footer}</footer> : null}
      </aside>
    </>,
    document.body,
  );
}

export function Modal({
  open, onClose, title, children, footer,
}: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useEscape(onClose);
  if (!open) return null;
  return createPortal(
    <>
      {/* Modal, açık bir detay çekmecesinin de üstünde katmanlanır. */}
      <div className="overlay overlay-modal" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true">
        <header className="card-head">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Kapat"><IconClose /></button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer ? <footer className="drawer-foot">{footer}</footer> : null}
      </div>
    </>,
    document.body,
  );
}

export function Tip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="tip" style={{ display: 'inline-flex' }} tabIndex={0}>
      {children}
      <span className="tip-content">{text}</span>
    </span>
  );
}
