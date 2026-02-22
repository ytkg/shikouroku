import { toApiError } from "@/shared/api/api-error";

type JsonRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown;
};

type FormDataRequestInit = Omit<RequestInit, "body"> & {
  body: FormData;
};

async function parseSuccessResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function requestJson<T>(input: string, init: JsonRequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  let body: BodyInit | undefined;

  if (init.body !== undefined) {
    body = JSON.stringify(init.body);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
  }

  const response = await fetch(input, {
    ...init,
    headers,
    body
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return parseSuccessResponse<T>(response);
}

export async function requestFormData<T>(input: string, init: FormDataRequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    body: init.body
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return parseSuccessResponse<T>(response);
}
