import { errorMessages } from "@/shared/config/error-messages";

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : errorMessages.unknown;
}
