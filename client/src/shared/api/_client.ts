import type { AxiosResponse } from "axios";
import { api } from "@/shared/lib/api";

export { api };

export class ApiError extends Error {
  status: number;
  payload: any;
  constructor(message: string, status: number, payload: any) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Unwrap the `{ success, message, data }` envelope and throw ApiError on `success:false`.
 * For axios calls, we still rely on axios throwing on non-2xx — but some endpoints may
 * return 200 with success:false; this catches that.
 */
export function unwrap<T>(res: AxiosResponse<Envelope<T>>): T {
  const body = res.data;
  if (body && typeof body === "object" && "success" in body) {
    if (!body.success) {
      throw new ApiError(body.message ?? "Request failed", res.status, body);
    }
    return body.data as T;
  }
  return res.data as unknown as T;
}

export function extractErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (typeof err === "object" && err && "response" in err) {
    const resp = (err as any).response;
    return resp?.data?.message ?? (err as any).message ?? "Request failed";
  }
  if (err instanceof Error) return err.message;
  return "Request failed";
}
