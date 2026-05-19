export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AssignmentType = "TAKJIL_MUSHOLA" | "SAHUR_SATPAM" | "BUKA_SATPAM";

type ScheduleRow = {
  id: string;
  ramadan_year: number;
  day_number: number;
  assignment_type: AssignmentType;
  house_id: string;
  houses: { code: string; display_name: string } | { code: string; display_name: string }[];
};

const assignmentLabels: Record<AssignmentType, string> = {
  TAKJIL_MUSHOLA: "Takjil Mushola",
  SAHUR_SATPAM: "Sahur Satpam",
  BUKA_SATPAM: "Buka Satpam",
};

function normalizeYear(value: string | undefined): number {
  const currentYear = new Date().getFullYear();
  const parsed = Number(value ?? currentYear);
  if (!Number.isFinite(parsed) || parsed < 2000 || parsed > 2100) return currentYear;
  return parsed;
}

function toHouseCode(houseRel: ScheduleRow["houses"]) {
  if (Array.isArray(houseRel)) return houseRel[0]?.code ?? "-";
  return houseRel?.code ?? "-";
}

function groupByDay(rows: ScheduleRow[]) {
  const grouped = new Map<number, Partial<Record<AssignmentType, string>>>();

  for (const row of rows) {
    if (!grouped.has(row.day_number)) {
      grouped.set(row.day_number, {});
    }

    const day = grouped.get(row.day_number)!;
    day[row.assignment_type] = toHouseCode(row.houses);
  }

  return Array.from(grouped.entries())
    .map(([dayNumber, assignments]) => ({
      dayNumber,
      assignments,
    }))
    .sort((a, b) => a.dayNumber - b.dayNumber);
}

export default async function PublicJadwalTakjilPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = normalizeYear(params.year);

  const supabase = await createSupabaseServerClient();

  const { data: rowsRaw } = await supabase
    .from("ramadan_schedules")
    .select("id, ramadan_year, day_number, assignment_type, house_id, houses!inner(code, display_name)")
    .eq("ramadan_year", year)
    .eq("is_published", true)
    .order("day_number", { ascending: true })
    .order("assignment_type", { ascending: true });

  const rows = (rowsRaw ?? []) as ScheduleRow[];
  const groupedDays = groupByDay(rows);

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:px-8 pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient-accent">Jadwal Takjil Ramadan</h1>
          <p className="mt-2 text-sm text-[var(--app-text-muted)]">Jadwal resmi pembagian takjil & makanan yang sudah dipublish untuk warga.</p>
        </div>
        <form action="/jadwal-takjil" className="flex items-center gap-2 glass-panel p-2 rounded-xl">
          <input
            type="number"
            name="year"
            defaultValue={year}
            className="w-28 rounded-lg border-0 bg-[var(--app-surface-2)] px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--app-accent)] focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-gradient-to-r from-[var(--app-accent)] to-[#3b82f6] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-95">
            Tampilkan
          </button>
        </form>
      </div>

      <div className="glass-panel rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold tracking-tight text-[var(--app-text)]">Ringkasan Tahun {year}</h2>
        <p className="mt-1 text-sm font-medium text-[var(--app-text-muted)]">
          <span className="inline-flex items-center rounded-md bg-[var(--app-surface-2)] px-2 py-1 text-xs border border-[var(--app-border-soft)]">
            Total {groupedDays.length} Hari Terjadwal
          </span>
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-solid)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--app-border-soft)] text-sm">
              <thead className="bg-[var(--app-surface-2)]">
                <tr className="text-left text-[var(--app-text-muted)]">
                  <th className="px-4 py-3 font-semibold">Hari</th>
                  <th className="px-4 py-3 font-semibold">{assignmentLabels.TAKJIL_MUSHOLA}</th>
                  <th className="px-4 py-3 font-semibold">{assignmentLabels.SAHUR_SATPAM}</th>
                  <th className="px-4 py-3 font-semibold">{assignmentLabels.BUKA_SATPAM}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border-soft)] bg-[var(--app-surface-solid)]">
                {groupedDays.map((day) => (
                  <tr key={day.dayNumber} className="transition-colors hover:bg-[var(--app-surface-2)]">
                    <td className="px-4 py-3 font-bold text-[var(--app-text)]">Hari {day.dayNumber}</td>
                    <td className="px-4 py-3 text-[var(--app-text)] font-medium">
                      {day.assignments.TAKJIL_MUSHOLA ? (
                        <span className="inline-flex rounded-full bg-[var(--app-surface-2)] border border-[var(--app-border-soft)] px-2.5 py-1 text-xs">{day.assignments.TAKJIL_MUSHOLA}</span>
                      ) : <span className="text-[var(--app-text-muted)]">-</span>}
                    </td>
                    <td className="px-4 py-3 text-[var(--app-text)] font-medium">
                      {day.assignments.SAHUR_SATPAM ? (
                        <span className="inline-flex rounded-full bg-[var(--app-surface-2)] border border-[var(--app-border-soft)] px-2.5 py-1 text-xs">{day.assignments.SAHUR_SATPAM}</span>
                      ) : <span className="text-[var(--app-text-muted)]">-</span>}
                    </td>
                    <td className="px-4 py-3 text-[var(--app-text)] font-medium">
                      {day.assignments.BUKA_SATPAM ? (
                        <span className="inline-flex rounded-full bg-[var(--app-surface-2)] border border-[var(--app-border-soft)] px-2.5 py-1 text-xs">{day.assignments.BUKA_SATPAM}</span>
                      ) : <span className="text-[var(--app-text-muted)]">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {groupedDays.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--app-text-muted)]">
              Belum ada jadwal yang dipublish untuk tahun ini.
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-[var(--app-accent)] hover:text-[var(--app-accent-hover)] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6"/></svg>
          Kembali ke dashboard
        </Link>
      </div>
    </main>
  );
}
