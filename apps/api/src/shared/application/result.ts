export type UseCaseSuccess<T> = {
  ok: true;
  data: T;
};

export type UseCaseFailure = {
  ok: false;
  status: number;
  message: string;
};

export type UseCaseResult<T> = UseCaseSuccess<T> | UseCaseFailure;

export function success<T>(data: T): UseCaseSuccess<T> {
  return { ok: true, data };
}

export function fail(status: number, message: string): UseCaseFailure {
  return { ok: false, status, message };
}
