import type { AttachmentSource } from '@/types/grc';

/**
 * Ek bağlantıları.
 *
 * Kurumsal ortamda kayda iliştirilen dosya çoğu zaman uygulamanın içinde
 * durmaz: SharePoint kütüphanesinde, ağ paylaşımında ya da bir sunucu
 * dizinindedir. Bu yüzden ek olarak dosyanın kendisi değil, ona giden
 * bağlantı tutulur — kaynak sistem tek doğru kalır, kopya üretilmez.
 *
 * ÖNEMLİ SINIR: tarayıcılar güvenlik gereği bir web sayfasından
 * `file://` ya da UNC (\\sunucu\pay) adresine tıklamayla gitmeye izin
 * vermez. Bu adresler saklanır ve kopyalanabilir, ama açılamaz. Arayüz
 * bunu gizlemez; açılabilenlerde bağlantı, açılamayanlarda kopyalama
 * sunar.
 */

/** Bağlantı hedefinden kaynak türünü çıkarır. */
export function detectSource(href: string): AttachmentSource {
  const value = href.trim();
  if (!value) return 'other';
  if (/^\\\\/.test(value)) return 'network';
  if (/^file:\/\//i.test(value)) return 'network';
  if (/^[a-zA-Z]:[\\/]/.test(value)) return 'network';
  if (/sharepoint\.com|\/sites\/|\/personal\//i.test(value)) return 'sharepoint';
  if (/^https?:\/\//i.test(value)) {
    // Kurum içi sunucu adresleri (uzantısız ana makine ya da özel ağ) web'den ayrılır.
    const host = value.replace(/^https?:\/\//i, '').split(/[/?#]/)[0] ?? '';
    const isIntranet = !host.includes('.')
      || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|localhost)/i.test(host);
    return isIntranet ? 'server' : 'web';
  }
  return 'other';
}

/**
 * Bağlantı tarayıcıdan açılabilir mi?
 * Yalnızca http ve https açılabilir; diğerleri kopyalanır.
 */
export function isOpenable(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}

/**
 * Hedefin kabul edilebilir olup olmadığı. Sorun yoksa null döner.
 *
 * `javascript:` ve `data:` gibi şemalar bilinçli olarak reddedilir:
 * bir bağlantı alanına girilen çalıştırılabilir içerik, o bağlantıya
 * tıklayan herkes için risktir.
 */
export function attachmentProblem(href: string): string | null {
  const value = href.trim();
  if (!value) return 'Bağlantı adresi boş olamaz.';
  if (/^(javascript|data|vbscript):/i.test(value)) {
    return 'Bu şema kabul edilmiyor. Yalnızca web adresi, ağ yolu veya dosya yolu girin.';
  }
  const looksLikeTarget =
    /^https?:\/\//i.test(value) || /^file:\/\//i.test(value)
    || /^\\\\/.test(value) || /^[a-zA-Z]:[\\/]/.test(value);
  if (!looksLikeTarget) {
    return 'Adres https://…, \\\\sunucu\\pay\\… ya da C:\\… biçiminde olmalı.';
  }
  return null;
}

export const attachmentSourceLabels: Record<AttachmentSource, string> = {
  sharepoint: 'SharePoint',
  web: 'Web',
  network: 'Ağ / Dizin',
  server: 'Sunucu',
  other: 'Diğer',
};

/** Uzun adresleri listede okunur kılar. */
export function shortenHref(href: string, max = 52): string {
  const value = href.trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 12)}…${value.slice(-10)}`;
}

let counter = 0;
export function newAttachmentId(): string {
  counter += 1;
  return `att-${Date.now().toString(36)}-${counter}`;
}
