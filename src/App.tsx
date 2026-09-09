import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RequireMenu } from '@/components/layout/RequireMenu';
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
import { AccessAdminPage } from '@/pages/AccessAdmin';
import { CanvasPage } from '@/pages/Canvas';
import { FlowPage } from '@/pages/FlowEditor';

export function App() {
  const currentUser = useAuth((s) => s.currentUser);

  if (!currentUser) return <Login />;

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<RequireMenu menu="dashboard"><Dashboard /></RequireMenu>} />
          <Route path="kanvas" element={<RequireMenu menu="kanvas"><CanvasPage /></RequireMenu>} />
          <Route path="kanvas/:nodeId" element={<RequireMenu menu="kanvas"><CanvasPage /></RequireMenu>} />
          <Route path="is-akisi" element={<RequireMenu menu="is-akisi"><FlowPage /></RequireMenu>} />
          <Route path="surecler" element={<RequireMenu menu="surecler"><ProcessesPage /></RequireMenu>} />
          <Route path="surecler/:nodeId" element={<RequireMenu menu="surecler"><ProcessesPage /></RequireMenu>} />
          <Route path="iliskiler" element={<RequireMenu menu="iliskiler"><NetworkPage /></RequireMenu>} />
          <Route path="isi-haritasi" element={<RequireMenu menu="isi-haritasi"><RiskHeatmapPage /></RequireMenu>} />
          <Route path="riskler" element={<RequireMenu menu="riskler"><RiskLibrary /></RequireMenu>} />
          <Route path="riskler/:riskId" element={<RequireMenu menu="riskler"><RiskLibrary /></RequireMenu>} />
          <Route path="kontroller" element={<RequireMenu menu="kontroller"><ControlLibrary /></RequireMenu>} />
          <Route path="kontroller/:controlId" element={<RequireMenu menu="kontroller"><ControlLibrary /></RequireMenu>} />
          <Route path="kri" element={<RequireMenu menu="kri"><KriPage /></RequireMenu>} />
          <Route path="aksiyonlar" element={<RequireMenu menu="aksiyonlar"><ActionsPage /></RequireMenu>} />
          <Route path="aksiyonlar/:actionId" element={<RequireMenu menu="aksiyonlar"><ActionsPage /></RequireMenu>} />
          <Route path="dokumanlar" element={<RequireMenu menu="dokumanlar"><DocumentsPage /></RequireMenu>} />
          <Route path="dokumanlar/:documentId" element={<RequireMenu menu="dokumanlar"><DocumentsPage /></RequireMenu>} />
          <Route path="gozden-gecirme" element={<RequireMenu menu="gozden-gecirme"><ReviewsPage /></RequireMenu>} />
          <Route path="degisiklikler" element={<RequireMenu menu="degisiklikler"><ChangeManagementPage /></RequireMenu>} />
          <Route path="asistan" element={<RequireMenu menu="asistan"><AssistantPage /></RequireMenu>} />
          <Route path="arama" element={<RequireMenu menu="arama"><SearchPage /></RequireMenu>} />
          <Route path="standartlar" element={<RequireMenu menu="standartlar"><StandardsPage /></RequireMenu>} />
          <Route path="profil" element={<ProfilePage />} />
          <Route path="audit" element={<RequireMenu menu="audit"><AuditTrailPage /></RequireMenu>} />
          <Route path="kullanicilar" element={<RequireMenu menu="kullanicilar"><UsersPage /></RequireMenu>} />
          <Route path="yetkiler" element={<RequireMenu menu="yetkiler"><AccessAdminPage /></RequireMenu>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
