export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Status = "LUNAS" | "SEBAGIAN" | "BELUM_BAYAR";

type EventBlock = {
  event: {
    id: string;
    event_year: number;
    event_type: "AGUSTUS_17" | "HALAL_BIHALAL";
    amount: number;
    is_active: boolean;
    note: string | null;
  };
  summary: {
    totalTarget: number;
    totalPaid: number;
    totalArrears: number;
  };
  houses: {
    houseId: string;
    code: string;
    displayName: string;
    paid: number;
    arrears: number;
    status: Status;
  }[];
};

const eventLabels: Record<"AGUSTUS_17" | "HALAL_BIHALAL", string> = {
  AGUSTUS_17: "Iuran 17 Agustus",
  HALAL_BIHALAL: "Iuran Halal Bihalal",
};

function toCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function badgeClass(status: Status) {
  if (status === "LUNAS") return "bg-emerald-100 text-emerald-700";
  if (status === "SEBAGIAN") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function computeStatus(paid: number, target: number): Status {
  if (paid >= target) return "LUNAS";
  if (paid > 0) return "SEBAGIAN";
  return "BELUM_BAYAR";
}

export default async function PublicInsidentalPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = Number(params.year ?? new Date().getFullYear());

  const supabase = await createSupabaseServerClient();
  const { data: eventsRaw } = await supabase
    .from("incidental_events")
    .select("id, event_year, event_type, amount, is_active, note")
    .eq("event_year", year)
    .eq("is_active", true)
    .order("event_type", { ascending: true });

  const { data: housesRaw } = await supabase
    .from("houses")
    .select("id, code, display_name")
    .eq("is_active", true)
    .order("code", { ascending: true });

  const events = (eventsRaw ?? []).map((event) => ({
    ...event,
    amount: Number(event.amount),
  }));
  const houses = housesRaw ?? [];

  const eventIds = events.map((event) => event.id);
  const { data: paymentsRaw } = await supabase
    .from("incidental_payments")
    .select("event_id, house_id, paid_amount")
    .in("event_id", eventIds.length ? eventIds : ["00000000-0000-0000-0000-000000000000"]);

  const payments = (paymentsRaw ?? []).map((payment) => ({
    ...payment,
    paid_amount: Number(payment.paid_amount),
  }));

  const blocks: EventBlock[] = events.map((event) => {
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
        status: computeStatus(paid, event.amount),
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

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:px-8 pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient-accent">Iuran Insidental</h1>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">Status iuran event tahunan untuk seluruh rumah.</p>
        </div>
        <form action="/insidental" className="flex items-center gap-2 glass-panel p-2 rounded-xl">
          <input
            type="number"
            name="year"
            defaultValue={year}
            className="w-28 rounded-lg border-0 bg-[var(--app-surface-2)] px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--app-accent)] focus:outline-none"
          />
          <button className="rounded-lg bg-gradient-to-r from-[var(--app-accent)] to-[#3b82f6] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-95" type="submit">
            Tampilkan
          </button>
        </form>
      </div>

      <div className="mt-6 space-y-8">
        {blocks.map((block) => (
          <section key={block.event.id} className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--app-accent-glow)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[var(--app-text)]">{eventLabels[block.event.event_type]}</h2>
                <p className="mt-1 flex items-center text-sm font-medium text-[var(--app-text-muted)]">
                  <span className="mr-2 rounded-md bg-[var(--app-surface-2)] px-2 py-1 text-xs border border-[var(--app-border-soft)]">Target Per Rumah</span>
                  {toCurrency(block.event.amount)}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 w-full lg:w-auto">
                <div className="rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-2)] p-4 text-sm transition-transform hover:-translate-y-1">
                  <p className="text-[var(--app-text-muted)] font-medium mb-1">Total Target</p>
                  <p className="text-xl font-bold text-[var(--app-text)]">{toCurrency(block.summary.totalTarget)}</p>
                </div>
                <div className="rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-2)] p-4 text-sm transition-transform hover:-translate-y-1 border-b-2 border-b-emerald-500">
                  <p className="text-[var(--app-text-muted)] font-medium mb-1">Sudah Dibayar</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{toCurrency(block.summary.totalPaid)}</p>
                </div>
                <div className="rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-2)] p-4 text-sm transition-transform hover:-translate-y-1 border-b-2 border-b-rose-500">
                  <p className="text-[var(--app-text-muted)] font-medium mb-1">Sisa Target</p>
                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{toCurrency(block.summary.totalArrears)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-solid)]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--app-border-soft)] text-sm">
                  <thead className="bg-[var(--app-surface-2)]">
                    <tr className="text-left text-[var(--app-text-muted)]">
                      <th className="px-4 py-3 font-semibold">Rumah</th>
                      <th className="px-4 py-3 font-semibold">Dibayar</th>
                      <th className="px-4 py-3 font-semibold">Sisa</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--app-border-soft)] bg-[var(--app-surface-solid)]">
                    {block.houses.map((row) => (
                      <tr key={row.houseId} className="transition-colors hover:bg-[var(--app-surface-2)]">
                        <td className="px-4 py-3 text-[var(--app-text)] font-medium">{row.code}</td>
                        <td className="px-4 py-3 text-[var(--app-text)] font-medium">{toCurrency(row.paid)}</td>
                        <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-medium">{toCurrency(row.arrears)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(row.status)} shadow-sm`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ))}

        {blocks.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-[var(--app-text-muted)]">
            Tidak ada event insidental aktif untuk tahun ini.
          </div>
        ) : null}
      </div>

      <div className="mt-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-[var(--app-accent)] hover:text-[var(--app-accent-hover)] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6"/></svg>
          Kembali ke dashboard
        </Link>
      </div>
    </main>
  );
}
