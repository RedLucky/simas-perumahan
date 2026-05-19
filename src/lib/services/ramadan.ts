import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateRamadanSchema,
  publishRamadanSchema,
  updateRamadanDraftSchema,
} from "@/lib/validators/ramadan";

const ASSIGNMENT_TYPES = ["TAKJIL_MUSHOLA", "SAHUR_SATPAM", "BUKA_SATPAM"] as const;

type AssignmentType = (typeof ASSIGNMENT_TYPES)[number];

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

function assignmentHouseIndex(dayNumber: number, assignmentType: AssignmentType, houseCount: number) {
  const offset = assignmentType === "TAKJIL_MUSHOLA" ? 0 : assignmentType === "SAHUR_SATPAM" ? 11 : 22;
  return (dayNumber - 1 + offset) % houseCount;
}

export async function generateRamadanDraft(supabase: SupabaseClient, rawInput: unknown, userId: string) {
  const input = generateRamadanSchema.parse(rawInput);
  const snapshotName = await getAdminSnapshotName(supabase, userId);

  const { data: houses, error: housesError } = await supabase
    .from("houses")
    .select("id, code")
    .eq("is_active", true)
    .order("order_number", { ascending: true });

  if (housesError) throw new Error(`Failed fetching houses: ${housesError.message}`);
  if (!houses || houses.length === 0) throw new Error("No active houses found.");

  const { error: deleteError } = await supabase
    .from("ramadan_schedules")
    .delete()
    .eq("ramadan_year", input.ramadanYear)
    .eq("is_published", false);

  if (deleteError) throw new Error(`Failed clearing existing draft: ${deleteError.message}`);

  const inserts: {
    ramadan_year: number;
    day_number: number;
    assignment_type: AssignmentType;
    house_id: string;
    is_published: boolean;
    created_by_user_id: string;
    created_by_name_snapshot: string;
  }[] = [];

  for (let day = 1; day <= input.totalDays; day += 1) {
    for (const assignmentType of ASSIGNMENT_TYPES) {
      const idx = assignmentHouseIndex(day, assignmentType, houses.length);
      inserts.push({
        ramadan_year: input.ramadanYear,
        day_number: day,
        assignment_type: assignmentType,
        house_id: houses[idx].id,
        is_published: false,
        created_by_user_id: userId,
        created_by_name_snapshot: snapshotName,
      });
    }
  }

  const { data, error } = await supabase
    .from("ramadan_schedules")
    .insert(inserts)
    .select("id, ramadan_year, day_number, assignment_type, house_id, is_published");

  if (error) throw new Error(`Failed creating ramadan draft: ${error.message}`);
  return data ?? [];
}

export async function updateRamadanDraftAssignment(
  supabase: SupabaseClient,
  rawInput: unknown,
  ramadanYear: number,
) {
  const input = updateRamadanDraftSchema.parse(rawInput);

  const { data, error } = await supabase
    .from("ramadan_schedules")
    .update({ house_id: input.houseId })
    .eq("id", input.id)
    .eq("ramadan_year", ramadanYear)
    .eq("is_published", false)
    .select("id, ramadan_year, day_number, assignment_type, house_id, is_published")
    .single();

  if (error) throw new Error(`Failed updating draft assignment: ${error.message}`);
  return data;
}

export async function publishRamadanSchedule(supabase: SupabaseClient, rawInput: unknown) {
  const input = publishRamadanSchema.parse(rawInput);

  const { error: unpublishError } = await supabase
    .from("ramadan_schedules")
    .update({ is_published: false })
    .eq("ramadan_year", input.ramadanYear)
    .eq("is_published", true);

  if (unpublishError) throw new Error(`Failed unpublishing old schedule: ${unpublishError.message}`);

  const { data, error } = await supabase
    .from("ramadan_schedules")
    .update({ is_published: true })
    .eq("ramadan_year", input.ramadanYear)
    .eq("is_published", false)
    .select("id");

  if (error) throw new Error(`Failed publishing draft schedule: ${error.message}`);

  return {
    publishedCount: data?.length ?? 0,
  };
}
