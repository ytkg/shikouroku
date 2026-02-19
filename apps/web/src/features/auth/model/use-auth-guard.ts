import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { routePaths } from "@/shared/config/route-paths";

export function useAuthGuard() {
  const navigate = useNavigate();

  return useCallback(
    (status: number) => {
      if (status === 401) {
        navigate(routePaths.login, { replace: true });
        return false;
      }
      return true;
    },
    [navigate]
  );
}
