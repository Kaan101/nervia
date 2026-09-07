import type { PermissionMap, Role, Scope } from '@/types/rbac';
import { actions, menuKeys, resources } from '@/types/rbac';
import type { MenuKey, Permission, ResourceId } from '@/types/rbac';

/**
 * Yerleşik roller.
 *
 * Bu tanımlar, sistemin bugüne kadar koda gömülü olan davranışının
 * veriye dökülmüş hâlidir — yönetici artık bunları arayüzden
 * değiştirebiliyor. Varsayılanlar bilinçli olarak eski davranışla
 * aynı: rol tanımına dokunulmadığında hiçbir şey değişmez.
 */

/** Tüm kaynaklara aynı kapsamda tek bir eylem izni verir. */
function everyResource(action: (typeof actions)[number], scope: Scope): PermissionMap {
  const map: PermissionMap = {};
  for (const r of resources) map[`${r}.${action}` as Permission] = scope;
  return map;
}

/** Verilen kaynaklara birden çok eylemi aynı kapsamda verir. */
function grant(
  list: ResourceId[],
  acts: (typeof actions)[number][],
  scope: Scope,
): PermissionMap {
  const map: PermissionMap = {};
  for (const r of list) for (const a of acts) map[`${r}.${a}` as Permission] = scope;
  return map;
}

/** Menü izinlerini açar. */
function menus(...keys: MenuKey[]): PermissionMap {
  const map: PermissionMap = {};
  for (const k of keys) map[`menu.${k}` as Permission] = 'all';
  return map;
}

/** Her rolün gördüğü temel menüler — analiz ve arama herkese açıktır. */
const baseMenus = menus('dashboard', 'kanvas', 'surecler', 'arama');

/** Okuma ağırlıklı rollerin gördüğü menüler. */
const readerMenus = menus(
  'dashboard', 'kanvas', 'surecler', 'iliskiler', 'isi-haritasi', 'riskler', 'kontroller',
  'kri', 'aksiyonlar', 'dokumanlar', 'gozden-gecirme', 'degisiklikler',
  'asistan', 'arama', 'standartlar',
);

/** Yönetici rollerinin gördüğü menülerin tamamı. */
const allMenus = menus(...menuKeys);

export const builtInRoles: Role[] = [
  {
    id: 'employee',
    name: 'Çalışan',
    description:
      'Süreçleri ve kendi sorumluluğundaki kayıtları görür. Kayıt oluşturamaz, '
      + 'başkasının kaydını değiştiremez. Kendi aksiyonlarını günceller.',
    builtIn: true,
    defenceLine: 1,
    permissions: {
      ...baseMenus,
      ...menus('riskler', 'kontroller', 'aksiyonlar', 'dokumanlar', 'isi-haritasi', 'asistan'),
      ...everyResource('read', 'all'),
      'action.update': 'own',
    },
  },
  {
    id: 'process_owner',
    name: 'Süreç Sahibi',
    description:
      'Sahibi olduğu süreçleri, riskleri ve kontrolleri yönetir. Yeni kayıt '
      + 'tanımlayabilir; değişikliği kritik alanlardaysa onaya düşer.',
    builtIn: true,
    defenceLine: 1,
    permissions: {
      ...readerMenus,
      ...everyResource('read', 'all'),
      ...grant(['process', 'risk', 'control', 'action', 'document'], ['create'], 'all'),
      ...grant(['process', 'risk', 'control', 'action', 'document'], ['update'], 'own'),
      'review.update': 'own',
    },
  },
  {
    id: 'unit_manager',
    name: 'Birim Yöneticisi',
    description:
      'Kendi biriminin tüm kayıtlarını yönetir ve değişiklik taleplerinde '
      + 'birinci kademe onayı verir.',
    builtIn: true,
    defenceLine: 1,
    permissions: {
      ...readerMenus,
      ...everyResource('read', 'all'),
      ...grant(['process', 'risk', 'control', 'action', 'document'], ['create'], 'all'),
      ...grant(['process', 'risk', 'control', 'action', 'document', 'review'], ['update'], 'unit'),
      'approve.manager': 'all',
    },
  },
  {
    id: 'internal_control',
    name: 'İç Kontrol',
    description:
      'İkinci savunma hattı. Tüm kayıtları kapsam sınırı olmadan düzenler, '
      + 'kontrol etkinliğini değerlendirir, ikinci kademe onayı verir.',
    builtIn: true,
    defenceLine: 2,
    permissions: {
      ...readerMenus,
      ...menus('audit'),
      ...everyResource('read', 'all'),
      ...everyResource('create', 'all'),
      ...everyResource('update', 'all'),
      ...everyResource('archive', 'all'),
      'approve.second_line': 'all',
      'audit.view': 'all',
    },
  },
  {
    id: 'risk_management',
    name: 'Risk Yönetimi',
    description:
      'İkinci savunma hattı. Risk skorlarını revize eder, risk iştahını '
      + 'yönetir, risk taleplerinde ikinci kademe onayı verir.',
    builtIn: true,
    defenceLine: 2,
    permissions: {
      ...readerMenus,
      ...menus('audit'),
      ...everyResource('read', 'all'),
      ...everyResource('create', 'all'),
      ...everyResource('update', 'all'),
      ...everyResource('archive', 'all'),
      'approve.second_line': 'all',
      'audit.view': 'all',
    },
  },
  {
    id: 'internal_audit',
    name: 'İç Denetim',
    description:
      'Üçüncü savunma hattı. Bağımsız güvence sağlar: her şeyi görür, '
      + 'hiçbir şeyi değiştirmez. Bağımsızlık bunu gerektirir.',
    builtIn: true,
    defenceLine: 3,
    permissions: {
      ...readerMenus,
      ...menus('audit'),
      ...everyResource('read', 'all'),
      'audit.view': 'all',
    },
  },
  {
    id: 'executive',
    name: 'Üst Yönetim',
    description:
      'Kurumsal risk profilini ve denetim izini izler. Operasyonel kayıtlara '
      + 'müdahale etmez.',
    builtIn: true,
    defenceLine: 0,
    permissions: {
      ...readerMenus,
      ...menus('audit'),
      ...everyResource('read', 'all'),
      'audit.view': 'all',
    },
  },
  {
    id: 'system_admin',
    name: 'Sistem Yöneticisi',
    description:
      'Kullanıcı hesapları, roller ve izinler. Teknik yönetim yetkisidir; '
      + 'GRC kararlarının sahibi değildir.',
    builtIn: true,
    permissions: {
      ...allMenus,
      ...everyResource('read', 'all'),
      ...everyResource('create', 'all'),
      ...everyResource('update', 'all'),
      ...everyResource('archive', 'all'),
      'approve.manager': 'all',
      'approve.second_line': 'all',
      'audit.view': 'all',
      'admin.users': 'all',
      'admin.roles': 'all',
      'admin.reset_password': 'all',
    },
  },
];

export const roleById = new Map(builtInRoles.map((r) => [r.id, r]));
