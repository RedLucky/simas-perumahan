export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardTitle } from "@/components/ui/card";

function toCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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

function CollectionRing({ rate, size = 100 }: { rate: number; size?: number }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (rate / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--app-border-soft)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--app-accent)"
        strokeWidth={stroke}
        strokeDasharray={`${progress} ${circumference - progress}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap="round"
        className="transition-all duration-1000"
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-[var(--app-text)] text-xl font-black">
        {rate}%
      </text>
    </svg>
  );
}

export default async function PublicDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const year = new Date().getFullYear();
  const currentMonthKey = new Date().toISOString().slice(0, 7) + "-01";
  const monthLabel = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const startOfMonth = currentMonthKey;
  const endOfMonthDate = new Date(`${startOfMonth}T00:00:00Z`);
  endOfMonthDate.setUTCMonth(endOfMonthDate.getUTCMonth() + 1);
  endOfMonthDate.setUTCDate(0);
  const endOfMonth = endOfMonthDate.toISOString().slice(0, 10);

  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;

  const [
    { data: events },
    { data: publishedRamadan },
    { data: cashSummary },
    { data: arrearsRows },
    { data: duesRate },
    { data: recentAgendas },
    { data: recentExpenses },
    { data: satpamExpenses },
    { data: sampahExpenses },
    { data: kematianExpenses },
  ] = await Promise.all([
    supabase.from("incidental_events").select("id").eq("event_year", year).eq("is_active", true),
    supabase.from("ramadan_schedules").select("id").eq("ramadan_year", year).eq("is_published", true).limit(1),
    supabase
      .from("cash_summary")
      .select("total_monthly_dues, total_incidental_income, total_expenses, current_balance")
      .single(),
    supabase
      .from("monthly_dues_arrears_by_house")
      .select("house_id, code, display_name, arrears_balance, payment_status, order_number")
      .eq("month_key", currentMonthKey)
      .order("order_number", { ascending: true }),
    supabase
      .from("dues_rates")
      .select("amount, effective_month")
      .lte("effective_month", currentMonthKey)
      .order("effective_month", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("agenda_posts")
      .select("id, title, content, event_date, location, category")
      .eq("is_published", true)
      .order("event_date", { ascending: false })
      .limit(3),
    supabase
      .from("expenses")
      .select("id, category, amount, expense_date, note")
      .order("expense_date", { ascending: false })
      .limit(5),
    supabase
      .from("expenses")
      .select("amount")
      .in("category", ["GAJI_SATPAM_FULLTIME", "GAJI_SATPAM_MINGGU"])
      .gte("expense_date", startOfMonth)
      .lte("expense_date", endOfMonth),
    supabase
      .from("expenses")
      .select("amount")
      .eq("category", "GAJI_TUKANG_SAMPAH")
      .gte("expense_date", startOfMonth)
      .lte("expense_date", endOfMonth),
    supabase
      .from("expenses")
      .select("amount")
      .eq("category", "UANG_KEMATIAN")
      .gte("expense_date", startOfYear)
      .lte("expense_date", endOfYear),
  ]);

  const rows = arrearsRows ?? [];
  const totalHouses = rows.length;
  const paidHouses = rows.filter((r) => r.payment_status === "LUNAS").length;
  const partialHouses = rows.filter((r) => r.payment_status === "SEBAGIAN").length;
  const unpaidHouses = totalHouses - paidHouses - partialHouses;
  const totalArrears = rows.reduce((sum, r) => sum + Number(r.arrears_balance ?? 0), 0);
  const collectionRate = totalHouses > 0 ? Math.round(((paidHouses + partialHouses) / totalHouses) * 100) : 0;
  const currentRate = Number(duesRate?.amount ?? 0);

  const satpamTotal = (satpamExpenses ?? []).reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
  const sampahTotal = (sampahExpenses ?? []).reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
  const kematianTotal = (kematianExpenses ?? []).reduce((sum, r) => sum + Number(r.amount ?? 0), 0);

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:px-8 pt-8 space-y-6">
      
      {/* Header Section */}
      <div>
        <div className="inline-flex items-center rounded-full border border-[var(--app-accent-glow)] bg-[var(--app-accent-glow)] px-3 py-1 text-sm font-medium text-[var(--app-accent)] mb-4 shadow-sm backdrop-blur-md">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--app-accent)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--app-accent)]"></span>
          </span>
          Informasi Utama Warga
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gradient-accent mb-3">
          Status Perumahan Mastrip
        </h1>
        <p className="max-w-2xl text-base text-[var(--app-text-muted)]">
          Ringkasan kas, kepatuhan iuran bulanan, pengeluaran operasional terbaru, dan agenda rapat warga terdekat secara transparan.
        </p>
      </div>

      {/* Financial Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel rounded-2xl p-5 border-l-4 border-l-[var(--app-accent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--app-accent-glow)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--app-accent-glow)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--app-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">Saldo Kas</p>
          </div>
          <p className="text-2xl font-black text-[var(--app-accent)]">{toCurrency(Number(cashSummary?.current_balance ?? 0))}</p>
          <p className="mt-1 text-[10px] text-[var(--app-text-muted)]">Total kas bersih perumahan saat ini</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--app-accent-glow)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">Total Pemasukan</p>
          </div>
          <p className="text-2xl font-black text-[var(--app-text)]">
            {toCurrency(Number(cashSummary?.total_monthly_dues ?? 0) + Number(cashSummary?.total_incidental_income ?? 0))}
          </p>
          <p className="mt-1 text-[10px] text-[var(--app-text-muted)]">Iuran + insidental sepanjang waktu</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--app-accent-glow)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-rose-500"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">Total Pengeluaran</p>
          </div>
          <p className="text-2xl font-black text-[var(--app-text)]">{toCurrency(Number(cashSummary?.total_expenses ?? 0))}</p>
          <p className="mt-1 text-[10px] text-[var(--app-text-muted)]">Gaji, operasional, dan lainnya</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--app-accent-glow)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-500"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">Tarif Iuran</p>
          </div>
          <p className="text-2xl font-black text-[var(--app-text)]">{currentRate > 0 ? toCurrency(currentRate) : "-"}</p>
          <p className="mt-1 text-[10px] text-[var(--app-text-muted)]">Kewajiban per rumah/bulan</p>
        </div>
      </section>

      {/* Specialty Operational/Social Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="glass-panel rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-text-muted)]">Gaji Satpam ({monthLabel.split(" ")[0]})</p>
            <p className="text-lg font-black text-[var(--app-text)] mt-0.5">{toCurrency(satpamTotal)}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-teal-500/5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-text-muted)]">Gaji Kebersihan ({monthLabel.split(" ")[0]})</p>
            <p className="text-lg font-black text-[var(--app-text)] mt-0.5">{toCurrency(sampahTotal)}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-rose-500/5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-text-muted)]">Santunan Kematian ({year})</p>
            <p className="text-lg font-black text-[var(--app-text)] mt-0.5">{toCurrency(kematianTotal)}</p>
          </div>
        </div>
      </section>

      {/* Iuran Compliance Section */}
      <section className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--app-accent-glow)]">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <CollectionRing rate={collectionRate} size={110} />
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[var(--app-text)]">Kepatuhan Iuran — {monthLabel}</h2>
              <p className="text-sm text-[var(--app-text-muted)]">
                {paidHouses + partialHouses} dari {totalHouses} rumah telah berpartisipasi membayar iuran bulan ini.
              </p>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full bg-[var(--app-surface-2)] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[var(--app-accent)] to-[#3b82f6] transition-all duration-1000" style={{ width: `${collectionRate}%` }} />
            </div>
            {/* Mini Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <div className="text-lg font-black text-emerald-500">{paidHouses}</div>
                <div className="text-[10px] font-semibold text-emerald-600/80 uppercase">Lunas</div>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-2.5">
                <div className="text-lg font-black text-amber-500">{partialHouses}</div>
                <div className="text-[10px] font-semibold text-amber-600/80 uppercase">Sebagian</div>
              </div>
              <div className="rounded-xl bg-rose-500/10 p-2.5">
                <div className="text-lg font-black text-rose-500">{unpaidHouses}</div>
                <div className="text-[10px] font-semibold text-rose-600/80 uppercase">Tunggak</div>
              </div>
            </div>
          </div>
        </div>
        {totalArrears > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--app-border-soft)] flex items-center justify-between text-sm">
            <span className="text-[var(--app-text-muted)] font-medium">Total tunggakan iuran warga berjalan:</span>
            <span className="font-bold text-rose-500">{toCurrency(totalArrears)}</span>
          </div>
        )}
      </section>

      {/* Main Content: Recent Expenses & Agendas */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Left Column: Recent Expenses */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-[var(--app-text)] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-500"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
              Pengeluaran Terbaru
            </h2>
            <Link href="/keuangan" className="text-xs font-semibold text-[var(--app-accent)] hover:underline">
              Lihat Semua
            </Link>
          </div>
          
          <div className="glass-panel rounded-2xl overflow-hidden divide-y divide-[var(--app-border-soft)]">
            {(recentExpenses ?? []).map((exp) => (
              <div key={exp.id} className="p-4 flex justify-between items-start hover:bg-[var(--app-surface-2)] transition-colors">
                <div className="space-y-1 pr-2">
                  <span className="inline-flex rounded-full bg-[var(--app-surface-2)] border border-[var(--app-border-soft)] px-2 py-0.5 text-[9px] font-bold text-[var(--app-text-muted)]">
                    {CATEGORY_LABELS[exp.category] ?? exp.category}
                  </span>
                  <p className="text-xs text-[var(--app-text)] font-semibold leading-normal">
                    {exp.note || "Tanpa catatan"}
                  </p>
                  <p className="text-[10px] text-[var(--app-text-muted)]">
                    {formatDate(exp.expense_date)}
                  </p>
                </div>
                <span className="text-xs font-black text-rose-500 shrink-0">
                  {toCurrency(Number(exp.amount))}
                </span>
              </div>
            ))}
            {(!recentExpenses || recentExpenses.length === 0) && (
              <div className="p-8 text-center text-xs text-[var(--app-text-muted)]">
                Belum ada catatan pengeluaran.
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Upcoming Agendas */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-[var(--app-text)] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--app-accent)]"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              Agenda Kegiatan Warga
            </h2>
            <Link href="/agenda" className="text-xs font-semibold text-[var(--app-accent)] hover:underline">
              Lihat Semua
            </Link>
          </div>
          
          <div className="space-y-3">
            {(recentAgendas ?? []).map((agenda) => (
              <div key={agenda.id} className="glass-panel rounded-2xl p-4 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="rounded bg-[var(--app-accent-glow)] px-2 py-0.5 text-[9px] font-bold text-[var(--app-accent)] uppercase">
                      {agenda.category}
                    </span>
                    <span className="text-[10px] text-[var(--app-text-muted)] font-medium">
                      📅 {formatDate(agenda.event_date)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--app-text)] leading-snug">
                    {agenda.title}
                  </h3>
                  <p className="text-xs text-[var(--app-text-muted)] line-clamp-2 mt-1 leading-normal">
                    {agenda.content}
                  </p>
                </div>
                {agenda.location && (
                  <div className="mt-3 pt-2.5 border-t border-[var(--app-border-soft)] text-[10px] text-[var(--app-text-muted)] flex items-center gap-1.5">
                    <span>📍</span>
                    <span className="font-medium truncate">{agenda.location}</span>
                  </div>
                )}
              </div>
            ))}
            {(!recentAgendas || recentAgendas.length === 0) && (
              <div className="glass-panel rounded-2xl p-8 text-center text-xs text-[var(--app-text-muted)]">
                Belum ada agenda rapat atau kegiatan terdekat.
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Alerts / Info Banner */}
      <div className="space-y-3 pt-2">
        {(events?.length ?? 0) > 0 ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-3 backdrop-blur-sm">
            <span className="text-base">🔔</span> Ada kegiatan iuran insidental aktif tahun {year}. Silakan cek status iuran Anda di halaman terkait.
          </div>
        ) : null}

        {(publishedRamadan?.length ?? 0) > 0 ? (
          <div className="rounded-xl border border-[var(--app-accent-glow)] bg-[var(--app-accent-glow)] px-5 py-4 text-xs text-[var(--app-accent)] font-semibold flex items-center gap-3 backdrop-blur-sm">
            <span className="text-base">🌙</span> Jadwal takjil & sahur Ramadan tahun {year} sudah tersedia di halaman Ramadan.
          </div>
        ) : null}
      </div>
    </main>
  );
}
