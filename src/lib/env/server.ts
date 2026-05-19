import { z } from "zod";
import { publicEnv } from "@/lib/env/public";

// Kita biarkan kosong jika memang tidak ada variabel rahasia tambahan di server saat ini
const serverEnvSchema = z.object({});

const serverOnlyEnv = serverEnvSchema.parse({});

export const serverEnv = {
  ...publicEnv,
  ...serverOnlyEnv,
};
