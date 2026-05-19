import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getYearlyBalanceReport } from "@/lib/services/reports";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const url = new URL(request.url);
    const year = url.searchParams.get("year");

    const data = await getYearlyBalanceReport(supabase, year);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
