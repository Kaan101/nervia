import { useAuth, userCanSeeMenu } from '@/store/useAuth';
import type { MenuKey } from '@/types/rbac';
import { navByKey } from '@/lib/navigation';
import { IconLock } from '@/components/common/Icons';

/**
 * Rota koruması.
 *
 * Menüden gizlemek yetmez — adres çubuğuna yazarak açılabilen bir sayfa
 * yetkilendirilmiş sayılmaz. Yönlendirme yerine açıklayıcı bir ekran
 * gösterilir: kullanıcı neyin eksik olduğunu bilsin, sessizce başka bir
 * sayfaya atılmasın.
 */
export function RequireMenu({ menu, children }: { menu: MenuKey; children: React.ReactNode }) {
  const currentUser = useAuth((s) => s.currentUser);
  // revision'a abone olmak, yönetici yetkiyi değiştirdiğinde bu korumanın
  // yeniden değerlendirilmesini sağlar.
  useAuth((s) => s.revision);

  if (userCanSeeMenu(currentUser, menu)) return <>{children}</>;

  const entry = navByKey.get(menu);
  return (
    <div className="page">
      <div className="card" style={{ maxWidth: '58ch', margin: '10vh auto', textAlign: 'center' }}>
        <div className="stack gap-3" style={{ alignItems: 'center', padding: 'var(--s6)' }}>
          <IconLock size={28} />
          <h3>Bu sayfaya erişim yetkiniz yok</h3>
          <p className="muted">
            <strong>{entry?.label ?? 'Bu sayfa'}</strong> için gereken izin hesabınızda tanımlı
            değil. Erişim gerekiyorsa sistem yöneticisinden <code>menu.{menu}</code> iznini
            talep edin.
          </p>
        </div>
      </div>
    </div>
  );
}
