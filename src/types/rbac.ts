/**
 * Yetkilendirme modeli.
 *
 * Üç katman:
 *   1. İZİN    — atomik yetki: "risk.update", "menu.riskler"
 *   2. KAPSAM  — bu izin hangi kayıtlarda geçerli: tümü / birim / kendi
 *   3. ROL     — izin + kapsam demeti; yöneticinin düzenleyebildiği yapı
 *
 * Kullanıcı bir veya birden çok rol taşır. Roller birleşir (en geniş kapsam
 * kazanır). Bunun üstüne kullanıcıya özel istisnalar eklenebilir; ret,
 * her zaman izinden önce gelir.
 */

/* ------------------------------------------------------------------ */
/* Kaynaklar ve eylemler                                               */
/* ------------------------------------------------------------------ */

/** Yetkilendirilebilir kaynak türleri. */
export const resources = [
  'process', 'risk', 'control', 'action', 'document', 'kri', 'review',
] as const;
export type ResourceId = (typeof resources)[number];

/** Kayıt üzerinde yapılabilecek eylemler. */
export const actions = ['read', 'create', 'update', 'archive'] as const;
export type ActionId = (typeof actions)[number];

/** Kaynağa bağlı olmayan, sistem geneli yetkiler. */
export const systemPermissions = [
  'approve.manager',      // birinci kademe onay (birim yöneticisi)
  'approve.second_line',  // ikinci kademe onay (İç Kontrol / Risk Yönetimi)
  'audit.view',           // denetim izinin tamamını görme
  'admin.users',          // kullanıcı hesapları
  'admin.roles',          // rol ve izin tanımları
  'admin.reset_password', // başkasının parolasını sıfırlama
] as const;
export type SystemPermission = (typeof systemPermissions)[number];

/** Menü/rota erişimi. Anahtarlar rota tanımlarıyla birebir eşleşir. */
export const menuKeys = [
  'dashboard', 'kanvas', 'is-akisi', 'surecler', 'iliskiler', 'isi-haritasi', 'riskler', 'kontroller',
  'kri', 'aksiyonlar', 'dokumanlar', 'gozden-gecirme', 'degisiklikler',
  'asistan', 'arama', 'audit', 'standartlar', 'kullanicilar', 'yetkiler',
] as const;
export type MenuKey = (typeof menuKeys)[number];

/**
 * Bir izin dizgisi. Üç biçimden biri:
 *   "risk.update"      — kaynak.eylem
 *   "audit.view"       — sistem yetkisi
 *   "menu.riskler"     — menü erişimi
 */
export type Permission =
  | `${ResourceId}.${ActionId}`
  | SystemPermission
  | `menu.${MenuKey}`;

/** Kaynak-eylem iznini birleştirir. */
export function perm(resource: ResourceId, action: ActionId): Permission {
  return `${resource}.${action}` as Permission;
}

/** Menü iznini birleştirir. */
export function menuPerm(key: MenuKey): Permission {
  return `menu.${key}` as Permission;
}

/* ------------------------------------------------------------------ */
/* Kapsam                                                              */
/* ------------------------------------------------------------------ */

/**
 * Bir iznin hangi kayıtlarda geçerli olduğu.
 *
 *   all  — organizasyonun tamamı
 *   unit — kullanıcının birimi ve alt birimleri
 *   own  — yalnızca kullanıcının sahibi olduğu kayıtlar
 *   none — yetki yok
 *
 * Sıralama anlamlıdır: geniş olan dar olanı kapsar.
 */
export const scopes = ['none', 'own', 'unit', 'all'] as const;
export type Scope = (typeof scopes)[number];

/** İki kapsamdan geniş olanı. Roller birleşirken kullanılır. */
export function widerScope(a: Scope, b: Scope): Scope {
  return scopes.indexOf(a) >= scopes.indexOf(b) ? a : b;
}

/* ------------------------------------------------------------------ */
/* Roller                                                              */
/* ------------------------------------------------------------------ */

/**
 * Bir rolün izin haritası.
 *
 * Kaynak izinleri kapsam taşır; sistem ve menü izinleri taşımaz
 * (ya vardır ya yoktur, bu yüzden 'all' ya da 'none' olarak tutulur).
 */
export type PermissionMap = Partial<Record<Permission, Scope>>;

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: PermissionMap;
  /**
   * Yerleşik roller silinemez ve yeniden adlandırılamaz; izinleri
   * düzenlenebilir. Organizasyonun kendi tanımladığı roller serbesttir.
   */
  builtIn: boolean;
  /** Three Lines Model'de bu rolün konumu — raporlamada kullanılır. */
  defenceLine?: 0 | 1 | 2 | 3;
}

/* ------------------------------------------------------------------ */
/* Kullanıcı bazlı istisnalar                                          */
/* ------------------------------------------------------------------ */

/**
 * Tek bir kullanıcıya rollerinin dışında verilen ya da elinden alınan yetki.
 *
 * Ret her zaman kazanır: bir kullanıcıya rolü izin verse bile açıkça
 * yasaklanmışsa yetki yoktur. Bu, "geçici olarak kısıtla" ihtiyacını
 * rolü bozmadan karşılar.
 */
export interface PermissionOverride {
  permission: Permission;
  /** 'grant' kapsamı yükseltir, 'deny' izni tamamen kaldırır. */
  effect: 'grant' | 'deny';
  scope: Scope;
  reason: string;
}

/** Kullanıcının kimlik ve yetki kaydı. */
export interface Account {
  userId: string;
  /** Giriş için kullanılan e-posta. */
  email: string;
  /** Parolanın SHA-256 özeti (salt ile). Düz parola hiçbir yerde tutulmaz. */
  passwordHash: string;
  passwordSalt: string;
  /** Pasif hesap giriş yapamaz. */
  active: boolean;
  roleIds: string[];
  overrides: PermissionOverride[];
  /**
   * Kullanıcının yetkilerinin geçerli olduğu ek birimler. Boşsa yalnızca
   * kendi birimi. Matris organizasyonlarda bir kişi birden çok birimden
   * sorumlu olabiliyor.
   */
  extraUnitIds: string[];
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  failedAttempts: number;
  /** Kilit açılma zamanı; null ise kilit yok. */
  lockedUntil: string | null;
}
