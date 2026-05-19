import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createIncidentalEventSchema,
  createIncidentalPaymentSchema,
  updateIncidentalPaymentSchema,
} from "@/lib/validators/incidental";

async function getAdminSnapshotName(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("full_name")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(`Failed fetching admin profile: ${error.message}`);
  return data?.full_name ?? "Ketua RT";
}

export async function upsertIncidentalEvent(supabase: SupabaseClient, rawInput: unknown, userId: string) {
  const input = createIncidentalEventSchema.parse(rawInput);
  const snapshotName = await getAdminSnapshotName(supabase, userId);

  const { data, error } = await supabase
    .from("incidental_events")
    .upsert(
      {
        event_year: input.eventYear,
        event_type: input.eventType,
        amount: input.amount,
        is_active: input.isActive,
        note: input.note ?? null,
        created_by_user_id: userId,
        created_by_name_snapshot: snapshotName,
      },
      { onConflict: "event_year,event_type" },
    )
    .select("id, event_year, event_type, amount, is_active, note, updated_at")
    .single();

  if (error) throw new Error(`Failed upserting incidental event: ${error.message}`);
  return data;
}

export async function createIncidentalPayment(supabase: SupabaseClient, rawInput: unknown, userId: string) {
  const input = createIncidentalPaymentSchema.parse(rawInput);
  const snapshotName = await getAdminSnapshotName(supabase, userId);

  const { data, error } = await supabase
    .from("incidental_payments")
    .insert({
      event_id: input.eventId,
      house_id: input.houseId,
      paid_amount: input.paidAmount,
      paid_at: input.paidAt,
      note: input.note ?? null,
      created_by_user_id: userId,
      created_by_name_snapshot: snapshotName,
    })
    .select("id, event_id, house_id, paid_amount, paid_at, note, created_at")
    .single();

  if (error) throw new Error(`Failed creating incidental payment: ${error.message}`);
  return data;
}

export async function updateIncidentalPayment(
  supabase: SupabaseClient,
  rawInput: unknown,
) {
  const input = updateIncidentalPaymentSchema.parse(rawInput);

  const { data, error } = await supabase
    .from("incidental_payments")
    .update({
      event_id: input.eventId,
      house_id: input.houseId,
      paid_amount: input.paidAmount,
      paid_at: input.paidAt,
      note: input.note ?? null,
    })
    .eq("id", input.id)
    .select("id, event_id, house_id, paid_amount, paid_at, note, created_at")
    .single();

  if (error) throw new Error(`Failed updating incidental payment: ${error.message}`);
  return data;
}
