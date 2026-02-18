import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useAuthGuard() {
  const navigate = useNavigate();

  return useCallback(
    (status: number) => {
      if (status === 401) {
        navigate("/login", { replace: true });
        return false;
      }
      return true;
    },
    [navigate]
  );
}
