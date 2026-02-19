import { expectObject, expectTrue } from "@/shared/api/response-validators";

export function parseAuthResponse(value: unknown): void {
  const root = expectObject(value, "authResponse");
  expectTrue(root.ok, "authResponse.ok");
}
