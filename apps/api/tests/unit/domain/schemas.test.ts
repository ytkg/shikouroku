import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  entityBodySchema,
  loginBodySchema,
  relatedEntityBodySchema,
  validationMessage
} from "../../../src/domain/schemas";

describe("validationMessage", () => {
  it("maps known login field errors", () => {
    const parsed = loginBodySchema.safeParse({ password: "secret" });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    expect(validationMessage(parsed.error)).toBe("username is required");
  });

  it("maps known entity field errors", () => {
    const parsed = entityBodySchema.safeParse({
      kindId: 1,
      name: "Entity",
      description: "",
      isWishlist: false,
      tagIds: ["bad"]
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    expect(validationMessage(parsed.error)).toBe("tagIds is invalid");
  });

  it("returns default message for unknown field errors", () => {
    const schema = z.object({
      nested: z.object({
        name: z.string().min(1)
      })
    });

    const parsed = schema.safeParse({
      nested: {}
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    expect(validationMessage(parsed.error)).toBe("invalid request body");
  });

  it("maps known related entity field errors", () => {
    const parsed = relatedEntityBodySchema.safeParse({});
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    expect(validationMessage(parsed.error)).toBe("relatedEntityId is required");
  });
});
