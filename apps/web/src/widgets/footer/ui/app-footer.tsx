import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";

export function AppFooter() {
  const navigate = useNavigate();
  const location = useLocation();
  const showLogout = location.pathname !== "/login";

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    navigate("/login", { replace: true });
  };

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto grid h-12 w-full max-w-3xl grid-cols-[1fr_auto_1fr] items-center px-4">
        <div />
        <div className="text-center text-xs text-muted-foreground whitespace-nowrap">
          © 嗜好録
        </div>
        {showLogout && (
          <div className="justify-self-end">
            <Button variant="secondary" size="sm" onClick={logout}>
              ログアウト
            </Button>
          </div>
        )}
      </div>
    </footer>
  );
}
