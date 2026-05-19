import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateRamadanDraftAssignment } from "@/lib/services/ramadan";

function normalizeYear(yearRaw: string | null): number {
  const year = Number(yearRaw ?? new Date().getFullYear());
  if (!Number.isFinite(year) || year < 2000 || year > 2100) return new Date().getFullYear();
  return year;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const year = normalizeYear(url.searchParams.get("year"));

  const [{ data: rows, error }, { data: houses, error: housesError }] = await Promise.all([
    supabase
      .from("ramadan_schedules")
      .select("id, ramadan_year, day_number, assignment_type, house_id, is_published, houses!inner(code, display_name)")
      .eq("ramadan_year", year)
      .order("day_number", { ascending: true })
      .order("assignment_type", { ascending: true }),
    supabase.from("houses").select("id, code, display_name").eq("is_active", true).order("order_number", { ascending: true }),
  ]);

  if (error || housesError) {
    const message = error?.message ?? housesError?.message ?? "Failed fetching ramadan draft";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: { rows: rows ?? [], houses: houses ?? [] } });
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const year = normalizeYear(url.searchParams.get("year"));
    const payload = await request.json();

    const row = await updateRamadanDraftAssignment(supabase, payload, year);
    return NextResponse.json({ ok: true, data: row });
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
