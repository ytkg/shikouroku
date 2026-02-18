import { Navigate, Route, Routes } from "react-router-dom";
import { AppHeader } from "@/widgets/header/ui/app-header";
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
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
