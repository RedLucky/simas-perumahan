"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const CATEGORY_LABELS: Record<string, string> = {
  GAJI_SATPAM_FULLTIME: "Gaji Satpam (Fulltime)",
  GAJI_SATPAM_MINGGU: "Gaji Satpam (Minggu)",
  GAJI_TUKANG_SAMPAH: "Gaji Tukang Sampah",
  THR_SATPAM: "THR Satpam",
  THR_TUKANG_SAMPAH: "THR Tukang Sampah",
  UANG_KEMATIAN: "Santunan Kematian",
  IURAN_17_AGUSTUS: "Kegiatan 17 Agustus",
  IURAN_HALAL_BIHALAL: "Halal Bihalal",
  LAIN_LAIN: "Pengeluaran Lain-lain",
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

function downloadUrl(path: string, params: URLSearchParams) {
  return `${path}?${params.toString()}`;
}

export function LaporanClient({ adminMode = false }: { adminMode?: boolean }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear = String(new Date().getFullYear());
  const currentFrom = `${currentMonth}-01`;
  const now = new Date(`${currentFrom}T00:00:00Z`);
  now.setUTCMonth(now.getUTCMonth() + 1);
  now.setUTCDate(0);
  const currentTo = now.toISOString().slice(0, 10);

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);

  const [monthlyRecap, setMonthlyRecap] = useState<any | null>(null);
  const [arrears, setArrears] = useState<any | null>(null);
  const [staffSalary, setStaffSalary] = useState<any | null>(null);
  const [yearlyBalance, setYearlyBalance] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  async function fetchJson(url: string) {
    const response = await fetch(url, { cache: "no-store" });
    const json = await response.json();
    if (!response.ok || !json.ok) {
      throw new Error(json.message ?? "Request failed");
    }
    return json.data;
  }

  async function loadAllReports() {
    setLoading(true);
    setError(null);

    try {
      const [a, b, c, d] = await Promise.all([
        fetchJson(`/api/reports/monthly-recap?month=${month}`),
        fetchJson(`/api/reports/arrears?month=${month}`),
        fetchJson(`/api/reports/staff-salary?from=${from}&to=${to}`),
        fetchJson(`/api/reports/yearly-balance?year=${year}`),
      ]);
      setMonthlyRecap(a);
      setArrears(b);
      setStaffSalary(c);
      setYearlyBalance(d);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }

    setLoading(false);
  }

  const monthlyParams = new URLSearchParams({ month });
  const arrearsParams = new URLSearchParams({ month });
  const salaryParams = new URLSearchParams({ from, to });
  const yearlyParams = new URLSearchParams({ year });

  return (
    <section className="mt-6 space-y-6">
      <div className="glass-panel rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-[var(--app-accent-glow)]">
        <h2 className="text-xl font-bold tracking-tight text-[var(--app-text)] mb-6">Filter Periode Laporan</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-[var(--app-text-muted)]">Bulan (Rekap & Tunggakan)</span>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-[var(--app-surface-2)] border-[var(--app-border-soft)] focus-visible:ring-[var(--app-accent)]" />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-[var(--app-text-muted)]">Dari Tanggal (Gaji)</span>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-[var(--app-surface-2)] border-[var(--app-border-soft)] focus-visible:ring-[var(--app-accent)]" />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-[var(--app-text-muted)]">Sampai Tanggal (Gaji)</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-[var(--app-surface-2)] border-[var(--app-border-soft)] focus-visible:ring-[var(--app-accent)]" />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-[var(--app-text-muted)]">Tahun (Neraca)</span>
            <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="bg-[var(--app-surface-2)] border-[var(--app-border-soft)] focus-visible:ring-[var(--app-accent)]" />
          </label>
        </div>
        <div className="mt-6 pt-6 border-t border-[var(--app-border-soft)]">
          <Button type="button" onClick={() => void loadAllReports()} disabled={loading} className="w-full sm:w-auto px-8 shadow-md">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Memuat Data Laporan...
              </span>
            ) : "Muat Data Laporan"}
          </Button>
          {error ? <p className="mt-3 text-sm font-medium text-rose-500">{error}</p> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rekap Bulanan */}
        <ReportCard 
          title="Rekap Bulanan" 
          type="recap"
          preview={monthlyRecap} 
          exportPdf={downloadUrl("/api/reports/monthly-recap/export", new URLSearchParams({ ...Object.fromEntries(monthlyParams), format: "pdf" }))} 
          exportXlsx={downloadUrl("/api/reports/monthly-recap/export", new URLSearchParams({ ...Object.fromEntries(monthlyParams), format: "xlsx" }))} 
        />

        {/* Tunggakan Warga */}
        <ReportCard 
          title="Tunggakan Warga" 
          type="arrears"
          preview={arrears} 
          exportPdf={downloadUrl("/api/reports/arrears/export", new URLSearchParams({ ...Object.fromEntries(arrearsParams), format: "pdf" }))} 
          exportXlsx={downloadUrl("/api/reports/arrears/export", new URLSearchParams({ ...Object.fromEntries(arrearsParams), format: "xlsx" }))} 
        />

        {/* Riwayat Gaji Petugas */}
        <ReportCard 
          title="Riwayat Gaji Petugas" 
          type="salary"
          preview={staffSalary} 
          exportPdf={downloadUrl("/api/reports/staff-salary/export", new URLSearchParams({ ...Object.fromEntries(salaryParams), format: "pdf" }))} 
          exportXlsx={downloadUrl("/api/reports/staff-salary/export", new URLSearchParams({ ...Object.fromEntries(salaryParams), format: "xlsx" }))} 
        />

        {/* Neraca Tahunan */}
        <ReportCard 
          title="Neraca Tahunan" 
          type="yearly"
          preview={yearlyBalance} 
          exportPdf={downloadUrl("/api/reports/yearly-balance/export", new URLSearchParams({ ...Object.fromEntries(yearlyParams), format: "pdf" }))} 
          exportXlsx={downloadUrl("/api/reports/yearly-balance/export", new URLSearchParams({ ...Object.fromEntries(yearlyParams), format: "xlsx" }))} 
        />
      </div>

      {adminMode ? null : (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-2)] p-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--app-accent)] shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          <p className="text-sm text-[var(--app-text-muted)] font-medium">Laporan resmi perumahan dapat diunduh dalam format PDF atau Excel untuk keperluan warga.</p>
        </div>
      )}
    </section>
  );
}

