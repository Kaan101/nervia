import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/store/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { ProcessesPage } from '@/pages/Processes';
import { RiskHeatmapPage } from '@/pages/RiskHeatmap';
import { ControlLibrary, RiskLibrary } from '@/pages/Libraries';
import { ActionsPage } from '@/pages/Actions';
import { DocumentsPage } from '@/pages/Documents';
import { ReviewsPage } from '@/pages/Reviews';
import { ChangeManagementPage } from '@/pages/ChangeManagement';
import { AuditTrailPage } from '@/pages/AuditTrail';
import { KriPage } from '@/pages/Kri';
import { AssistantPage } from '@/pages/Assistant';
import { SearchPage } from '@/pages/Search';
import { NetworkPage } from '@/pages/Network';
import { StandardsPage } from '@/pages/Standards';
import { ProfilePage, UsersPage } from '@/pages/People';

export function App() {
  const currentUser = useAuth((s) => s.currentUser);
  const capabilities = useAuth((s) => s.capabilities);

  if (!currentUser) return <Login />;

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="surecler" element={<ProcessesPage />} />
          <Route path="surecler/:nodeId" element={<ProcessesPage />} />
          <Route path="iliskiler" element={<NetworkPage />} />
          <Route path="isi-haritasi" element={<RiskHeatmapPage />} />
          <Route path="riskler" element={<RiskLibrary />} />
          <Route path="riskler/:riskId" element={<RiskLibrary />} />
          <Route path="kontroller" element={<ControlLibrary />} />
          <Route path="kontroller/:controlId" element={<ControlLibrary />} />
          <Route path="kri" element={<KriPage />} />
          <Route path="aksiyonlar" element={<ActionsPage />} />
          <Route path="aksiyonlar/:actionId" element={<ActionsPage />} />
          <Route path="dokumanlar" element={<DocumentsPage />} />
          <Route path="dokumanlar/:documentId" element={<DocumentsPage />} />
          <Route path="gozden-gecirme" element={<ReviewsPage />} />
          <Route path="degisiklikler" element={<ChangeManagementPage />} />
          <Route path="asistan" element={<AssistantPage />} />
          <Route path="arama" element={<SearchPage />} />
          <Route path="standartlar" element={<StandardsPage />} />
          <Route path="profil" element={<ProfilePage />} />
          <Route
            path="audit"
            element={capabilities.viewAudit ? <AuditTrailPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="kullanicilar"
            element={capabilities.administer ? <UsersPage /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
