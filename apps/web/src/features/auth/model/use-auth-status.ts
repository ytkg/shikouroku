import useSWR from "swr";
import { checkAuthenticated } from "@/entities/auth";
import { AUTH_STATUS_KEY, persistAuthStatus, readAuthStatus } from "./auth-status-store";

async function fetchAuthStatus(): Promise<boolean> {
  const fallback = readAuthStatus();
  try {
    const authenticated = await checkAuthenticated();
    persistAuthStatus(authenticated);
    return authenticated;
  } catch {
    return fallback;
  }
}

export function useAuthStatus() {
  return useSWR(AUTH_STATUS_KEY, fetchAuthStatus, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
}
