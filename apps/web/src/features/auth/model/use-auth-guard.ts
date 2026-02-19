import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { httpStatus } from "@/shared/config/http-status";
import { routePaths } from "@/shared/config/route-paths";

export function useAuthGuard() {
  const navigate = useNavigate();

  return useCallback(
    (status: number) => {
      if (status === httpStatus.unauthorized) {
        navigate(routePaths.login, { replace: true });
        return false;
      }
      return true;
    },
    [navigate]
  );
}
