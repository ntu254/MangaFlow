import { z } from "zod";

const isoDate = z.string().datetime({ offset: true });

export const createRateTableSchema = z
  .object({
    code: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/),
    label: z.string().min(1).max(160),
    workUnitType: z.string().min(1).max(80),
    amount: z.number().positive(),
    currency: z.string().regex(/^[A-Za-z]{3}$/).optional(),
    effectiveFrom: isoDate.optional(),
    effectiveTo: isoDate.nullable().optional(),
  })
  .strict();

export const patchRateTableSchema = z
  .object({
    label: z.string().min(1).max(160).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    effectiveTo: isoDate.nullable().optional(),
  })
  .strict();
