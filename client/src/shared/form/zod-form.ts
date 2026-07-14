import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldError, FieldErrors } from "react-hook-form";
import type { z } from "zod";

export function createZodResolver<TSchema extends z.ZodTypeAny>(schema: TSchema) {
  return zodResolver(schema);
}

export function getFieldErrorMessage(error: FieldError | undefined) {
  return typeof error?.message === "string" ? error.message : undefined;
}

export function getFormErrorMessages(errors: FieldErrors) {
  return Object.values(errors)
    .map((error) => getFieldErrorMessage(error as FieldError))
    .filter((message): message is string => Boolean(message));
}
