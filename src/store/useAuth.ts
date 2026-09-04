import { create } from 'zustand';
import type { ProcessNode, RoleId, User } from '@/types/grc';
import { userById, users } from '@/data/org';

const STORAGE_KEY = 'nervia.session';

/** Yetki seviyeleri: hangi rol neyi yapabilir. */
const globalViewRoles: RoleId[] = [
  'internal_control', 'risk_management', 'internal_audit', 'executive', 'system_admin',
];

const editorRoles: RoleId[] = ['process_owner', 'unit_manager', 'internal_control', 'risk_management', 'system_admin'];

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
  /** Audit trail’in tamamını görebilir mi? */
  viewAudit: boolean;
}

export function capabilitiesOf(user: User | null): Capabilities {
  if (!user) {
    return { viewAll: false, approve: false, assessControls: false, assessRisks: false, administer: false, viewAudit: false };
  }
  const has = (r: RoleId) => user.roles.includes(r);
  return {
    viewAll: user.roles.some((r) => globalViewRoles.includes(r)),
    approve: has('unit_manager') || has('internal_control') || has('risk_management') || has('system_admin'),
    assessControls: has('internal_control') || has('system_admin'),
    assessRisks: has('risk_management') || has('system_admin'),
    administer: has('system_admin'),
    viewAudit: has('internal_audit') || has('internal_control') || has('system_admin') || has('executive'),
  };
}

/** Kullanıcı bu süreç düğümünde değişiklik yapabilir mi? */
export function canEditNode(user: User | null, node: ProcessNode | undefined): boolean {
  if (!user || !node) return false;
  if (user.roles.includes('system_admin')) return true;
  if (!user.roles.some((r) => editorRoles.includes(r))) return false;
  if (user.roles.includes('internal_control') || user.roles.includes('risk_management')) return true;
  if (node.ownerId === user.id) return true;
  if (user.roles.includes('unit_manager') && node.unitId === user.unitId) return true;
  return false;
}

interface AuthState {
  currentUser: User | null;
  capabilities: Capabilities;
  login: (userId: string) => void;
  logout: () => void;
}

function restore(): User | null {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    return id ? userById.get(id) ?? null : null;
  } catch {
    return null;
  }
}

const initial = restore();

export const useAuth = create<AuthState>((set) => ({
  currentUser: initial,
  capabilities: capabilitiesOf(initial),
  login: (userId) => {
    const user = userById.get(userId) ?? null;
    try {
      if (user) localStorage.setItem(STORAGE_KEY, user.id);
    } catch { /* depolama kapalı olabilir */ }
    set({ currentUser: user, capabilities: capabilitiesOf(user) });
  },
  logout: () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* yoksay */ }
    set({ currentUser: null, capabilities: capabilitiesOf(null) });
  },
}));

/** Giriş ekranında sunulan hızlı personalar. */
export const demoPersonas = [
  'usr-01', 'usr-02', 'usr-03', 'usr-08', 'usr-12', 'usr-20', 'usr-22', 'usr-24', 'usr-25',
].map((id) => users.find((u) => u.id === id)!).filter(Boolean);
