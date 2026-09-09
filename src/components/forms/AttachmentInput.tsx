import { useId, useState } from 'react';
import type { Attachment, AttachmentSource } from '@/types/grc';
import {
  attachmentProblem, attachmentSourceLabels, detectSource, isOpenable,
  newAttachmentId, shortenHref,
} from '@/lib/attachments';
import { useAuth } from '@/store/useAuth';
import { Badge } from '@/components/common/Primitives';
import { IconExternal, IconPlus, IconClose, IconDoc } from '@/components/common/Icons';

/**
 * Ek bağlantısı alanı.
 *
 * Dosyanın kendisini değil, ona giden adresi ister: SharePoint bağlantısı,
 * ağ paylaşımı yolu ya da sunucu adresi. Kaynak türü adresten otomatik
 * çıkarılır; kullanıcı gerekirse düzeltebilir.
 */
export function AttachmentInput({
  value, onChange, hint,
}: {
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
  hint?: string;
}) {
  const currentUser = useAuth((s) => s.currentUser);
  const labelId = useId();
  const hrefId = useId();
  const noteId = useId();

  const [label, setLabel] = useState('');
  const [href, setHref] = useState('');
  const [note, setNote] = useState('');
  const [source, setSource] = useState<AttachmentSource | ''>('');
  const [error, setError] = useState('');

  const detected = href.trim() ? detectSource(href) : null;
  const effectiveSource = (source || detected || 'other') as AttachmentSource;

  const add = () => {
    const problem = attachmentProblem(href);
    if (problem) { setError(problem); return; }
    if (!label.trim()) { setError('Ekin görünen adını girin.'); return; }
    onChange([
      ...value,
      {
        id: newAttachmentId(),
        label: label.trim(),
        href: href.trim(),
        source: effectiveSource,
        note: note.trim() || undefined,
        addedById: currentUser?.id ?? '',
        addedAt: new Date().toISOString(),
      },
    ]);
    setLabel(''); setHref(''); setNote(''); setSource(''); setError('');
  };

  return (
    <div className="stack gap-3">
      {hint ? <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>{hint}</p> : null}

      {value.length ? (
        <div className="stack gap-2">
          {value.map((a) => (
            <div key={a.id} className="row gap-3 attachment-row">
              <IconDoc size={15} />
              <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
                <span className="row gap-2" style={{ alignItems: 'center' }}>
                  <strong className="truncate">{a.label}</strong>
                  <Badge tone="plain">{attachmentSourceLabels[a.source]}</Badge>
                </span>
                <span className="muted truncate" style={{ fontSize: 'var(--text-xs)' }}>
                  {shortenHref(a.href)}
                </span>
              </span>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => onChange(value.filter((x) => x.id !== a.id))}
                aria-label={`${a.label} ekini kaldır`}
              >
                <IconClose size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="attachment-add">
        <div className="field">
          <label className="field-label" htmlFor={labelId}>Ek adı</label>
          <input id={labelId} className="input" value={label}
            onChange={(e) => { setLabel(e.target.value); setError(''); }}
            placeholder="Örn. Eksper raporu 2026-08" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={hrefId}>Bağlantı veya yol</label>
          <input id={hrefId} className="input" value={href}
            onChange={(e) => { setHref(e.target.value); setError(''); }}
            placeholder="https://…  ·  \\sunucu\pay\dosya.pdf  ·  C:\Klasor\dosya.pdf" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${hrefId}-src`}>Kaynak</label>
          <select id={`${hrefId}-src`} className="input" value={source}
            onChange={(e) => setSource(e.target.value as AttachmentSource | '')}>
            <option value="">
              {detected ? `Otomatik — ${attachmentSourceLabels[detected]}` : 'Otomatik'}
            </option>
            {(Object.keys(attachmentSourceLabels) as AttachmentSource[]).map((s) => (
              <option key={s} value={s}>{attachmentSourceLabels[s]}</option>
            ))}
          </select>
        </div>
        <div className="field grow">
          <label className="field-label" htmlFor={noteId}>Not</label>
          <input id={noteId} className="input" value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Bu ek neden iliştirildi?" />
        </div>
        <button type="button" className="btn btn-sm" onClick={add}>
          <IconPlus size={14} /> Ek ekle
        </button>
      </div>

      {error ? <div className="callout danger" role="alert">{error}</div> : null}

      {href.trim() && !isOpenable(href) && !attachmentProblem(href) ? (
        <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
          Bu adres bir ağ ya da dosya yolu. Tarayıcı güvenlik gereği böyle adresleri
          tıklamayla açmaz; kayıtta <strong>kopyalanabilir</strong> olarak görünür.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Eklerin salt okunur görünümü.
 *
 * http(s) adresleri yeni sekmede açılır; ağ ve dosya yolları tarayıcıdan
 * açılamadığı için kopyalanır.
 */
export function AttachmentList({ items }: { items: Attachment[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!items.length) {
    return <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>Bu kayda ek iliştirilmemiş.</p>;
  }

  const copy = async (a: Attachment) => {
    try {
      await navigator.clipboard.writeText(a.href);
      setCopied(a.id);
      setTimeout(() => setCopied((c) => (c === a.id ? null : c)), 2000);
    } catch {
      // Pano erişimi yoksa kullanıcı adresi elle seçebilsin.
      setCopied(null);
    }
  };

  return (
    <div className="stack gap-2">
      {items.map((a) => (
        <div key={a.id} className="row gap-3 attachment-row">
          <IconDoc size={15} />
          <span className="stack gap-1 grow" style={{ minWidth: 0 }}>
            <span className="row gap-2" style={{ alignItems: 'center' }}>
              <strong className="truncate">{a.label}</strong>
              <Badge tone="plain">{attachmentSourceLabels[a.source]}</Badge>
            </span>
            <span className="muted truncate" style={{ fontSize: 'var(--text-xs)' }} title={a.href}>
              {shortenHref(a.href, 68)}
            </span>
            {a.note ? (
              <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>{a.note}</span>
            ) : null}
          </span>
          {isOpenable(a.href) ? (
            <a className="btn btn-sm" href={a.href} target="_blank" rel="noopener noreferrer">
              <IconExternal size={13} /> Aç
            </a>
          ) : (
            <button type="button" className="btn btn-sm" onClick={() => copy(a)}
              title="Tarayıcı bu adresi açamaz; panoya kopyalanır">
              {copied === a.id ? 'Kopyalandı' : 'Yolu kopyala'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
