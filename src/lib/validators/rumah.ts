import { z } from "zod";

export const updateHouseSchema = z.object({
  id: z.string().uuid("ID Rumah tidak valid"),
  contactName: z
    .string()
    .max(100, "Nama kontak maksimal 100 karakter")
    .transform((val) => val.trim() || null)
    .nullable()
    .optional(),
  contactPhone: z
    .string()
    .max(20, "Nomor telepon maksimal 20 karakter")
    .regex(/^[0-9+\-\s()]*$/, "Format nomor telepon tidak valid")
    .transform((val) => val.trim() || null)
    .nullable()
    .optional(),
});

export type UpdateHouseInput = z.infer<typeof updateHouseSchema>;
