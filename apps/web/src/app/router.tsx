import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  EntityDetailPage,
  EntityEditPage,
  HomePage,
  LoginPage,
  MapPage,
  NewEntityPage
} from "@/pages";
import { routePaths } from "@/shared/config/route-paths";
import { ToastViewport } from "@/shared/ui/toast-viewport";
import { AppFooter, AppHeader, CreateEntityFab } from "@/widgets";

export function AppRouter() {
  const location = useLocation();
  const isMapPage = location.pathname === routePaths.map;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <div className="flex-1 pb-12">
        <Routes>
          <Route path={routePaths.login} element={<LoginPage />} />
          <Route path={routePaths.map} element={<MapPage />} />
          <Route path={routePaths.newEntity} element={<NewEntityPage />} />
          <Route path={routePaths.entityDetailPattern} element={<EntityDetailPage />} />
          <Route path={routePaths.entityEditPattern} element={<EntityEditPage />} />
          <Route path={routePaths.home} element={<HomePage />} />
          <Route path={routePaths.notFound} element={<Navigate to={routePaths.home} replace />} />
        </Routes>
        {!isMapPage && (
          <div className="mx-auto flex w-full max-w-3xl justify-center px-4">
            <img className="h-auto w-1/3" src="/footer-banner.png" alt="フッター画像" />
          </div>
        )}
      </div>
      <CreateEntityFab />
      <ToastViewport />
      <AppFooter />
    </div>
  );
}
