type Details = Record<string, unknown>;

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiFailure = {
  success: false;
  message: string;
  code: string;
  details: Details;
};

export function ok<T>(data: T, message = "OK"): ApiSuccess<T> {
  return {
    success: true,
    message,
    data
  };
}

export function fail(
  message: string,
  code = "INTERNAL_ERROR",
  details: Details = {}
): ApiFailure {
  return {
    success: false,
    message,
    code,
    details
  };
}
