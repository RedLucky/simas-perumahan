import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createIuranPaymentSchema,
  type CreateIuranPaymentInput,
  updateIuranPaymentSchema,
} from "@/lib/validators/iuran";

export type IuranPaymentStatus = "LUNAS" | "SEBAGIAN" | "BELUM_BAYAR";

export type IuranComputation = {
  dueAmount: number;
  previousArrears: number;
  totalLiability: number;
  newArrears: number;
  status: IuranPaymentStatus;
};

export function computeIuranState(args: {
  dueAmount: number;
  previousArrears: number;
  paidAmount: number;
}): IuranComputation {
  const totalLiability = Math.max(args.dueAmount + args.previousArrears, 0);
  const newArrears = Math.max(totalLiability - args.paidAmount, 0);

  let status: IuranPaymentStatus = "BELUM_BAYAR";
  if (args.paidAmount >= totalLiability) {
    status = "LUNAS";
  } else if (args.paidAmount > 0) {
    status = "SEBAGIAN";
  }

  return {
    dueAmount: args.dueAmount,
    previousArrears: args.previousArrears,
    totalLiability,
    newArrears,
    status,
  };
}

function monthStart(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  return date.toISOString().slice(0, 7) + "-01";
}

function previousMonth(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 7) + "-01";
}

async function getDueAmountForMonth(
  supabase: SupabaseClient,
  monthKey: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("get_dues_amount_for_month", {
    target_month: monthKey,
  });

  if (error) {
    throw new Error(`Failed fetching dues amount: ${error.message}`);
  }

  return Number(data ?? 0);
}

async function getPreviousArrears(
  supabase: SupabaseClient,
  houseId: string,
  monthKey: string,
): Promise<number> {
  const prevMonth = previousMonth(monthKey);

  const { data, error } = await supabase
    .from("monthly_dues_arrears_by_house")
    .select("arrears_balance")
    .eq("house_id", houseId)
    .eq("month_key", prevMonth)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed fetching previous arrears: ${error.message}`);
  }

  return Number(data?.arrears_balance ?? 0);
}

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

function normalizeInput(parsed: CreateIuranPaymentInput) {
  return {
    ...parsed,
    monthKey: monthStart(parsed.monthKey),
    paidAt: parsed.paidAt,
  };
}

async function computeForInput(
  supabase: SupabaseClient,
  input: ReturnType<typeof normalizeInput>,
) {
  const [dueAmount, previousArrears] = await Promise.all([
    getDueAmountForMonth(supabase, input.monthKey),
    getPreviousArrears(supabase, input.houseId, input.monthKey),
  ]);

  return computeIuranState({
    dueAmount,
    previousArrears,
    paidAmount: input.paidAmount,
  });
}

export async function createIuranPayment(
  supabase: SupabaseClient,
  rawInput: unknown,
  userId: string,
) {
  const parsed = createIuranPaymentSchema.parse(rawInput);
  const input = normalizeInput(parsed);

  const [computed, snapshotName] = await Promise.all([
    computeForInput(supabase, input),
    getAdminSnapshotName(supabase, userId),
  ]);

  const { data, error } = await supabase
    .from("monthly_dues_payments")
    .insert({
      house_id: input.houseId,
      month_key: input.monthKey,
      paid_amount: input.paidAmount,
      paid_at: input.paidAt,
      note: input.note ?? null,
      created_by_user_id: userId,
      created_by_name_snapshot: snapshotName,
    })
    .select("id, house_id, month_key, paid_amount, paid_at, note, created_at")
    .single();

  if (error) {
    throw new Error(`Failed creating iuran payment: ${error.message}`);
  }

  return {
    payment: data,
    computed,
  };
}

export async function updateIuranPayment(
  supabase: SupabaseClient,
  rawInput: unknown,
) {
  const parsed = updateIuranPaymentSchema.parse(rawInput);
  const input = normalizeInput(parsed);

  const computed = await computeForInput(supabase, input);

  const { data, error } = await supabase
    .from("monthly_dues_payments")
    .update({
      house_id: input.houseId,
      month_key: input.monthKey,
      paid_amount: input.paidAmount,
      paid_at: input.paidAt,
      note: input.note ?? null,
    })
    .eq("id", parsed.id)
    .select("id, house_id, month_key, paid_amount, paid_at, note, created_at")
    .single();

  if (error) {
    throw new Error(`Failed updating iuran payment: ${error.message}`);
  }

  return { payment: data, computed };
}
