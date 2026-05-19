import type { SupabaseClient } from "@supabase/supabase-js";
import { createExpenseSchema, updateExpenseSchema } from "@/lib/validators/expenses";

async function getAdminSnapshotName(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("full_name")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed fetching admin profile: ${error.message}`);
  }

  return data?.full_name ?? "Ketua RT";
}

export async function createExpense(
  supabase: SupabaseClient,
  rawInput: unknown,
  userId: string,
) {
  const input = createExpenseSchema.parse(rawInput);
  const snapshotName = await getAdminSnapshotName(supabase, userId);

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      category: input.category,
      amount: input.amount,
      expense_date: input.expenseDate,
      note: input.note ?? null,
      created_by_user_id: userId,
      created_by_name_snapshot: snapshotName,
    })
    .select("id, category, amount, expense_date, note, created_at, created_by_name_snapshot")
    .single();

  if (error) {
    throw new Error(`Failed creating expense: ${error.message}`);
  }

  return data;
}

export async function updateExpense(
  supabase: SupabaseClient,
  rawInput: unknown,
) {
  const input = updateExpenseSchema.parse(rawInput);

  const { data, error } = await supabase
    .from("expenses")
    .update({
      category: input.category,
      amount: input.amount,
      expense_date: input.expenseDate,
      note: input.note ?? null,
    })
    .eq("id", input.id)
    .select("id, category, amount, expense_date, note, created_at, created_by_name_snapshot")
    .single();

  if (error) {
    throw new Error(`Failed updating expense: ${error.message}`);
  }

  return data;
}
