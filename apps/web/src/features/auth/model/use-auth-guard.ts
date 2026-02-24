import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { httpStatus } from "@/shared/config/http-status";
import { getLoginPath } from "@/shared/config/route-paths";
import { buildReturnTo } from "./auth-navigation";
import { useAuthStatusActions } from "./use-auth-status-actions";

export function useAuthGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUnauthenticated } = useAuthStatusActions();

  return useCallback(
    (status: number) => {
      if (status === httpStatus.unauthorized) {
        void setUnauthenticated();
        const returnTo = buildReturnTo(location.pathname, location.search);
        navigate(getLoginPath(returnTo), { replace: true });
        return false;
      }
      return true;
    },
    [location.pathname, location.search, navigate, setUnauthenticated]
  );
}
