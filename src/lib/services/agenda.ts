import type { SupabaseClient } from "@supabase/supabase-js";
import { createAgendaSchema, deleteAgendaSchema, updateAgendaSchema } from "@/lib/validators/agenda";

async function getAdminSnapshotName(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("full_name")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(`Failed fetching admin profile: ${error.message}`);
  return data?.full_name ?? "Ketua Pengurus perumahan";
}

export async function createAgendaPost(supabase: SupabaseClient, rawInput: unknown, userId: string) {
  const input = createAgendaSchema.parse(rawInput);
  const snapshotName = await getAdminSnapshotName(supabase, userId);

  const { data, error } = await supabase
    .from("agenda_posts")
    .insert({
      title: input.title,
      content: input.content,
      event_date: input.eventDate,
      location: input.location ?? null,
      category: input.category,
      is_published: input.isPublished,
      created_by_user_id: userId,
      created_by_name_snapshot: snapshotName,
    })
    .select("id, title, content, event_date, location, category, is_published, created_at")
    .single();

  if (error) throw new Error(`Failed creating agenda post: ${error.message}`);
  return data;
}

export async function updateAgendaPost(supabase: SupabaseClient, rawInput: unknown) {
  const input = updateAgendaSchema.parse(rawInput);

  const { data, error } = await supabase
    .from("agenda_posts")
    .update({
      title: input.title,
      content: input.content,
      event_date: input.eventDate,
      location: input.location ?? null,
      category: input.category,
      is_published: input.isPublished,
    })
    .eq("id", input.id)
    .select("id, title, content, event_date, location, category, is_published, created_at")
    .single();

  if (error) throw new Error(`Failed updating agenda post: ${error.message}`);
  return data;
}

export async function deleteAgendaPost(supabase: SupabaseClient, rawInput: unknown) {
  const input = deleteAgendaSchema.parse(rawInput);

  const { error } = await supabase.from("agenda_posts").delete().eq("id", input.id);
  if (error) throw new Error(`Failed deleting agenda post: ${error.message}`);

  return { id: input.id };
}
