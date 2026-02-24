import { Plus } from "lucide-react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { routePaths } from "@/shared/config/route-paths";
import { Button } from "@/shared/ui/button";

export function CreateEntityFab() {
  const { pathname } = useLocation();
  const isEditPage = Boolean(matchPath(routePaths.entityEditPattern, pathname));
  if (pathname === routePaths.login || pathname === routePaths.newEntity || isEditPage) {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+4rem)] right-4 z-50 sm:right-[max(1rem,calc((100vw-48rem)/2+1rem))]">
      <Button asChild size="icon" aria-label="嗜好を追加" className="h-12 w-12 rounded-full shadow-lg">
        <Link to={routePaths.newEntity}>
          <Plus className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
