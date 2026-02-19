import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { routePaths } from "@/shared/config/route-paths";
import { Button } from "@/shared/ui/button";

export function AppHeader() {
  const { pathname } = useLocation();
  const showCreateButton = pathname !== routePaths.login;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link to={routePaths.home} className="text-lg font-semibold tracking-wide">
          <img src="/logo.png" alt="嗜好録" className="h-8 w-auto" />
        </Link>
        {showCreateButton ? (
          <Button asChild size="icon" aria-label="新規登録">
            <Link to={routePaths.newEntity}>
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
