import type { CreateTaskRequest } from "@/shared/api/services";

export function toTaskRatePayload(input: Pick<CreateTaskRequest, "rateCode" | "quantity">) {
  return {
    rateCode: input.rateCode,
    quantity: input.quantity,
  } satisfies Pick<CreateTaskRequest, "rateCode" | "quantity">;
}
