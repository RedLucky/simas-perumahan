"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function pretty(value: JsonValue) {
  return JSON.stringify(value, null, 2);
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

  const [monthlyRecap, setMonthlyRecap] = useState<JsonValue | null>(null);
  const [arrears, setArrears] = useState<JsonValue | null>(null);
  const [staffSalary, setStaffSalary] = useState<JsonValue | null>(null);
  const [yearlyBalance, setYearlyBalance] = useState<JsonValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchJson(url: string) {
    const response = await fetch(url, { cache: "no-store" });
    const json = await response.json();
    if (!response.ok || !json.ok) {
      throw new Error(json.message ?? "Request failed");
    }
    return json.data as JsonValue;
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
        <h2 className="text-xl font-bold tracking-tight text-[var(--app-text)] mb-6">Filter Laporan</h2>
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
          <Button type="button" onClick={() => void loadAllReports()} disabled={loading} className="w-full sm:w-auto px-8">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Memuat Data...
              </span>
            ) : "Muat Preview Laporan"}
          </Button>
          {error ? <p className="mt-3 text-sm font-medium text-rose-500">{error}</p> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportCard title="Rekap Bulanan" preview={monthlyRecap} exportPdf={downloadUrl("/api/reports/monthly-recap/export", new URLSearchParams({ ...Object.fromEntries(monthlyParams), format: "pdf" }))} exportXlsx={downloadUrl("/api/reports/monthly-recap/export", new URLSearchParams({ ...Object.fromEntries(monthlyParams), format: "xlsx" }))} />
        <ReportCard title="Tunggakan Warga" preview={arrears} exportPdf={downloadUrl("/api/reports/arrears/export", new URLSearchParams({ ...Object.fromEntries(arrearsParams), format: "pdf" }))} exportXlsx={downloadUrl("/api/reports/arrears/export", new URLSearchParams({ ...Object.fromEntries(arrearsParams), format: "xlsx" }))} />
        <ReportCard title="Riwayat Gaji Petugas" preview={staffSalary} exportPdf={downloadUrl("/api/reports/staff-salary/export", new URLSearchParams({ ...Object.fromEntries(salaryParams), format: "pdf" }))} exportXlsx={downloadUrl("/api/reports/staff-salary/export", new URLSearchParams({ ...Object.fromEntries(salaryParams), format: "xlsx" }))} />
        <ReportCard title="Neraca Tahunan" preview={yearlyBalance} exportPdf={downloadUrl("/api/reports/yearly-balance/export", new URLSearchParams({ ...Object.fromEntries(yearlyParams), format: "pdf" }))} exportXlsx={downloadUrl("/api/reports/yearly-balance/export", new URLSearchParams({ ...Object.fromEntries(yearlyParams), format: "xlsx" }))} />
      </div>

      {adminMode ? null : (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-2)] p-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--app-accent)] shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          <p className="text-sm text-[var(--app-text-muted)] font-medium">Laporan dapat diunduh dalam format PDF atau Excel untuk kebutuhan warga.</p>
        </div>
      )}
    </section>
  );
}

function ReportCard({ title, preview, exportPdf, exportXlsx }: { title: string; preview: JsonValue | null; exportPdf: string; exportXlsx: string }) {
  return (
    <div className="glass-panel flex flex-col rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-[var(--app-accent-glow)]">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-bold tracking-tight text-[var(--app-text)]">{title}</h3>
        <div className="flex gap-2">
          <a href={exportPdf}><Button variant="outline" className="h-9 px-3 text-xs">PDF</Button></a>
          <a href={exportXlsx}><Button variant="outline" className="h-9 px-3 text-xs">Excel</Button></a>
        </div>
      </div>

      <div className="flex-1 rounded-xl bg-[#0f172a] border border-[#1e293b] p-4 relative group">
        <div className="absolute top-2 right-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/80 px-2 py-1 rounded">JSON</span>
        </div>
        <pre className="overflow-x-auto text-[11px] font-mono leading-snug text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {preview ? pretty(preview) : 'Data belum dimuat.'}
        </pre>
      </div>
    </div>
  );
}
