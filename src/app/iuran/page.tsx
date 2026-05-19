export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type IuranRow = {
  house_id: string;
  code: string;
  display_name: string;
  order_number: number;
  month_key: string;
  due_in_month: number;
  paid_in_month: number;
  arrears_balance: number;
  payment_status: "LUNAS" | "SEBAGIAN" | "BELUM_BAYAR";
};

function toCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusBadge(status: IuranRow["payment_status"]) {
  if (status === "LUNAS") return "bg-emerald-100 text-emerald-700";
  if (status === "SEBAGIAN") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function normalizeMonthParam(month: string | null): string {
  if (!month) return new Date().toISOString().slice(0, 7) + "-01";
  if (/^\d{4}-\d{2}$/.test(month)) return `${month}-01`;
  return month;
}

export default async function PublicIuranPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const monthKey = normalizeMonthParam(params.month ?? null);
  const monthInput = monthKey.slice(0, 7);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("monthly_dues_arrears_by_house")
    .select("house_id, code, display_name, order_number, month_key, due_in_month, paid_in_month, arrears_balance, payment_status")
    .eq("month_key", monthKey)
    .order("order_number", { ascending: true });

  const rows: IuranRow[] = (data ?? []).map((row) => ({
    house_id: row.house_id,
    code: row.code,
    display_name: row.display_name,
    order_number: Number(row.order_number),
    month_key: row.month_key,
    due_in_month: Number(row.due_in_month),
    paid_in_month: Number(row.paid_in_month),
    arrears_balance: Number(row.arrears_balance),
    payment_status: row.payment_status,
  }));

  const summary = rows.reduce(
    (acc, row) => {
      acc.totalDue += row.due_in_month;
      acc.totalPaid += row.paid_in_month;
      acc.totalArrears += row.arrears_balance;
      return acc;
    },
    { totalDue: 0, totalPaid: 0, totalArrears: 0 },
  );

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:px-8 pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient-accent">Status Iuran Warga</h1>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">
            Pantau status pembayaran iuran per rumah untuk bulan terpilih.
          </p>
        </div>
        <form action="/iuran" className="flex items-center gap-2 glass-panel p-2 rounded-xl">
          <input
            type="month"
            name="month"
            defaultValue={monthInput}
            className="rounded-lg border-0 bg-[var(--app-surface-2)] px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--app-accent)] focus:outline-none"
          />
          <button className="rounded-lg bg-gradient-to-r from-[var(--app-accent)] to-[#3b82f6] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-95" type="submit">
            Tampilkan
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="glass-panel rounded-2xl p-5 transition-transform hover:-translate-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--app-text-muted)]">Total Kewajiban</p>
          <p className="mt-2 text-2xl font-bold text-[var(--app-text)]">{toCurrency(summary.totalDue)}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 transition-transform hover:-translate-y-1 border-l-4 border-l-emerald-500">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--app-text-muted)]">Total Dibayar</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{toCurrency(summary.totalPaid)}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 transition-transform hover:-translate-y-1 border-l-4 border-l-rose-500">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--app-text-muted)]">Akumulasi Tunggakan</p>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{toCurrency(summary.totalArrears)}</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--app-border-soft)] text-sm">
            <thead className="bg-[var(--app-surface-2)]">
              <tr className="text-left text-[var(--app-text-muted)]">
                <th className="px-4 py-3 font-semibold">Rumah</th>
                <th className="px-4 py-3 font-semibold">Kewajiban</th>
                <th className="px-4 py-3 font-semibold">Dibayar</th>
                <th className="px-4 py-3 font-semibold">Tunggakan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border-soft)] bg-[var(--app-surface-solid)]">
              {rows.map((row) => (
                <tr key={row.house_id} className="transition-colors hover:bg-[var(--app-surface-2)]">
                  <td className="px-4 py-3 font-medium text-[var(--app-text)]">{row.code}</td>
                  <td className="px-4 py-3 text-[var(--app-text-muted)]">{toCurrency(row.due_in_month)}</td>
                  <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-medium">{toCurrency(row.paid_in_month)}</td>
                  <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-medium">{toCurrency(row.arrears_balance)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(row.payment_status)} shadow-sm`}>
                      {row.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[var(--app-text-muted)]">Belum ada data iuran untuk bulan ini.</p>
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
