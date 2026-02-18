import { Navigate, Route, Routes } from "react-router-dom";
import { AppHeader } from "@/widgets/header/ui/app-header";
import EntityDetailPage from "@/pages/entity-detail-page";
import EntityEditPage from "@/pages/entity-edit-page";
import HomePage from "@/pages/home-page";
import LoginPage from "@/pages/login-page";
import NewEntityPage from "@/pages/new-entity-page";

export default function App() {
  return (
    <>
      <AppHeader />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/entities/new" element={<NewEntityPage />} />
        <Route path="/entities/:entityId" element={<EntityDetailPage />} />
        <Route path="/entities/:entityId/edit" element={<EntityEditPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
