import { z } from "zod";

export const generateRamadanSchema = z.object({
  ramadanYear: z.number().int().min(2000).max(2100),
  totalDays: z.number().int().min(1).max(31),
});

export const updateRamadanDraftSchema = z.object({
  id: z.uuid(),
  houseId: z.uuid(),
});

export const publishRamadanSchema = z.object({
  ramadanYear: z.number().int().min(2000).max(2100),
});
