import type { MenuKey } from '@/types/rbac';

/**
 * Menü anahtarı ile rota arasındaki tek eşleme.
 *
 * Hem kenar çubuğu hem rota koruması buradan okur; böylece bir sayfa
 * menüden gizlenip adres çubuğundan açılabilir hâle gelemez.
 */
export interface NavEntry {
  key: MenuKey;
  path: string;
  label: string;
  group: 'Genel Bakış' | 'Risk ve Kontrol' | 'Yönetim' | 'Analiz' | 'Sistem';
}

export const navEntries: NavEntry[] = [
  { key: 'dashboard', path: '/', label: 'Dashboard', group: 'Genel Bakış' },
  { key: 'akis', path: '/akis', label: 'Süreç Akışı', group: 'Genel Bakış' },
  { key: 'iliskiler', path: '/iliskiler', label: 'Bağlantı Ağı', group: 'Genel Bakış' },

  { key: 'isi-haritasi', path: '/isi-haritasi', label: 'Risk Isı Haritası', group: 'Risk ve Kontrol' },
  { key: 'riskler', path: '/riskler', label: 'Risk Kütüphanesi', group: 'Risk ve Kontrol' },
  { key: 'kontroller', path: '/kontroller', label: 'Kontrol Kütüphanesi', group: 'Risk ve Kontrol' },
  { key: 'kri', path: '/kri', label: 'KRI Göstergeleri', group: 'Risk ve Kontrol' },

  { key: 'aksiyonlar', path: '/aksiyonlar', label: 'Aksiyonlar', group: 'Yönetim' },
  { key: 'dokumanlar', path: '/dokumanlar', label: 'Dokümanlar', group: 'Yönetim' },
  { key: 'gozden-gecirme', path: '/gozden-gecirme', label: 'Gözden Geçirme', group: 'Yönetim' },
  { key: 'degisiklikler', path: '/degisiklikler', label: 'Değişiklik Yönetimi', group: 'Yönetim' },

  { key: 'asistan', path: '/asistan', label: 'Analiz Asistanı', group: 'Analiz' },
  { key: 'arama', path: '/arama', label: 'Global Arama', group: 'Analiz' },
  { key: 'audit', path: '/audit', label: 'Audit Trail', group: 'Analiz' },
  { key: 'standartlar', path: '/standartlar', label: 'Standart Uyumu', group: 'Analiz' },

  { key: 'kullanicilar', path: '/kullanicilar', label: 'Kullanıcı Yönetimi', group: 'Sistem' },
  { key: 'yetkiler', path: '/yetkiler', label: 'Rol ve Yetki Yönetimi', group: 'Sistem' },
];

export const navByKey = new Map(navEntries.map((e) => [e.key, e]));

/** Rota yolundan menü anahtarını bulur; alt rotalar üst sayfanın anahtarını taşır. */
export function menuKeyForPath(pathname: string): MenuKey | null {
  if (pathname === '/') return 'dashboard';
  const base = `/${pathname.split('/')[1] ?? ''}`;
  return navEntries.find((e) => e.path === base)?.key ?? null;
}
