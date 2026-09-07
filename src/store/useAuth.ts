import { create } from 'zustand';
import type { ProcessNode, User } from '@/types/grc';
import type { AccessContext, AccessTarget } from '@/lib/access';
import { can, canSeeMenu, effectivePermissions, reachableUnitIds } from '@/lib/access';
import type { MenuKey, Permission } from '@/types/rbac';
import { userById } from '@/data/org';
import { accountByEmail } from '@/data/accounts';
import { verifyPassword } from '@/lib/password';
import { useData } from './useData';

const STORAGE_KEY = 'nervia.session';

/** Art arda kaç hatalı denemeden sonra hesap kilitlenir. */
const MAX_ATTEMPTS = 5;
/** Kilit süresi (dakika). */
const LOCK_MINUTES = 15;

/* ------------------------------------------------------------------ */
/* Yetki bağlamı                                                       */
/* ------------------------------------------------------------------ */

/**
 * Yetki motoru için bağlam üretir.
 *
 * Roller ve hesaplar veri kümesinde yaşıyor (yönetici düzenleyebiliyor,
 * değişiklik denetim izine düşüyor, kalıcılık katmanı kaydediyor), bu
 * yüzden bağlam her sorguda oradan okunur.
 */
export function accessContextFor(user: User | null): AccessContext {
  const data = useData.getState().data;
  const account = user ? data.accounts.find((a) => a.userId === user.id) ?? null : null;
  const roles = account
    ? account.roleIds.map((id) => data.roles.find((r) => r.id === id)).filter((r) => !!r)
    : [];
  return { user, account, roles, units: data.units };
}

/** Tek atışlık yetki sorgusu — bileşen dışından da çağrılabilir. */
export function userCan(user: User | null, permission: Permission, target?: AccessTarget): boolean {
  return can(accessContextFor(user), permission, target);
}

/* ------------------------------------------------------------------ */
/* Türetilmiş yetenekler                                               */
/* ------------------------------------------------------------------ */

export interface Capabilities {
  /** Tüm organizasyonu görüntüleyebilir mi? */
  viewAll: boolean;
  /** Değişiklik talebi onaylayabilir mi? */
  approve: boolean;
  /** Kontrol etkinliğini değerlendirebilir mi? */
  assessControls: boolean;
  /** Risk skorunu güncelleyebilir mi? */
  assessRisks: boolean;
  /** Kullanıcı ve sistem yönetimi. */
  administer: boolean;
  /** Audit trail'in tamamını görebilir mi? */
  viewAudit: boolean;
}

/**
 * Eski yetenek bayrakları, artık izin motorundan türetiliyor.
 * Arayüz bunları kullanmayı sürdürüyor; kaynağı değişti.
 */
export function capabilitiesOf(user: User | null): Capabilities {
  if (!user) {
    return {
      viewAll: false, approve: false, assessControls: false,
      assessRisks: false, administer: false, viewAudit: false,
    };
  }
  const ctx = accessContextFor(user);
  const perms = effectivePermissions(ctx);
  return {
    viewAll: perms['risk.read'] === 'all' || perms['process.read'] === 'all',
    approve: can(ctx, 'approve.manager') || can(ctx, 'approve.second_line'),
    assessControls: perms['control.update'] === 'all',
    assessRisks: perms['risk.update'] === 'all',
    administer: can(ctx, 'admin.users') || can(ctx, 'admin.roles'),
    viewAudit: can(ctx, 'audit.view'),
  };
}

/** Menü görünürlüğü. */
export function userCanSeeMenu(user: User | null, key: MenuKey): boolean {
  return canSeeMenu(accessContextFor(user), key);
}

/* ------------------------------------------------------------------ */
/* Kayıt bazlı yetkiler                                                */
/* ------------------------------------------------------------------ */

/** Kullanıcı bu süreç düğümünde değişiklik yapabilir mi? */
export function canEditNode(user: User | null, node: ProcessNode | undefined): boolean {
  if (!node) return false;
  return userCan(user, 'process.update', { ownerId: node.ownerId, unitId: node.unitId });
}

/** Yeni risk / kontrol / aksiyon tanımlayabilir mi? */
export function canCreateRecords(user: User | null): boolean {
  return userCan(user, 'risk.create') || userCan(user, 'control.create')
    || userCan(user, 'action.create');
}

/** Belirli bir kaydı düzenleyebilir mi? Sahiplik ya da birim sorumluluğu gerekir. */
export function canEditRecord(
  user: User | null,
  record: { ownerId: string; unitId?: string } | undefined,
): boolean {
  if (!record) return false;
  return userCan(user, 'risk.update', record);
}

/**
 * Arşivleme yetkisi. Kayıt kütüphaneden düştüğü için kasıtlı olarak
 * düzenlemeden dar tutulur.
 */
