import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { logout as logoutRequest, useAuthStatus, useAuthStatusActions } from "@/features/auth";
import { routePaths } from "@/shared/config/route-paths";
import { Button } from "@/shared/ui/button";

export function AppHeader() {
  const navigate = useNavigate();
  const { setUnauthenticated } = useAuthStatusActions();
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRendered, setDrawerRendered] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: isAuthenticated } = useAuthStatus();

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      setDrawerVisible(false);
      setDrawerRendered(true);
      return;
    }

    setDrawerVisible(false);
    const timeoutId = window.setTimeout(() => {
      setDrawerRendered(false);
    }, 200);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen || !drawerRendered) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDrawerVisible(true);
    }, 10);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [drawerOpen, drawerRendered]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const previousFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const drawerElement = drawerRef.current;
    if (!drawerElement) {
      return;
    }

    const getFocusableElements = () =>
      Array.from(
        drawerElement.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        )
      ).filter((element) => !element.hasAttribute("disabled"));

    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0]?.focus();
    } else {
      drawerElement.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }

      if (event.key === "Tab") {
        const currentFocusableElements = getFocusableElements();
        if (currentFocusableElements.length === 0) {
          event.preventDefault();
          drawerElement.focus();
          return;
        }

        const firstElement = currentFocusableElements[0];
        const lastElement = currentFocusableElements[currentFocusableElements.length - 1];
        const activeElement = document.activeElement;

        if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }

        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocusedElement?.focus();
    };
  }, [drawerOpen]);

  const logout = async () => {
    setDrawerOpen(false);
    await logoutRequest().catch(() => undefined);
    await setUnauthenticated();
    navigate(routePaths.login, { replace: true });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-3xl items-center justify-between px-4">
        <Link to={routePaths.home} className="text-lg font-semibold tracking-wide">
          <img src="/logo.png" alt="嗜好録" className="h-8 w-auto" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setDrawerOpen(true);
          }}
          aria-label="メニューを開く"
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          aria-controls="app-navigation-drawer"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
      {drawerRendered &&
        mounted &&
        createPortal(
          <div
            className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${
              drawerVisible ? "opacity-100" : "opacity-0"
            }`}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setDrawerOpen(false);
              }
            }}
          >
            <div
              id="app-navigation-drawer"
              ref={drawerRef}
              className={`absolute inset-y-0 right-0 flex w-fit min-w-[11rem] max-w-[85vw] flex-col border-l bg-background shadow-xl transition-transform duration-200 ${
                drawerVisible ? "translate-x-0" : "translate-x-full"
              }`}
              role="dialog"
              aria-modal="true"
              aria-label="メニュー"
              tabIndex={-1}
            >
              <div className="flex h-12 items-center justify-between border-b px-4">
                <h2 className="text-sm font-semibold text-foreground">メニュー</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDrawerOpen(false);
                  }}
                  aria-label="メニューを閉じる"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
              <div className="flex flex-1 flex-col px-4 py-3">
                <nav aria-label="メニュー項目" className="flex flex-col items-stretch gap-1">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start overflow-hidden text-ellipsis"
                    onClick={() => {
                      setDrawerOpen(false);
                    }}
                  >
                    <Link to={routePaths.home}>一覧</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start overflow-hidden text-ellipsis"
                    onClick={() => {
                      setDrawerOpen(false);
                    }}
                  >
                    <Link to={routePaths.map}>地図</Link>
                  </Button>
                </nav>
                {isAuthenticated ? (
                  <div className="mt-auto border-t pt-3">
                    <Button
                      variant="ghost"
                      className="w-full justify-start overflow-hidden text-ellipsis"
                      onClick={logout}
                    >
                      ログアウト
                    </Button>
                  </div>
                ) : (
                  <div className="mt-auto border-t pt-3">
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full justify-start overflow-hidden text-ellipsis"
                      onClick={() => {
                        setDrawerOpen(false);
                      }}
                    >
                      <Link to={routePaths.login}>ログイン</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
