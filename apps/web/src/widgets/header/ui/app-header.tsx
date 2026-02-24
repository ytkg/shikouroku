import { Link } from "react-router-dom";
import { routePaths } from "@/shared/config/route-paths";

export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-3xl items-center px-4">
        <Link to={routePaths.home} className="text-lg font-semibold tracking-wide">
          <img src="/logo.png" alt="嗜好録" className="h-8 w-auto" />
        </Link>
      </div>
    </header>
  );
}