function ReportCard({ 
  title, 
  type,
  preview, 
  exportPdf, 
  exportXlsx 
}: { 
  title: string; 
  type: "recap" | "arrears" | "salary" | "yearly";
  preview: any | null; 
  exportPdf: string; 
  exportXlsx: string 
}) {
  return (
    <div className="glass-panel flex flex-col rounded-3xl p-6 transition-all hover:shadow-lg hover:shadow-[var(--app-accent-glow)] min-h-[420px]">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-[var(--app-text)]">{title}</h3>
          <p className="text-xs text-[var(--app-text-muted)]">Pratinjau data & dokumen</p>
        </div>
        <div className="flex gap-2">
          <a href={exportPdf}><Button variant="outline" className="h-9 px-3.5 text-xs font-semibold gap-1 hover:border-red-500 hover:text-red-500">PDF</Button></a>
          <a href={exportXlsx}><Button variant="outline" className="h-9 px-3.5 text-xs font-semibold gap-1 hover:border-emerald-500 hover:text-emerald-500">Excel</Button></a>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-surface-solid)] p-4 overflow-hidden flex flex-col">
        {!preview ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[var(--app-text-muted)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 opacity-50"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>
            <p className="text-sm font-semibold">Data belum dimuat</p>
            <p className="text-xs mt-0.5">Silakan klik "Muat Data Laporan" di atas.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
            {type === "recap" && <MonthlyRecapView data={preview} />}
            {type === "arrears" && <ArrearsReportView data={preview} />}
            {type === "salary" && <StaffSalaryView data={preview} />}
            {type === "yearly" && <YearlyBalanceView data={preview} />}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   RENDER SUB-COMPONENTS FOR LAPORAN
   ========================================================================== */

function MonthlyRecapView({ data }: { data: any }) {
  const dues = data.income?.dues ?? 0;
  const incidental = data.income?.incidental ?? 0;
  const totalIncome = data.income?.total ?? 0;
  const totalExpense = data.expenses?.total ?? 0;
  const endingBalance = data.endingBalance ?? 0;
  const byCategory = data.expenses?.byCategory ?? [];

  const maxExpense = Math.max(...byCategory.map((c: any) => c.amount), 1);
  const netIncome = totalIncome - totalExpense;

  return (
    <div className="space-y-4">
      {/* Cards Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3">
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Total Pemasukan</p>
          <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="rounded-xl bg-rose-500/5 border border-rose-500/10 p-3">
          <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">Total Pengeluaran</p>
          <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(totalExpense)}</p>
        </div>
      </div>

      <div className="rounded-xl bg-[var(--app-surface-2)] p-3 border border-[var(--app-border-soft)] flex justify-between items-center text-sm">
        <span className="font-medium text-[var(--app-text-muted)]">Sisa Kas Bulan Ini (Net):</span>
        <span className={`font-black ${netIncome >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
          {netIncome >= 0 ? "+" : ""}{formatCurrency(netIncome)}
        </span>
      </div>

      {/* Income breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--app-text-muted)]">Rincian Pemasukan</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-xl border border-[var(--app-border-soft)]">
            <span className="block text-[var(--app-text-muted)]">Iuran Bulanan</span>
            <span className="font-bold text-[var(--app-text)]">{formatCurrency(dues)}</span>
          </div>
          <div className="p-2.5 rounded-xl border border-[var(--app-border-soft)]">
            <span className="block text-[var(--app-text-muted)]">Insidental</span>
            <span className="font-bold text-[var(--app-text)]">{formatCurrency(incidental)}</span>
          </div>
        </div>
      </div>

      {/* Expenses breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--app-text-muted)]">Breakdown Pengeluaran</h4>
        {byCategory.length === 0 ? (
          <p className="text-xs text-[var(--app-text-muted)] italic">Tidak ada pengeluaran bulan ini.</p>
        ) : (
          <div className="space-y-3">
            {byCategory.map((cat: any) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[var(--app-text)]">{CATEGORY_LABELS[cat.category] ?? cat.category}</span>
                  <span className="font-bold text-rose-500">{formatCurrency(cat.amount)}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--app-surface-2)] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-500 to-red-400" style={{ width: `${(cat.amount / maxExpense) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-[var(--app-border-soft)] flex justify-between items-center text-xs">
        <span className="text-[var(--app-text-muted)] font-medium">Saldo Kas Kumulatif Akhir:</span>
        <span className="font-black text-[var(--app-accent)] text-sm">{formatCurrency(endingBalance)}</span>
      </div>
    </div>
  );
}

function ArrearsReportView({ data }: { data: any }) {
  const rows = data.rows ?? [];
  const totalHouses = rows.length;
  const paidHouses = rows.filter((r: any) => r.paymentStatus === "LUNAS").length;
  const partialHouses = rows.filter((r: any) => r.paymentStatus === "SEBAGIAN").length;
  const unpaidHouses = totalHouses - paidHouses - partialHouses;
  const totalArrears = rows.reduce((sum: number, r: any) => sum + (r.arrearsBalance ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2">
          <div className="font-black text-emerald-500 text-sm">{paidHouses}</div>
          <div className="text-[9px] font-semibold text-emerald-600/80 uppercase">Lunas</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-2">
          <div className="font-black text-amber-500 text-sm">{partialHouses}</div>
          <div className="text-[9px] font-semibold text-amber-600/80 uppercase">Sebagian</div>
        </div>
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-2">
          <div className="font-black text-rose-500 text-sm">{unpaidHouses}</div>
          <div className="text-[9px] font-semibold text-rose-600/80 uppercase">Tunggak</div>
        </div>
      </div>

      <div className="rounded-xl bg-[var(--app-surface-2)] p-3 border border-[var(--app-border-soft)] flex justify-between items-center text-xs">
        <span className="font-medium text-[var(--app-text-muted)]">Total Akumulasi Tunggakan:</span>
        <span className="font-bold text-rose-500">{formatCurrency(totalArrears)}</span>
      </div>

      {/* Table List */}
      <div className="rounded-xl border border-[var(--app-border-soft)] overflow-hidden">
        <div className="overflow-x-auto max-h-[220px] scrollbar-thin">
          <table className="min-w-full divide-y divide-[var(--app-border-soft)] text-xs">
            <thead className="bg-[var(--app-surface-2)] sticky top-0">
              <tr className="text-left text-[var(--app-text-muted)]">
                <th className="px-3 py-2 font-semibold">Rumah</th>
                <th className="px-3 py-2 font-semibold">Tunggakan</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border-soft)]">
              {rows.map((row: any) => (
                <tr key={row.houseId} className="hover:bg-[var(--app-surface-2)] transition-colors">
                  <td className="px-3 py-2 font-bold text-[var(--app-text)]">{row.code}</td>
                  <td className={`px-3 py-2 font-semibold ${row.arrearsBalance > 0 ? "text-rose-500" : "text-[var(--app-text-muted)]"}`}>
                    {formatCurrency(row.arrearsBalance)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      row.paymentStatus === "LUNAS" ? "bg-emerald-500/10 text-emerald-500" :
                      row.paymentStatus === "SEBAGIAN" ? "bg-amber-500/10 text-amber-500" :
                      "bg-rose-500/10 text-rose-500"
                    }`}>
                      {row.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StaffSalaryView({ data }: { data: any }) {
  const totals = data.totals ?? { satpam: 0, sampah: 0, total: 0 };
  const rows = data.rows ?? [];

  return (
    <div className="space-y-4">
      {/* Category breakdown cards */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl border border-[var(--app-border-soft)]">
          <span className="block text-[var(--app-text-muted)]">Total Satpam</span>
          <span className="text-base font-black text-[var(--app-text)] mt-1 block">{formatCurrency(totals.satpam)}</span>
        </div>
        <div className="p-3 rounded-xl border border-[var(--app-border-soft)]">
          <span className="block text-[var(--app-text-muted)]">Total T. Sampah</span>
          <span className="text-base font-black text-[var(--app-text)] mt-1 block">{formatCurrency(totals.sampah)}</span>
        </div>
      </div>

      <div className="rounded-xl bg-[var(--app-surface-2)] p-3 border border-[var(--app-border-soft)] flex justify-between items-center text-xs">
        <span className="font-semibold text-[var(--app-text)]">Grand Total Pengeluaran Gaji:</span>
        <span className="font-black text-[var(--app-accent)] text-sm">{formatCurrency(totals.total)}</span>
      </div>

      {/* History table */}
      <div className="rounded-xl border border-[var(--app-border-soft)] overflow-hidden">
        <div className="overflow-x-auto max-h-[220px] scrollbar-thin">
          <table className="min-w-full divide-y divide-[var(--app-border-soft)] text-xs">
            <thead className="bg-[var(--app-surface-2)] sticky top-0">
              <tr className="text-left text-[var(--app-text-muted)]">
                <th className="px-3 py-2 font-semibold">Tanggal</th>
                <th className="px-3 py-2 font-semibold">Petugas</th>
                <th className="px-3 py-2 font-semibold text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border-soft)]">
              {rows.map((row: any) => (
                <tr key={row.id} className="hover:bg-[var(--app-surface-2)] transition-colors">
                  <td className="px-3 py-2 text-[var(--app-text-muted)]">{row.expenseDate}</td>
                  <td className="px-3 py-2 font-semibold text-[var(--app-text)]">
                    {CATEGORY_LABELS[row.category] ? CATEGORY_LABELS[row.category].replace("Gaji ", "") : row.category}
                  </td>
                  <td className="px-3 py-2 font-bold text-rose-500 text-right">{formatCurrency(row.amount)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-[var(--app-text-muted)] italic">
                    Tidak ada pembayaran gaji dalam periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function YearlyBalanceView({ data }: { data: any }) {
  const dues = data.income?.dues ?? 0;
  const incidental = data.income?.incidental ?? 0;
  const totalIncome = data.income?.total ?? 0;
  const totalExpense = data.expense?.total ?? 0;
  const net = data.net ?? 0;

  const totalDiff = Math.max(totalIncome, totalExpense, 1);
  const incomeRate = Math.round((totalIncome / totalDiff) * 100);
  const expenseRate = Math.round((totalExpense / totalDiff) * 100);

  return (
    <div className="space-y-4">
      {/* Income breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--app-text-muted)]">Pemasukan Tahunan</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-[var(--app-border-soft)]">
            <span className="block text-[var(--app-text-muted)]">Iuran Bulanan</span>
            <span className="text-sm font-bold text-[var(--app-text)] mt-1 block">{formatCurrency(dues)}</span>
          </div>
          <div className="p-3 rounded-xl border border-[var(--app-border-soft)]">
            <span className="block text-[var(--app-text-muted)]">Iuran Insidental</span>
            <span className="text-sm font-bold text-[var(--app-text)] mt-1 block">{formatCurrency(incidental)}</span>
          </div>
        </div>
      </div>

      {/* Comparison visual */}
      <div className="space-y-3 p-3.5 rounded-xl bg-[var(--app-surface-2)] border border-[var(--app-border-soft)]">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-emerald-500">Total Pemasukan</span>
            <span className="font-bold">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--app-border-soft)] overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${incomeRate}%` }} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-rose-500">Total Pengeluaran</span>
            <span className="font-bold">{formatCurrency(totalExpense)}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--app-border-soft)] overflow-hidden">
            <div className="h-full bg-rose-500" style={{ width: `${expenseRate}%` }} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--app-border-soft)] p-3 flex justify-between items-center text-sm">
        <span className="font-semibold text-[var(--app-text)]">Selisih Bersih (Net):</span>
        <span className={`font-black ${net >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
          {net >= 0 ? "+" : ""}{formatCurrency(net)}
        </span>
      </div>
    </div>
  );
}
