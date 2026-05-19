import { z } from "zod";

export const incidentalEventTypeValues = ["AGUSTUS_17", "HALAL_BIHALAL"] as const;

export const createIncidentalEventSchema = z.object({
  eventYear: z.number().int().min(2000).max(2100),
  eventType: z.enum(incidentalEventTypeValues),
  amount: z.number().nonnegative(),
  isActive: z.boolean(),
  note: z.string().trim().max(500).optional(),
});

export const createIncidentalPaymentSchema = z.object({
  eventId: z.uuid(),
  houseId: z.uuid(),
  paidAmount: z.number().nonnegative(),
  paidAt: z.iso.date(),
  note: z.string().trim().max(500).optional(),
});

export const updateIncidentalPaymentSchema = createIncidentalPaymentSchema.extend({
  id: z.uuid(),
});
