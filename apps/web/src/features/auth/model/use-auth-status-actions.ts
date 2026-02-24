import { useCallback } from "react";
import { useSWRConfig } from "swr";
import { AUTH_STATUS_KEY, persistAuthStatus } from "./auth-status-store";

export function useAuthStatusActions() {
  const { mutate } = useSWRConfig();

  const setAuthStatus = useCallback(
    async (isAuthenticated: boolean) => {
      persistAuthStatus(isAuthenticated);
      await mutate(AUTH_STATUS_KEY, isAuthenticated, { revalidate: false });
    },
    [mutate]
  );

  const setAuthenticated = useCallback(async () => {
    await setAuthStatus(true);
  }, [setAuthStatus]);

  const setUnauthenticated = useCallback(async () => {
    await setAuthStatus(false);
  }, [setAuthStatus]);

  return {
    setAuthenticated,
    setUnauthenticated
  };
}