export function canArchiveRecords(user: User | null): boolean {
  return userCan(user, 'risk.archive') || userCan(user, 'control.archive');
}

/** Aksiyonu güncelleyebilir mi? Sorumlusu da güncelleyebilir. */
export function canEditAction(user: User | null, action: { ownerId: string } | undefined): boolean {
  if (!action) return false;
  return userCan(user, 'action.update', { ownerId: action.ownerId });
}

/** Kullanıcının 'birim' kapsamında eriştiği birimler. */
export function unitsInScope(user: User | null): Set<string> {
  return reachableUnitIds(accessContextFor(user));
}

/* ------------------------------------------------------------------ */
/* Oturum                                                              */
/* ------------------------------------------------------------------ */

export type LoginResult =
  | { ok: true; mustChangePassword: boolean }
  | { ok: false; error: string };

interface AuthState {
  currentUser: User | null;
  capabilities: Capabilities;
  /** Yetkiler değiştiğinde arayüzün yeniden hesaplaması için sayaç. */
  revision: number;
  /** E-posta + parola ile giriş. */
  login: (email: string, password: string) => Promise<LoginResult>;
  /** Kimlik doğrulamadan oturum açar — gösterim ve otomatik testler için. */
  loginAs: (userId: string) => void;
  logout: () => void;
  /** Yetki tanımları değiştiğinde yetenekleri tazeler. */
  refresh: () => void;
}

function restore(): User | null {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    if (!id) return null;
    const user = userById.get(id);
    if (!user) return null;
    // Pasif hesap oturumu sürdüremez.
    const account = useData.getState().data.accounts.find((a) => a.userId === id);
    return account && !account.active ? null : user;
  } catch {
    return null;
  }
}

const initial = restore();

export const useAuth = create<AuthState>((set) => ({
  currentUser: initial,
  capabilities: capabilitiesOf(initial),
  revision: 0,

  login: async (email, password) => {
    const dataState = useData.getState();
    const account = accountByEmail(dataState.data.accounts, email);
    if (!account) {
      // Hesabın var olup olmadığını ele vermemek için tek bir mesaj.
      return { ok: false, error: 'E-posta veya parola hatalı.' };
    }
    if (!account.active) {
      return { ok: false, error: 'Bu hesap pasif durumda. Sistem yöneticisine başvurun.' };
    }
    if (account.lockedUntil && new Date(account.lockedUntil) > new Date()) {
      const dk = Math.ceil((new Date(account.lockedUntil).getTime() - Date.now()) / 60000);
      return { ok: false, error: `Hesap geçici olarak kilitli. ${dk} dakika sonra tekrar deneyin.` };
    }

    const valid = await verifyPassword(password, account.passwordSalt, account.passwordHash);
    if (!valid) {
      dataState.registerFailedLogin(account.userId, MAX_ATTEMPTS, LOCK_MINUTES);
      const left = MAX_ATTEMPTS - (account.failedAttempts + 1);
      return {
        ok: false,
        error: left > 0
          ? `E-posta veya parola hatalı. ${left} deneme hakkınız kaldı.`
          : `Hesap ${LOCK_MINUTES} dakika kilitlendi.`,
      };
    }

    const user = userById.get(account.userId) ?? null;
    if (!user) return { ok: false, error: 'Kullanıcı kaydı bulunamadı.' };

    dataState.registerSuccessfulLogin(account.userId);
    try { localStorage.setItem(STORAGE_KEY, user.id); } catch { /* depolama kapalı olabilir */ }
    set((s) => ({
      currentUser: user,
      capabilities: capabilitiesOf(user),
      revision: s.revision + 1,
    }));
    return { ok: true, mustChangePassword: account.mustChangePassword };
  },

  loginAs: (userId) => {
    const user = userById.get(userId) ?? null;
    try {
      if (user) localStorage.setItem(STORAGE_KEY, user.id);
    } catch { /* depolama kapalı olabilir */ }
    set((s) => ({
      currentUser: user,
      capabilities: capabilitiesOf(user),
      revision: s.revision + 1,
    }));
  },

  logout: () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* yoksay */ }
    set((s) => ({ currentUser: null, capabilities: capabilitiesOf(null), revision: s.revision + 1 }));
  },

  refresh: () => set((s) => ({
    capabilities: capabilitiesOf(s.currentUser),
    revision: s.revision + 1,
  })),
}));

/**
 * Rol ya da hesap tanımı değiştiğinde oturumdaki kullanıcının yetkileri
 * anında tazelensin: yöneticinin verdiği yetki bir sonraki tıklamada
 * geçerli olmalı, yeniden giriş beklememeli.
 */
useData.subscribe((state, prev) => {
  if (state.data.roles === prev.data.roles && state.data.accounts === prev.data.accounts) return;
  useAuth.getState().refresh();
});
