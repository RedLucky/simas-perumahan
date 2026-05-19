import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getArrearsReport } from "@/lib/services/reports";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const url = new URL(request.url);
    const month = url.searchParams.get("month");

    const data = await getArrearsReport(supabase, month);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
