import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createExpense, updateExpense } from "@/lib/services/expenses";
import { expenseCategoryValues } from "@/lib/validators/expenses";

function toMonthDate(month: string | null) {
  if (!month) return null;
  if (/^\d{4}-\d{2}$/.test(month)) return `${month}-01`;
  return month;
}

function endOfMonth(monthStart: string) {
  const date = new Date(`${monthStart}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
}

async function getAuthedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { supabase, user: null };
  return { supabase, user };
}

export async function GET(request: Request) {
  const { supabase, user } = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const month = toMonthDate(url.searchParams.get("month"));
  const category = url.searchParams.get("category");

  let query = supabase
    .from("expenses")
    .select("id, category, amount, expense_date, note, created_at, created_by_name_snapshot")
    .order("expense_date", { ascending: false })
    .limit(300);

  if (month) {
    query = query.gte("expense_date", month).lte("expense_date", endOfMonth(month));
  }

  if (category && expenseCategoryValues.includes(category as (typeof expenseCategoryValues)[number])) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: { rows: data ?? [] } });
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const result = await createExpense(supabase, payload, user.id);

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, message: "Invalid payload", errors: error.flatten() },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, user } = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const result = await updateExpense(supabase, payload);

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, message: "Invalid payload", errors: error.flatten() },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
