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
  tagIds: z.array(z.number().int().positive()).optional().default([])
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

export function validationMessage(error: z.ZodError): string {
  const field = error.issues[0]?.path[0];
  if (field === "kindId") return "kindId is required";
  if (field === "name") return "name is required";
  if (field === "tagIds") return "tagIds is invalid";
  if (field === "relatedEntityId") return "relatedEntityId is required";
  if (field === "orderedImageIds") return "orderedImageIds is invalid";
  if (field === "username") return "username is required";
  if (field === "password") return "password is required";
  return "invalid request body";
}
