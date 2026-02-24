export const AUTH_STATUS_KEY = "auth-status";
const AUTH_STATUS_STORAGE_KEY = "shikouroku.authenticated";

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readAuthStatus(): boolean {
  const storage = getStorage();
  if (!storage) {
    return false;
  }

  try {
    return storage.getItem(AUTH_STATUS_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function persistAuthStatus(isAuthenticated: boolean): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(AUTH_STATUS_STORAGE_KEY, isAuthenticated ? "true" : "false");
  } catch {
    // Ignore storage write failures to keep auth flow functional.
  }
}
