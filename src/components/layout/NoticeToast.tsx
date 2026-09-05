import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUi } from '@/store/useUi';
import { IconClose } from '@/components/common/Icons';

/** Kaydetme ve onaya gönderme işlemlerinin kısa geri bildirimi. */
export function NoticeToast() {
  const notice = useUi((s) => s.notice);
  const dismiss = useUi((s) => s.dismissNotice);

  useEffect(() => {
    if (!notice) return;
    // Uyarılar daha uzun kalır; kullanıcı okumadan kaybolmamalı.
    const ms = notice.tone === 'warning' ? 9000 : 5000;
    const timer = window.setTimeout(dismiss, ms);
    return () => window.clearTimeout(timer);
  }, [notice, dismiss]);

  if (!notice) return null;

  return createPortal(
    <div className={`toast ${notice.tone}`} role="status" aria-live="polite">
      <span className="toast-mark" />
      <span className="stack grow" style={{ minWidth: 0 }}>
        <span className="toast-title">{notice.title}</span>
        {notice.detail ? <span className="toast-detail">{notice.detail}</span> : null}
      </span>
      <button onClick={dismiss} aria-label="Kapat"><IconClose size={14} /></button>
    </div>,
    document.body,
  );
}
