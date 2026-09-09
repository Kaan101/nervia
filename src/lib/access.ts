import type { Unit, User } from '@/types/grc';
import type {
  Account, MenuKey, Permission, PermissionMap, Role, Scope,
} from '@/types/rbac';
import { widerScope } from '@/types/rbac';

/**
 * Yetki motoru.
 *
 * Tek soru cevaplanır: "bu kullanıcı, bu izni, bu kayıt üzerinde
 * kullanabilir mi?" Cevap üç adımda bulunur:
 *
 *   1. Rollerin izinleri birleştirilir — en geniş kapsam kazanır.
 *   2. Kullanıcı bazlı istisnalar uygulanır — RET her zaman kazanır.
 *   3. Ortaya çıkan kapsam, hedef kayda göre değerlendirilir.
 *
 * Uygulamanın hiçbir yerinde rol adına göre dallanma yapılmaz; her karar
 * buradan geçer. Yönetici bir rolün iznini değiştirdiğinde davranış
 * kodu değiştirmeden değişir.
 */

export interface AccessContext {
  user: User | null;
  account: Account | null;
  roles: Role[];
  units: Unit[];
}

/* ------------------------------------------------------------------ */
/* İzin birleştirme                                                    */
/* ------------------------------------------------------------------ */

/** Rollerin izinlerini birleştirir; aynı izin için geniş kapsam kazanır. */
export function mergeRolePermissions(roles: Role[]): PermissionMap {
  const merged: PermissionMap = {};
  for (const role of roles) {
    for (const [key, scope] of Object.entries(role.permissions) as [Permission, Scope][]) {
      const current = merged[key];
      merged[key] = current ? widerScope(current, scope) : scope;
    }
  }
  return merged;
}

/**
 * Kullanıcının nihai izin haritası: roller + istisnalar.
 * Ret, kapsamı ne olursa olsun izni tamamen kaldırır.
 */
export function effectivePermissions(ctx: AccessContext): PermissionMap {
  if (!ctx.user || !ctx.account) return {};
  const merged = mergeRolePermissions(ctx.roles);

  for (const override of ctx.account.overrides) {
    if (override.effect === 'deny') {
      delete merged[override.permission];
    } else {
      const current = merged[override.permission];
      merged[override.permission] = current
        ? widerScope(current, override.scope)
        : override.scope;
    }
  }
  return merged;
}

/* ------------------------------------------------------------------ */
/* Birim hiyerarşisi                                                   */
/* ------------------------------------------------------------------ */

/**
 * Kullanıcının 'unit' kapsamında eriştiği birimler: kendi birimi, ona
 * bağlı tüm alt birimler ve hesabına eklenmiş ek birimler (matris
 * organizasyonda bir kişi birden çok birimden sorumlu olabilir).
 */
export function reachableUnitIds(ctx: AccessContext): Set<string> {
  const out = new Set<string>();
  if (!ctx.user) return out;

  const childrenOf = new Map<string, string[]>();
  for (const unit of ctx.units) {
    if (!unit.parentId) continue;
    const list = childrenOf.get(unit.parentId) ?? [];
    list.push(unit.id);
    childrenOf.set(unit.parentId, list);
  }

  const roots = [ctx.user.unitId, ...(ctx.account?.extraUnitIds ?? [])];
  const stack = [...roots];
  while (stack.length) {
    const id = stack.pop()!;
    if (!id || out.has(id)) continue;
    out.add(id);
    stack.push(...(childrenOf.get(id) ?? []));
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Karar                                                               */
/* ------------------------------------------------------------------ */

/** Yetki değerlendirmesinin hedefi olan kayıt. */
export interface AccessTarget {
  ownerId?: string;
  unitId?: string;
}

/** Bu izin için kullanıcının sahip olduğu kapsam. */
export function scopeOf(ctx: AccessContext, permission: Permission): Scope {
  if (!ctx.user || !ctx.account?.active) return 'none';
  return effectivePermissions(ctx)[permission] ?? 'none';
}

/**
 * Yetki var mı?
 *
 * Hedef verilmezse yalnızca iznin varlığına bakılır — "yeni risk
 * oluşturabilir mi" gibi kayıttan bağımsız sorular için. Hedef
 * verilirse kapsam o kayda göre değerlendirilir.
 */
export function can(
  ctx: AccessContext,
  permission: Permission,
  target?: AccessTarget,
): boolean {
  const scope = scopeOf(ctx, permission);
  if (scope === 'none') return false;
  if (scope === 'all') return true;
  // Hedefsiz sorularda dar kapsam da yeterlidir: kullanıcı en azından
  // kendi kayıtlarında bu işlemi yapabiliyor demektir.
  if (!target) return true;

  if (scope === 'own') return Boolean(target.ownerId && target.ownerId === ctx.user!.id);

  // scope === 'unit': kendi kayıtları da kapsama dâhildir.
  if (target.ownerId && target.ownerId === ctx.user!.id) return true;
  return Boolean(target.unitId && reachableUnitIds(ctx).has(target.unitId));
}

/** Menü/rota erişimi. */
export function canSeeMenu(ctx: AccessContext, key: MenuKey): boolean {
  return can(ctx, `menu.${key}` as Permission);
}

/** Bu kullanıcının erişebildiği menü anahtarları. */
export function visibleMenus(ctx: AccessContext, keys: readonly MenuKey[]): MenuKey[] {
  return keys.filter((k) => canSeeMenu(ctx, k));
}
