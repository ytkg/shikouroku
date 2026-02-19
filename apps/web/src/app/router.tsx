import { Navigate, Route, Routes } from "react-router-dom";
import { AppFooter } from "@/widgets/footer/ui/app-footer";
import { AppHeader } from "@/widgets/header/ui/app-header";
import EntityDetailPage from "@/pages/entity-detail-page";
import EntityEditPage from "@/pages/entity-edit-page";
import HomePage from "@/pages/home-page";
import LoginPage from "@/pages/login-page";
import NewEntityPage from "@/pages/new-entity-page";
import { routePaths } from "@/shared/config/route-paths";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <div className="flex-1">
        <Routes>
          <Route path={routePaths.login} element={<LoginPage />} />
          <Route path={routePaths.newEntity} element={<NewEntityPage />} />
          <Route path={routePaths.entityDetailPattern} element={<EntityDetailPage />} />
          <Route path={routePaths.entityEditPattern} element={<EntityEditPage />} />
          <Route path={routePaths.home} element={<HomePage />} />
          <Route path="*" element={<Navigate to={routePaths.home} replace />} />
        </Routes>
      </div>
      <AppFooter />
    </div>
  );
}
