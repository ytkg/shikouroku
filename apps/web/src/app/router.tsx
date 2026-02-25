import { useEffect } from "react";
import { Navigate, Route, Routes, matchPath, useLocation } from "react-router-dom";
import {
  EntityDetailPage,
  EntityEditPage,
  HomePage,
  LoginPage,
  MapPage,
  NewEntityPage
} from "@/pages";
import { routePaths } from "@/shared/config/route-paths";
import { useSeo } from "@/shared/lib/seo";
import { ToastViewport } from "@/shared/ui/toast-viewport";
import { AppFooter, AppHeader, CreateEntityFab } from "@/widgets";

export function AppRouter() {
  const location = useLocation();
  const isMapPage = location.pathname === routePaths.map;
  const isNewEntityPage = location.pathname === routePaths.newEntity;
  const isLoginPage = location.pathname === routePaths.login;
  const isEntityEditPage = Boolean(matchPath(routePaths.entityEditPattern, location.pathname));
  const isEntityDetailPage =
    !isNewEntityPage &&
    !isEntityEditPage &&
    Boolean(matchPath(routePaths.entityDetailPattern, location.pathname));

  useSeo(
    isEntityDetailPage
      ? null
      : isNewEntityPage
        ? {
            title: "嗜好の新規登録",
            description: "新しい嗜好を登録し、タグや画像、位置情報を追加できます。",
            path: routePaths.newEntity,
            noIndex: true
          }
      : isLoginPage
        ? {
            title: "ログイン",
            description: "嗜好を登録・編集するためのログインページです。",
            path: routePaths.login,
            noIndex: true
          }
        : isEntityEditPage
        ? {
            title: "嗜好の編集",
            description: "嗜好の名称、説明、タグ、画像、位置情報を編集します。",
            path: location.pathname,
            noIndex: true
          }
        : location.pathname === routePaths.map
          ? {
              title: "嗜好マップ",
              description: "位置情報付きの嗜好を地図で検索・確認できます。",
              path: routePaths.map
            }
          : {
              title: "嗜好一覧",
              description: "嗜好を一覧表示し、タグや条件を使って素早く検索できます。",
              path: routePaths.home
            }
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return (
    <div className={`flex flex-col bg-background ${isMapPage ? "h-[100dvh] overflow-hidden" : "min-h-screen"}`}>
      <AppHeader />
      <div className={`flex-1 ${isMapPage ? "overflow-hidden" : "pb-12"}`}>
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
