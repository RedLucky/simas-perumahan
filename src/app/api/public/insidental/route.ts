import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeYear(yearRaw: string | null): number {
  const parsed = Number(yearRaw ?? new Date().getFullYear());
  if (!Number.isFinite(parsed) || parsed < 2000 || parsed > 2100) {
    return new Date().getFullYear();
  }
  return parsed;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const url = new URL(request.url);
  const year = normalizeYear(url.searchParams.get("year"));

  const [{ data: eventsRaw, error: eventsError }, { data: housesRaw, error: housesError }, { data: paymentsRaw, error: paymentsError }] =
    await Promise.all([
      supabase
        .from("incidental_events")
        .select("id, event_year, event_type, amount, is_active, note")
        .eq("event_year", year)
        .eq("is_active", true)
        .order("event_type", { ascending: true }),
      supabase.from("houses").select("id, code, display_name").eq("is_active", true).order("order_number", { ascending: true }),
      supabase
        .from("incidental_payments")
        .select("id, event_id, house_id, paid_amount")
        .in(
          "event_id",
          (
            await supabase
              .from("incidental_events")
              .select("id")
              .eq("event_year", year)
              .eq("is_active", true)
          ).data?.map((x) => x.id) ?? ["00000000-0000-0000-0000-000000000000"],
        ),
    ]);

  if (eventsError || housesError || paymentsError) {
    const message = eventsError?.message ?? housesError?.message ?? paymentsError?.message ?? "Failed fetching incidental data";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }

  const events = (eventsRaw ?? []).map((event) => ({
    ...event,
    amount: Number(event.amount ?? 0),
  }));

  const houses = housesRaw ?? [];
  const payments = (paymentsRaw ?? []).map((payment) => ({
    ...payment,
    paid_amount: Number(payment.paid_amount ?? 0),
  }));

  const rows = events.map((event) => {
    const eventPayments = payments.filter((payment) => payment.event_id === event.id);

    const byHouse = houses.map((house) => {
      const paid = eventPayments
        .filter((payment) => payment.house_id === house.id)
        .reduce((acc, payment) => acc + payment.paid_amount, 0);
      const arrears = Math.max(event.amount - paid, 0);

      return {
        houseId: house.id,
        code: house.code,
        displayName: house.display_name,
        paid,
        arrears,
        status: paid >= event.amount ? "LUNAS" : paid > 0 ? "SEBAGIAN" : "BELUM_BAYAR",
      };
    });

    const totalTarget = event.amount * houses.length;
    const totalPaid = byHouse.reduce((acc, item) => acc + item.paid, 0);

    return {
      event,
      summary: {
        totalTarget,
        totalPaid,
        totalArrears: Math.max(totalTarget - totalPaid, 0),
      },
      houses: byHouse,
    };
  });

  return NextResponse.json({
    ok: true,
    data: {
      year,
      rows,
    },
  });
}
