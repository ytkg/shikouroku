import { Plus } from "lucide-react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { useAuthStatus } from "@/features/auth";
import { routePaths } from "@/shared/config/route-paths";
import { Button } from "@/shared/ui/button";

export function CreateEntityFab() {
  const { pathname } = useLocation();
  const { data: isAuthenticated } = useAuthStatus();
  const isEditPage = Boolean(matchPath(routePaths.entityEditPattern, pathname));
  if (
    isAuthenticated !== true ||
    pathname === routePaths.login ||
    pathname === routePaths.newEntity ||
    isEditPage
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+3rem)] right-4 z-[1100] sm:right-[max(1rem,calc((100vw-48rem)/2+1rem))]">
      <Button asChild size="icon" aria-label="嗜好を追加" className="h-12 w-12 rounded-full shadow-lg">
        <Link to={routePaths.newEntity}>
          <Plus className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
