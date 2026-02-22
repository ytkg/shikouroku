import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const AUTH_ROUTES_PATH = path.resolve(__dirname, "../../src/routes/api/auth-routes.ts");
const AUTH_MIDDLEWARE_PATH = path.resolve(__dirname, "../../src/middleware/auth-session-middleware.ts");

describe("auth migration boundary", () => {
  it("auth routes depend on auth module application", () => {
    const source = fs.readFileSync(AUTH_ROUTES_PATH, "utf8");

    expect(source.includes("modules/auth/application")).toBe(true);
    expect(source.includes("usecases/auth-usecase")).toBe(false);
  });

  it("auth middleware depends on auth module application", () => {
    const source = fs.readFileSync(AUTH_MIDDLEWARE_PATH, "utf8");

    expect(source.includes("modules/auth/application")).toBe(true);
    expect(source.includes("usecases/auth-usecase")).toBe(false);
  });
});
