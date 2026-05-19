export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InsidentalAdminClient } from "./ui";

type House = { id: string; code: string; display_name: string };
type EventRow = {
  id: string;
  event_year: number;
  event_type: "AGUSTUS_17" | "HALAL_BIHALAL";
  amount: number;
  is_active: boolean;
  note: string | null;
};

export default async function AdminInsidentalPage() {
  const year = new Date().getFullYear();
  const supabase = await createSupabaseServerClient();

  const [{ data: houses }, { data: eventsRaw }] = await Promise.all([
    supabase.from("houses").select("id, code, display_name").eq("is_active", true).order("order_number", { ascending: true }),
    supabase
      .from("incidental_events")
      .select("id, event_year, event_type, amount, is_active, note")
      .eq("event_year", year)
      .order("event_type", { ascending: true }),
  ]);

  const events: EventRow[] = (eventsRaw ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Iuran Insidental</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Kelola event iuran tahunan (17 Agustus & Halal Bihalal) dan input pembayaran warga.
      </p>
      <InsidentalAdminClient
        initialYear={year}
        initialHouses={(houses ?? []) as House[]}
        initialEvents={events}
      />
    </main>
  );
}
