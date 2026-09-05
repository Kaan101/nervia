import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/useAuth';
import { useData } from '@/store/useData';
import { useUi } from '@/store/useUi';
import { portfolio } from '@/lib/selectors';
import { roleLabels } from '@/lib/labels';
import { Avatar } from '@/components/common/Primitives';
import { CommandPalette } from './CommandPalette';
import { NoticeToast } from './NoticeToast';
import {
  IconAction, IconAudit, IconBook, IconChange, IconClock, IconControl, IconDashboard,
  IconDoc, IconHeat, IconLogout, IconMenu, IconNetwork, IconProcess, IconRisk,
  IconSearch, IconSettings, IconSparkles, IconTarget, IconUsers,
} from '@/components/common/Icons';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  alert?: boolean;
}

export function AppShell() {
  const { currentUser, capabilities, logout } = useAuth();
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

  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Genel Bakış',
      items: [
        { to: '/', label: 'Dashboard', icon: <IconDashboard size={17} /> },
        { to: '/surecler', label: 'Süreç Haritası', icon: <IconProcess size={17} /> },
        { to: '/iliskiler', label: 'Bağlantı Ağı', icon: <IconNetwork size={17} /> },
      ],
    },
    {
      title: 'Risk ve Kontrol',
      items: [
        { to: '/isi-haritasi', label: 'Risk Isı Haritası', icon: <IconHeat size={17} /> },
        { to: '/riskler', label: 'Risk Kütüphanesi', icon: <IconRisk size={17} />, badge: stats.riskCount },
        { to: '/kontroller', label: 'Kontrol Kütüphanesi', icon: <IconControl size={17} />, badge: stats.controlCount },
        { to: '/kri', label: 'KRI Göstergeleri', icon: <IconTarget size={17} /> },
      ],
    },
    {
      title: 'Yönetim',
      items: [
        { to: '/aksiyonlar', label: 'Aksiyonlar', icon: <IconAction size={17} />, badge: stats.overdueActionCount, alert: stats.overdueActionCount > 0 },
        { to: '/dokumanlar', label: 'Dokümanlar', icon: <IconDoc size={17} /> },
        { to: '/gozden-gecirme', label: 'Gözden Geçirme', icon: <IconClock size={17} />, badge: stats.reviewOverdueCount, alert: stats.reviewOverdueCount > 0 },
        { to: '/degisiklikler', label: 'Değişiklik Yönetimi', icon: <IconChange size={17} />, badge: pendingApprovals },
      ],
    },
    {
      title: 'Analiz',
      items: [
        { to: '/asistan', label: 'Analiz Asistanı', icon: <IconSparkles size={17} /> },
        { to: '/arama', label: 'Global Arama', icon: <IconSearch size={17} /> },
        ...(capabilities.viewAudit ? [{ to: '/audit', label: 'Audit Trail', icon: <IconAudit size={17} /> }] : []),
        { to: '/standartlar', label: 'Standart Uyumu', icon: <IconBook size={17} /> },
        ...(capabilities.administer ? [{ to: '/kullanicilar', label: 'Kullanıcı Yönetimi', icon: <IconUsers size={17} /> }] : []),
      ],
    },
  ];

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
