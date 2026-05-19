import { z } from "zod";

export const expenseCategoryValues = [
  "GAJI_SATPAM_FULLTIME",
  "GAJI_SATPAM_MINGGU",
  "GAJI_TUKANG_SAMPAH",
  "THR_SATPAM",
  "THR_TUKANG_SAMPAH",
  "UANG_KEMATIAN",
  "IURAN_17_AGUSTUS",
  "IURAN_HALAL_BIHALAL",
  "LAIN_LAIN",
] as const;

export const createExpenseSchema = z.object({
  category: z.enum(expenseCategoryValues),
  amount: z.number().positive(),
  expenseDate: z.iso.date(),
  note: z.string().trim().max(500).optional(),
});

export const updateExpenseSchema = createExpenseSchema.extend({
  id: z.uuid(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
