import { useId, useState, type ReactNode } from 'react';
import type { User } from '@/types/grc';
import { impactLabels, likelihoodLabels, maturityLabels } from '@/lib/labels';
import { levelOf } from '@/lib/riskMath';
import { riskLevelLabels } from '@/lib/labels';
import { Avatar } from '@/components/common/Primitives';
import { IconClose } from '@/components/common/Icons';

/** Form alanları — tüm ekle/düzenle modalleri bunları kullanır. */

export function Field({
  id, label, hint, error, required, children,
}: {
  /** Bağlanacak form elemanının id'si. Verilmezse etiket yalnızca metin olur. */
  id?: string;
  label: string; hint?: string; error?: string; required?: boolean; children: ReactNode;
}) {
  const caption = (
    <>
      {label}
      {required ? <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span> : null}
    </>
  );
  return (
    <div className="field">
      {id
        ? <label htmlFor={id}>{caption}</label>
        : <span className="field-label" id={`${label}-label`}>{caption}</span>}
      {children}
      {error ? (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)' }}>{error}</span>
      ) : hint ? (
        <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>{hint}</span>
      ) : null}
    </div>
  );
}

export function TextInput({
  label, value, onChange, placeholder, hint, error, required, mono,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; error?: string; required?: boolean; mono?: boolean;
}) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        className={`input ${mono ? 'mono' : ''}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
      />
    </Field>
  );
}

export function TextArea({
  label, value, onChange, rows = 3, placeholder, hint, error, required,
}: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
  placeholder?: string; hint?: string; error?: string; required?: boolean;
}) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        className="textarea" rows={rows} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)}
      />
    </Field>
  );
}

export function SelectInput<T extends string>({
  label, value, onChange, options, hint, error, required,
}: {
  label: string; value: T; onChange: (v: T) => void;
  options: Record<string, string> | { value: T; label: string }[];
  hint?: string; error?: string; required?: boolean;
}) {
  const id = useId();
  const list = Array.isArray(options)
    ? options
    : (Object.entries(options) as [T, string][]).map(([v, l]) => ({ value: v, label: l }));
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {list.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export function DateInput({
  label, value, onChange, hint, error, required,
}: { label: string; value: string; onChange: (v: string) => void; hint?: string; error?: string; required?: boolean }) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <input id={id} className="input" type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function UserSelect({
  label, value, onChange, users, hint, error,
}: { label: string; value: string; onChange: (v: string) => void; users: User[]; hint?: string; error?: string }) {
  const id = useId();
  const current = users.find((u) => u.id === value);
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div className="row gap-2">
        <Avatar user={current} size="sm" />
        <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name} — {u.title}</option>
          ))}
        </select>
      </div>
    </Field>
  );
}

export function Toggle({
  label, checked, onChange, hint,
}: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id} className="row gap-2" style={{ cursor: 'pointer' }}>
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        {label}
      </label>
      {hint ? <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>{hint}</span> : null}
    </div>
  );
}

export function ChipMultiSelect<T extends string>({
  label, values, onChange, options, hint, error,
}: {
  label: string; values: T[]; onChange: (v: T[]) => void;
  options: Record<string, string>; hint?: string; error?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      <div className="row gap-1 wrap">
        {(Object.entries(options) as [T, string][]).map(([v, l]) => {
          const on = values.includes(v);
          return (
            <button
              key={v}
              type="button"
              className="tag"
              onClick={() => onChange(on ? values.filter((x) => x !== v) : [...values, v])}
              style={on
                ? { borderColor: 'var(--brand-400)', background: 'var(--brand-050)', color: 'var(--brand-700)', fontWeight: 600 }
                : { cursor: 'pointer' }}
              aria-pressed={on}
            >
              {l}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

/**
 * Olasılık × etki seçici.
 * 1–5 ölçeği; seçim yapıldıkça skor ve seviye anında güncellenir.
 */
export function AssessmentPicker({
  label, value, onChange, hint,
}: {
  label: string;
  value: { likelihood: number; impact: number };
  onChange: (v: { likelihood: number; impact: number }) => void;
  hint?: string;
}) {
  const score = Math.round(value.likelihood * value.impact);
  const level = levelOf(score);
  return (
    <Field label={label} hint={hint}>
      <div className="stack gap-2" style={{
        padding: 'var(--s3)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', background: 'var(--surface-sunken)',
      }}>
        <Scale
          caption="Olasılık"
          value={Math.round(value.likelihood)}
          labels={likelihoodLabels}
          onChange={(likelihood) => onChange({ ...value, likelihood })}
        />
        <Scale
          caption="Etki"
          value={Math.round(value.impact)}
          labels={impactLabels}
          onChange={(impact) => onChange({ ...value, impact })}
        />
        <div className={`row between lvl-${level}`} style={{ paddingTop: 'var(--s2)', borderTop: '1px solid var(--border)' }}>
          <span className="eyebrow">Skor</span>
          <span className="row gap-2">
            <span className="num" style={{ fontWeight: 700, color: 'var(--lvl)' }}>{score}</span>
            <span className="badge badge-level" style={{ background: 'var(--lvl-bg)', borderColor: 'var(--lvl-line)', color: 'var(--lvl)' }}>
              {riskLevelLabels[level]}
            </span>
          </span>
        </div>
      </div>
    </Field>
  );
}

function Scale({
  caption, value, labels, onChange,
}: { caption: string; value: number; labels: Record<number, string>; onChange: (v: number) => void }) {
  return (
    <div className="stack gap-1">
      <div className="row between">
        <span className="eyebrow">{caption}</span>
        <span className="dim" style={{ fontSize: 'var(--text-xs)' }}>{labels[value]}</span>
      </div>
      <div className="row gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            title={labels[n]}
            aria-pressed={value === n}
            style={{
              flex: 1, height: 30, borderRadius: 'var(--radius-sm)',
              border: `1px solid ${value === n ? 'var(--brand-500)' : 'var(--border-strong)'}`,
              background: value === n ? 'var(--brand-700)' : 'var(--surface)',
              color: value === n ? '#fff' : 'var(--ink-600)',
              fontWeight: value === n ? 700 : 500,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Yüzde seçici (aksiyon tamamlanma oranı). */
export function PercentInput({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <Field id={id} label={label}>
      <div className="row gap-3">
        <input
          id={id}
          type="range" min={0} max={100} step={5} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span className="num" style={{ width: 44, textAlign: 'right', fontWeight: 600 }}>%{value}</span>
      </div>
    </Field>
  );
}

/** Formun iki sütunlu düzeni. */
export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid cols-2" style={{ alignItems: 'start' }}>{children}</div>;
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="detail-section">
      <div className="sh"><span>{title}</span><span className="line" /></div>
      <div className="stack gap-4">{children}</div>
    </div>
  );
}

/**
 * Serbest metin listesi (sistemler, girdiler, çıktılar, standartlar).
 * Enter ya da virgül ile yeni öğe eklenir.
 */
export function ListInput({
  label, values, onChange, placeholder, hint,
}: {
  label: string; values: string[]; onChange: (v: string[]) => void;
  placeholder?: string; hint?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState('');

  const commit = (raw: string) => {
    const items = raw.split(',').map((x) => x.trim()).filter(Boolean);
    if (!items.length) return;
    const merged = [...values];
    for (const item of items) if (!merged.includes(item)) merged.push(item);
    onChange(merged);
    setDraft('');
  };

  return (
    <Field id={id} label={label} hint={hint}>
      <div className="stack gap-2">
        {values.length ? (
          <div className="row gap-1 wrap">
            {values.map((v) => (
              <span key={v} className="tag row gap-1">
                {v}
                <button
                  type="button"
                  onClick={() => onChange(values.filter((x) => x !== v))}
                  aria-label={`${v} kaldır`}
                  style={{ border: 0, background: 'none', padding: 0, lineHeight: 1, color: 'var(--ink-400)', cursor: 'pointer' }}
                >
                  <IconClose size={11} />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <input
          id={id}
          className="input"
          value={draft}
          placeholder={placeholder ?? 'Yazıp Enter’a basın'}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(draft); }
            if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1));
          }}
        />
      </div>
    </Field>
  );
}

/** Çoklu kişi seçimi (görevli kişiler). */
export function MultiUserSelect({
  label, values, onChange, users, hint,
}: { label: string; values: string[]; onChange: (v: string[]) => void; users: User[]; hint?: string }) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint}>
      <div className="stack gap-2">
        {values.length ? (
          <div className="row gap-1 wrap">
            {values.map((uid) => {
              const u = users.find((x) => x.id === uid);
              return (
                <span key={uid} className="tag row gap-1">
                  <Avatar user={u} size="sm" />
                  {u?.name ?? uid}
                  <button
                    type="button"
                    onClick={() => onChange(values.filter((x) => x !== uid))}
                    aria-label={`${u?.name ?? uid} kaldır`}
                    style={{ border: 0, background: 'none', padding: 0, lineHeight: 1, color: 'var(--ink-400)', cursor: 'pointer' }}
                  >
                    <IconClose size={11} />
                  </button>
                </span>
              );
            })}
          </div>
        ) : null}
        <select
          id={id}
          className="select"
          value=""
          onChange={(e) => {
            if (e.target.value && !values.includes(e.target.value)) onChange([...values, e.target.value]);
          }}
        >
          <option value="">Kişi ekle…</option>
          {users.filter((u) => !values.includes(u.id)).map((u) => (
            <option key={u.id} value={u.id}>{u.name} — {u.title}</option>
          ))}
        </select>
      </div>
    </Field>
  );
}

/** 1–5 olgunluk seçici. */
export function MaturityInput({
  label, value, onChange, hint,
}: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="row gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            title={maturityLabels[n]}
            style={{
              flex: 1, height: 32, borderRadius: 'var(--radius-sm)',
              border: `1px solid ${value === n ? 'var(--brand-500)' : 'var(--border-strong)'}`,
              background: value === n ? 'var(--brand-700)' : 'var(--surface)',
              color: value === n ? '#fff' : 'var(--ink-600)',
              fontSize: 'var(--text-xs)', fontWeight: value === n ? 600 : 500,
            }}
          >
            {n} · {maturityLabels[n]}
          </button>
        ))}
      </div>
    </Field>
  );
}

/** Tekrarlanan alt kayıtlar için satır kabı (kritik nokta, örnek senaryo, doküman bölümü). */
export function RepeaterRow({
  title, onRemove, children,
}: { title: string; onRemove: () => void; children: ReactNode }) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      padding: 'var(--s3)', background: 'var(--surface-sunken)',
    }}>
      <div className="row between gap-2" style={{ marginBottom: 'var(--s2)' }}>
        <span className="eyebrow">{title}</span>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onRemove}>
          <IconClose size={12} /> Kaldır
        </button>
      </div>
      <div className="stack gap-3">{children}</div>
    </div>
  );
}
