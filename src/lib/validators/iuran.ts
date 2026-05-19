import { z } from "zod";

export const createIuranPaymentSchema = z.object({
  houseId: z.uuid(),
  monthKey: z.iso.date(),
  paidAmount: z.number().nonnegative(),
  paidAt: z.iso.date(),
  note: z.string().trim().max(500).optional(),
});

export const updateIuranPaymentSchema = createIuranPaymentSchema.extend({
  id: z.uuid(),
});

export type CreateIuranPaymentInput = z.infer<typeof createIuranPaymentSchema>;
