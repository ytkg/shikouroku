import { z } from "zod";

export const loginBodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const tagBodySchema = z.object({
  name: z.string().trim().min(1)
});

export const entityBodySchema = z.object({
  kindId: z.number().int().positive(),
  name: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
  isWishlist: z.boolean().optional().default(false),
  tagIds: z.array(z.number().int().positive()).optional().default([]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
}).superRefine((value, ctx) => {
  const hasLatitude = value.latitude !== undefined;
  const hasLongitude = value.longitude !== undefined;
  if (hasLatitude === hasLongitude) {
    return;
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: [hasLatitude ? "longitude" : "latitude"],
    message: "latitude and longitude must be provided together"
  });
});

export const relatedEntityBodySchema = z.object({
  relatedEntityId: z.string().trim().min(1)
});

export const entityImageOrderBodySchema = z.object({
  orderedImageIds: z.array(z.string().trim().min(1))
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type TagBody = z.infer<typeof tagBodySchema>;
export type EntityBody = z.infer<typeof entityBodySchema>;
export type RelatedEntityBody = z.infer<typeof relatedEntityBodySchema>;
export type EntityImageOrderBody = z.infer<typeof entityImageOrderBodySchema>;

const VALIDATION_MESSAGE_MAP: Record<string, string> = {
  kindId: "kindId is required",
  name: "name is required",
  tagIds: "tagIds is invalid",
  latitude: "latitude is invalid",
  longitude: "longitude is invalid",
  relatedEntityId: "relatedEntityId is required",
  orderedImageIds: "orderedImageIds is invalid",
  username: "username is required",
  password: "password is required"
};

export function validationMessage(error: z.ZodError): string {
  const field = error.issues[0]?.path[0];
  if (typeof field === "string") {
    const message = VALIDATION_MESSAGE_MAP[field];
    if (message) {
      return message;
    }
  }

  return "invalid request body";
}
