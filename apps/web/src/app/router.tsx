import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  EntityDetailPage,
  EntityEditPage,
  HomePage,
  LoginPage,
  NewEntityPage
} from "@/pages";
import { routePaths } from "@/shared/config/route-paths";
import { ToastViewport } from "@/shared/ui/toast-viewport";
import { AppFooter, AppHeader, CreateEntityFab } from "@/widgets";

export function AppRouter() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <div className="flex-1 pb-8">
        <Routes>
          <Route path={routePaths.login} element={<LoginPage />} />
          <Route path={routePaths.newEntity} element={<NewEntityPage />} />
          <Route path={routePaths.entityDetailPattern} element={<EntityDetailPage />} />
          <Route path={routePaths.entityEditPattern} element={<EntityEditPage />} />
          <Route path={routePaths.home} element={<HomePage />} />
          <Route path={routePaths.notFound} element={<Navigate to={routePaths.home} replace />} />
        </Routes>
      </div>
      <CreateEntityFab />
      <ToastViewport />
      <AppFooter />
    </div>
  );
}
