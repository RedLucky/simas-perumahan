export const dynamic = "force-dynamic";

import Link from "next/link";
import { StaffPaymentWidget } from "@/components/staff-payment-widget";
import { SectionHeader } from "@/components/ui/section-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMonthlyRecap, getArrearsReport } from "@/lib/services/reports";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Fetch summary data
  const [recap, arrears] = await Promise.all([
    getMonthlyRecap(supabase, currentMonth).catch(() => null),
    getArrearsReport(supabase, currentMonth).catch(() => null),
  ]);

  const formatIdr = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Calculate dues statistics
  const totalHouses = arrears?.rows?.length ?? 0;
  const paidHouses = arrears?.rows?.filter((r) => r.paymentStatus === "LUNAS").length ?? 0;
  const partialHouses = arrears?.rows?.filter((r) => r.paymentStatus === "SEBAGIAN").length ?? 0;
  const unpaidHouses = totalHouses - paidHouses - partialHouses;

  const quickActions = [
    {
      title: "Kelola Iuran",
      description: "Catat iuran bulanan warga & atur tarif bulanan.",
      href: "/admin/iuran",
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-500 hover:shadow-emerald-500/10",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M6 14h.01"/><path d="M10 14h.01"/></svg>
      ),
    },
    {
      title: "Kelola Kas & Pengeluaran",
      description: "Catat pengeluaran operasional & kebutuhan warga.",
      href: "/admin/pengeluaran",
      color: "from-blue-500/20 to-cyan-500/20 text-blue-500 hover:shadow-blue-500/10",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
      ),
    },
    {
      title: "Agenda Kegiatan",
      description: "Publikasikan jadwal rapat atau kerja bakti perumahan.",
      href: "/admin/agenda",
      color: "from-amber-500/20 to-orange-500/20 text-amber-500 hover:shadow-amber-500/10",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
      ),
    },
    {
      title: "Jadwal Takjil",
      description: "Atur pembagian jadwal takjil warga selama Ramadan.",
      href: "/admin/takjil",
      color: "from-indigo-500/20 to-purple-500/20 text-indigo-500 hover:shadow-indigo-500/10",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      ),
    },
    {
      title: "Laporan Keuangan",
      description: "Ekspor rekapitulasi PDF & Excel resmi perumahan.",
      href: "/admin/laporan",
      color: "from-violet-500/20 to-fuchsia-500/20 text-violet-500 hover:shadow-violet-500/10",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>
      ),
    },
    {
      title: "Kegiatan Insidental",
      description: "Kelola kas event khusus seperti 17 Agustusan.",
      href: "/admin/insidental",
      color: "from-rose-500/20 to-red-500/20 text-rose-500 hover:shadow-rose-500/10",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2.5 3.19-2.5 5.5s1 4.24 2.5 5.5M19.5 16.5c1.5 1.26 2.5 3.19 2.5 5.5s-1 4.24-2.5 5.5"/><circle cx="12" cy="12" r="10"/><path d="m12 8-4 4h8z"/></svg>
      ),
    },
    {
      title: "Kelola Pengurus",
      description: "Tambah pengurus baru & lakukan serah terima jabatan.",
      href: "/admin/pengurus",
      color: "from-zinc-500/20 to-neutral-500/20 text-zinc-500 hover:shadow-zinc-500/10",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      ),
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 space-y-6">
      <SectionHeader
        title="Admin Dasbor SiMas"
        subtitle="Panel kontrol operasional terintegrasi pengurus perumahan."
      />

      {/* Bento Grid Keuangan */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Saldo Kas */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg hover:shadow-[var(--app-accent-glow)] transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-5 text-neutral-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--app-text-muted)] tracking-wider uppercase">
              Total Kas Aktif Perumahan
            </span>
            <h2 className="text-3xl font-black mt-2 text-gradient">
              {formatIdr(recap?.endingBalance ?? 0)}
            </h2>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--app-border-soft)]">
            <span className="text-xs text-[var(--app-text-muted)]">
              Akumulasi saldo kas bersih real-time.
            </span>
          </div>
        </div>

        {/* Card 2: Arus Keuangan Bulan Ini */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg hover:shadow-[var(--app-accent-glow)] transition-all">
          <div>
            <span className="text-xs font-semibold text-[var(--app-text-muted)] tracking-wider uppercase">
              Arus Kas Bulan Ini
            </span>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-500 font-medium flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                  Pemasukan
                </span>
                <span className="font-bold text-[var(--app-text)]">
                  {formatIdr(recap?.income?.total ?? 0)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-rose-500 font-medium flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
                  Pengeluaran
                </span>
                <span className="font-bold text-[var(--app-text)]">
                  {formatIdr(recap?.expenses?.total ?? 0)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--app-border-soft)]">
            <span className="text-xs text-[var(--app-text-muted)] flex justify-between">
              <span>Selisih Bersih:</span>
              <span className="font-semibold text-[var(--app-text)]">
                {formatIdr((recap?.income?.total ?? 0) - (recap?.expenses?.total ?? 0))}
              </span>
            </span>
          </div>
        </div>

        {/* Card 3: Status Iuran Rumah */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg hover:shadow-[var(--app-accent-glow)] transition-all">
          <div>
            <span className="text-xs font-semibold text-[var(--app-text-muted)] tracking-wider uppercase">
              Kepatuhan Iuran Rumah
            </span>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-500/10 rounded-2xl p-2">
                <div className="text-lg font-black text-emerald-500">{paidHouses}</div>
                <div className="text-[10px] font-semibold text-emerald-600/80 uppercase">Lunas</div>
              </div>
              <div className="bg-amber-500/10 rounded-2xl p-2">
                <div className="text-lg font-black text-amber-500">{partialHouses}</div>
                <div className="text-[10px] font-semibold text-amber-600/80 uppercase">Sebagian</div>
              </div>
              <div className="bg-rose-500/10 rounded-2xl p-2">
                <div className="text-lg font-black text-rose-500">{unpaidHouses}</div>
                <div className="text-[10px] font-semibold text-rose-600/80 uppercase">Tunggak</div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--app-border-soft)] flex justify-between items-center text-xs text-[var(--app-text-muted)]">
            <span>Partisipasi warga bulan ini</span>
            <span className="font-bold text-[var(--app-text)]">
              {totalHouses > 0 ? Math.round(((paidHouses + partialHouses) / totalHouses) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Grid Pintasan & Gaji */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kolom Kiri: Pintasan Cepat (Quick Actions) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold tracking-tight text-[var(--app-text)] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--app-accent)]"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            Kelola Modul & Operasional
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickActions.map((action, idx) => (
              <Link
                key={idx}
                href={action.href}
                className="glass-panel group rounded-3xl p-5 flex gap-4 transition-all duration-300 hover:shadow-md hover:scale-[1.01]"
              >
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105`}>
                  {action.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[var(--app-text)] group-hover:text-[var(--app-accent)] transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-xs text-[var(--app-text-muted)] leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Kolom Kanan: Siklus Gaji Petugas */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold tracking-tight text-[var(--app-text)] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--app-accent)]"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Operasional Keamanan & Kebersihan
          </h3>
          <div className="glass-panel rounded-3xl p-6 hover:shadow-lg hover:shadow-[var(--app-accent-glow)] transition-all">
            <StaffPaymentWidget />
          </div>
        </div>
      </div>
    </main>
  );
}
