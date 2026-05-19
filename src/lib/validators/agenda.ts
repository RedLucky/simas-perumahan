import { z } from "zod";

export const agendaCategoryValues = [
  "PENGUMUMAN",
  "RAPAT",
  "KEGIATAN",
  "KEAMANAN",
  "LAINNYA",
] as const;

export const createAgendaSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(5000),
  eventDate: z.iso.date(),
  location: z.string().trim().max(200).optional(),
  category: z.enum(agendaCategoryValues),
  isPublished: z.boolean().default(true),
});

export const updateAgendaSchema = createAgendaSchema.extend({
  id: z.uuid(),
});

export const deleteAgendaSchema = z.object({
  id: z.uuid(),
});
