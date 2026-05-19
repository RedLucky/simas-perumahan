import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createIncidentalPayment, updateIncidentalPayment } from "@/lib/services/incidental";

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

  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ ok: false, message: "eventId is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("incidental_payments")
    .select("id, event_id, house_id, paid_amount, paid_at, note, created_at, houses!inner(code, display_name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data: { rows: data ?? [] } });
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const row = await createIncidentalPayment(supabase, payload, user.id);
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

export async function PUT(request: Request) {
  try {
    const { supabase, user } = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const row = await updateIncidentalPayment(supabase, payload);
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
