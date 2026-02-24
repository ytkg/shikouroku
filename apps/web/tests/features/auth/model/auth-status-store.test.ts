import { afterEach, describe, expect, it, vi } from "vitest";
import { persistAuthStatus, readAuthStatus } from "@/features/auth/model/auth-status-store";

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");

function mockWindowWithStorage(storage: Storage) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage }
  });
}

afterEach(() => {
  if (originalWindowDescriptor) {
    Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    return;
  }
  Reflect.deleteProperty(globalThis, "window");
});

describe("auth-status-store", () => {
  it("localStorage が使えるときは認証状態を保存/取得できる", () => {
    const getItem = vi.fn().mockReturnValue("true");
    const setItem = vi.fn();
    mockWindowWithStorage({ getItem, setItem } as unknown as Storage);

    persistAuthStatus(true);

    expect(setItem).toHaveBeenCalledWith("shikouroku.authenticated", "true");
    expect(readAuthStatus()).toBe(true);
  });

  it("localStorage アクセスで例外が発生しても例外を投げない", () => {
    const localStorageError = new Error("security error");
    const getItem = vi.fn(() => {
      throw localStorageError;
    });
    const setItem = vi.fn(() => {
      throw localStorageError;
    });
    mockWindowWithStorage({ getItem, setItem } as unknown as Storage);

    expect(() => persistAuthStatus(true)).not.toThrow();
    expect(readAuthStatus()).toBe(false);
  });
});
