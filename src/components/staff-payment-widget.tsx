import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentMonthStaffPaymentSummary } from "@/lib/services/staff-payments";

function toCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function StaffPaymentWidget() {
  const supabase = await createSupabaseServerClient();

  let satpamTotal = 0;
  let sampahTotal = 0;
  let periodStart = "-";

  try {
    const summary = await getCurrentMonthStaffPaymentSummary(supabase);
    satpamTotal = summary.satpamTotal;
    sampahTotal = summary.sampahTotal;
    periodStart = summary.periodStart.slice(0, 7);
  } catch {
    // Keep zero values as safe fallback on public/admin dashboards.
  }

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Pembayaran Petugas Bulan Ini</h2>
      <p className="mt-1 text-xs text-zinc-500">Periode: {periodStart}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500">Total dibayar Satpam</p>
          <p className="mt-1 text-lg font-semibold">{toCurrency(satpamTotal)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500">Total dibayar Tukang Sampah</p>
          <p className="mt-1 text-lg font-semibold">{toCurrency(sampahTotal)}</p>
        </div>
      </div>
    </section>
  );
}
