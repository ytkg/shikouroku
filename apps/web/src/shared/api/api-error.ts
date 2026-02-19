import { httpStatus } from "@/shared/config/http-status";

type ErrorPayload = {
  message?: unknown;
  error?: unknown;
};

type NestedErrorPayload = {
  message?: unknown;
  code?: unknown;
};

function parseErrorDetails(payload: unknown): { message?: string; code?: string } {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const data = payload as ErrorPayload;
  if (typeof data.message === "string" && data.message.length > 0) {
    return { message: data.message };
  }

  if (typeof data.error === "string" && data.error.length > 0) {
    return { message: data.error };
  }

  if (!data.error || typeof data.error !== "object") {
    return {};
  }

  const nestedError = data.error as NestedErrorPayload;
  return {
    message:
      typeof nestedError.message === "string" && nestedError.message.length > 0
        ? nestedError.message
        : undefined,
    code:
      typeof nestedError.code === "string" && nestedError.code.length > 0
        ? nestedError.code
        : undefined
  };
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const INVALID_API_RESPONSE_CODE = "INVALID_API_RESPONSE";

export function createInvalidApiResponseError(message: string): ApiError {
  return new ApiError(httpStatus.badGateway, message, INVALID_API_RESPONSE_CODE);
}

export async function toApiError(response: Response): Promise<ApiError> {
  const fallbackMessage = `HTTP ${response.status}`;
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return new ApiError(response.status, fallbackMessage);
  }

  try {
    const payload = await response.json();
    const { message, code } = parseErrorDetails(payload);
    return new ApiError(response.status, message ?? fallbackMessage, code);
  } catch {
    return new ApiError(response.status, fallbackMessage);
  }
}
