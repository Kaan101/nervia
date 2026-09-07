import type { Dataset } from '@/types/grc';

/**
 * Yerel kalıcılık.
 *
 * Uygulama arka uçsuz çalıştığı için veri kümesinin tamamı tarayıcının
 * `localStorage`'ında anlık görüntü (snapshot) olarak tutulur. Snapshot,
 * demo verisinin sürümüyle etiketlenir: seed verisi değiştiğinde
 * `SEED_VERSION` artırılır ve eski snapshot sessizce atılır — böylece
 * kullanıcı, güncellenmiş demo verisiyle uyumsuz bir kayıtla baş başa kalmaz.
 */

const STORAGE_KEY = 'nervia.dataset';

/** Seed verisi her değiştiğinde artırılır. */
export const SEED_VERSION = 4;

interface Snapshot {
  seedVersion: number;
  savedAt: string;
  data: Dataset;
}

export interface PersistenceState {
  /** Kayıtlı bir snapshot'tan yüklendi mi? */
  restored: boolean;
  /** Son yazma başarısız olduysa nedeni. */
  error: string | null;
  savedAt: string | null;
}

export const persistenceState: PersistenceState = { restored: false, error: null, savedAt: null };

function storage(): Storage | null {
  try {
    // Gizli sekmede veya depolama kapalıyken erişim istisna atabilir.
    const s = window.localStorage;
    const probe = '__nervia_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function loadSnapshot(): Dataset | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Snapshot;
    if (parsed.seedVersion !== SEED_VERSION) {
      s.removeItem(STORAGE_KEY);
      return null;
    }
    if (!parsed.data?.nodes?.length || !parsed.data?.risks) return null;
    persistenceState.restored = true;
    persistenceState.savedAt = parsed.savedAt;
    return parsed.data;
  } catch {
    // Bozuk kayıt: sessizce demo verisine dön.
    try { s.removeItem(STORAGE_KEY); } catch { /* yoksay */ }
    return null;
  }
}

export function saveSnapshot(data: Dataset): void {
  const s = storage();
  if (!s) {
    persistenceState.error = 'Tarayıcı depolaması kullanılamıyor; değişiklikler kalıcı olmayacak.';
    return;
  }
  const snapshot: Snapshot = { seedVersion: SEED_VERSION, savedAt: new Date().toISOString(), data };
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    persistenceState.error = null;
    persistenceState.savedAt = snapshot.savedAt;
  } catch (e) {
    persistenceState.error =
      e instanceof Error && e.name === 'QuotaExceededError'
        ? 'Tarayıcı depolama alanı doldu; değişiklikler kalıcı olmayacak.'
        : 'Değişiklikler kaydedilemedi.';
  }
}

export function clearSnapshot(): void {
  const s = storage();
  if (!s) return;
  try { s.removeItem(STORAGE_KEY); } catch { /* yoksay */ }
  persistenceState.restored = false;
  persistenceState.savedAt = null;
}

/** Kayıtlı snapshot'ın yaklaşık boyutu (KB). Arayüzde bilgi amaçlı gösterilir. */
export function snapshotSizeKb(): number | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(STORAGE_KEY);
    return raw ? Math.round((raw.length * 2) / 1024) : null;
  } catch {
    return null;
  }
}
