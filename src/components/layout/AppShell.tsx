import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, userCanSeeMenu } from '@/store/useAuth';
import type { MenuKey } from '@/types/rbac';
import type { NavEntry } from '@/lib/navigation';
import { navEntries } from '@/lib/navigation';
import { useData } from '@/store/useData';
import { useUi } from '@/store/useUi';
import { portfolio } from '@/lib/selectors';
import { roleLabels } from '@/lib/labels';
import { Avatar } from '@/components/common/Primitives';
import { CommandPalette } from './CommandPalette';
import { NoticeToast } from './NoticeToast';
import {
  IconAction, IconAudit, IconBook, IconChange, IconClock, IconControl, IconDashboard,
  IconDoc, IconHeat, IconLayers, IconLogout, IconMenu, IconNetwork, IconProcess, IconRisk,
  IconSearch, IconSettings, IconShield, IconSparkles, IconTarget, IconUsers,
} from '@/components/common/Icons';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  alert?: boolean;
}

export function AppShell() {
  const { currentUser, logout } = useAuth();
  // Yetkiler değişince menü yeniden hesaplansın.
  const revision = useAuth((s) => s.revision);
  const data = useData((s) => s.data);
  const { sidebarCollapsed, toggleSidebar, setPaletteOpen } = useUi();
  const [userMenu, setUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const stats = useMemo(() => portfolio(data), [data]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPaletteOpen]);

  useEffect(() => { setUserMenu(false); }, [location.pathname]);

  const pendingApprovals = data.changeRequests.filter(
    (c) => c.status === 'pending_manager' || c.status === 'pending_control',
  ).length;

  /** Menü anahtarına göre simge ve rozet. Sıra ve etiket navEntries'ten gelir. */
  const decor: Partial<Record<MenuKey, { icon: React.ReactNode; badge?: number; alert?: boolean }>> = {
    dashboard: { icon: <IconDashboard size={17} /> },
    kanvas: { icon: <IconLayers size={17} /> },
    surecler: { icon: <IconProcess size={17} /> },
    iliskiler: { icon: <IconNetwork size={17} /> },
    'isi-haritasi': { icon: <IconHeat size={17} /> },
    riskler: { icon: <IconRisk size={17} />, badge: stats.riskCount },
    kontroller: { icon: <IconControl size={17} />, badge: stats.controlCount },
    kri: { icon: <IconTarget size={17} /> },
    aksiyonlar: {
      icon: <IconAction size={17} />,
      badge: stats.overdueActionCount,
      alert: stats.overdueActionCount > 0,
    },
    dokumanlar: { icon: <IconDoc size={17} /> },
    'gozden-gecirme': {
      icon: <IconClock size={17} />,
      badge: stats.reviewOverdueCount,
      alert: stats.reviewOverdueCount > 0,
    },
    degisiklikler: { icon: <IconChange size={17} />, badge: pendingApprovals },
    asistan: { icon: <IconSparkles size={17} /> },
    arama: { icon: <IconSearch size={17} /> },
    audit: { icon: <IconAudit size={17} /> },
    standartlar: { icon: <IconBook size={17} /> },
    kullanicilar: { icon: <IconUsers size={17} /> },
    yetkiler: { icon: <IconShield size={17} /> },
  };

  // Menü izinden türetiliyor: yöneticinin bir rolden kaldırdığı sayfa
  // o rolün kullanıcılarında anında kaybolur.
  const groups = useMemo(() => {
    const visible = navEntries.filter((e) => userCanSeeMenu(currentUser, e.key));
    const order: NavEntry['group'][] = ['Genel Bakış', 'Risk ve Kontrol', 'Yönetim', 'Analiz', 'Sistem'];
    return order
      .map((title) => ({
        title,
        items: visible
          .filter((e) => e.group === title)
          .map((e) => ({ to: e.path, label: e.label, ...(decor[e.key] ?? { icon: null }) }) as NavItem),
      }))
      .filter((g) => g.items.length > 0);
    // decor her render'da yeniden kuruluyor; bağımlılık olarak sayaçları veriyoruz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, revision, stats, pendingApprovals]);

  return (
    <div className="shell">
      <nav className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} aria-label="Ana gezinme">
        <div className="sidebar-brand">
          <span className="logo">N</span>
          <span className="stack">
            <span className="name">Nervia</span>
            <span className="sub">İÇ KONTROL & RİSK</span>
          </span>
        </div>

        <div className="sidebar-nav">
          {groups.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-title">{group.title}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                  title={item.label}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge ? <span className={`pill ${item.alert ? 'alert' : ''}`}>{item.badge}</span> : null}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-foot" style={{ position: 'relative' }}>
          <button className="sidebar-user" onClick={() => setUserMenu((v) => !v)}>
            <Avatar user={currentUser ?? undefined} />
            <span className="stack grow" style={{ minWidth: 0 }}>
              <span className="who truncate">{currentUser?.name}</span>
              <span className="role truncate">
                {currentUser?.roles.map((r) => roleLabels[r]).join(' · ')}
              </span>
            </span>
          </button>
          {userMenu ? (
            <div className="menu" style={{ bottom: 'calc(100% + 4px)', left: 'var(--s3)', right: 'var(--s3)' }}>
              <div className="menu-label">{currentUser?.title}</div>
              <button onClick={() => navigate('/profil')}><IconSettings size={15} /> Profilim ve Yetkilerim</button>
              <button onClick={toggleSidebar}><IconMenu size={15} /> Menüyü {sidebarCollapsed ? 'genişlet' : 'daralt'}</button>
              <div className="menu-sep" />
              <button onClick={() => { logout(); navigate('/'); }}><IconLogout size={15} /> Çıkış Yap</button>
            </div>
          ) : null}
        </div>
      </nav>

      <div className="main">
        <Topbar />
        <Outlet />
      </div>

      <CommandPalette />
      <NoticeToast />
    </div>
  );
}

function Topbar() {
  const setPaletteOpen = useUi((s) => s.setPaletteOpen);
  const toggleSidebar = useUi((s) => s.toggleSidebar);
  const location = useLocation();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  const title = useMemo(() => {
    const map: Record<string, string> = {
      '/': 'Dashboard',
      '/surecler': 'Süreç Haritası',
      '/iliskiler': 'Bağlantı Ağı',
      '/isi-haritasi': 'Risk Isı Haritası',
      '/riskler': 'Risk Kütüphanesi',
      '/kontroller': 'Kontrol Kütüphanesi',
      '/kri': 'KRI Göstergeleri',
      '/aksiyonlar': 'Aksiyon Yönetimi',
      '/dokumanlar': 'Doküman Yönetimi',
      '/gozden-gecirme': 'Periyodik Gözden Geçirme',
      '/degisiklikler': 'Değişiklik Yönetimi',
      '/asistan': 'Analiz Asistanı',
      '/arama': 'Global Arama',
      '/audit': 'Audit Trail',
      '/standartlar': 'Standart Uyumu',
      '/kullanicilar': 'Kullanıcı Yönetimi',
      '/profil': 'Profilim',
    };
    const base = `/${location.pathname.split('/')[1] ?? ''}`;
    return map[base === '/' ? '/' : base] ?? 'Nervia';
  }, [location.pathname]);

  return (
    <header className="topbar">
      <button className="btn btn-ghost btn-icon" onClick={toggleSidebar} aria-label="Menüyü daralt">
        <IconMenu size={17} />
      </button>
      <div className="crumbs">
        <span className="dim">Organizasyon</span>
        <span className="sep">/</span>
        <strong>{title}</strong>
      </div>
      <div className="spacer" />
      <button className="search-trigger" onClick={() => setPaletteOpen(true)}>
        <IconSearch size={15} />
        <span>Süreç, risk, kontrol, prosedür ara…</span>
        <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>
      </button>
    </header>
  );
}
