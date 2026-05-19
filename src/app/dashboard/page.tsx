export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default async function PublicDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const year = new Date().getFullYear();

  const [{ data: events }, { data: publishedRamadan }] = await Promise.all([
    supabase.from("incidental_events").select("id").eq("event_year", year).eq("is_active", true),
    supabase.from("ramadan_schedules").select("id").eq("ramadan_year", year).eq("is_published", true).limit(1),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:px-8 pt-8">
      
      {/* Header Section */}
      <div className="mb-8">
        <div className="inline-flex items-center rounded-full border border-[var(--app-accent-glow)] bg-[var(--app-accent-glow)] px-3 py-1 text-sm font-medium text-[var(--app-accent)] mb-4 shadow-sm backdrop-blur-md">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--app-accent)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--app-accent)]"></span>
          </span>
          Sistem Informasi Mastrip
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gradient-accent mb-4">
          Selamat Datang, Warga.
        </h1>
        <p className="max-w-2xl text-base sm:text-lg text-[var(--app-text-muted)]">
          Akses status iuran, kas perumahan, agenda warga, dan jadwal takjil dalam satu platform terpadu yang ringkas dan transparan.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-min">
        
        {/* Main Action Card */}
        <Card className="md:col-span-2 row-span-2 flex flex-col justify-between bg-gradient-to-br from-[var(--app-surface-solid)] to-[var(--app-surface-2)] border-[var(--app-accent-glow)]">
          <div>
            <CardTitle className="text-2xl mb-2">Akses Cepat</CardTitle>
            <p className="text-[var(--app-text-muted)] mb-6">Pilih menu di bawah untuk melihat laporan keuangan dan jadwal kegiatan terkini.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/iuran"><Button className="w-full sm:w-auto shadow-[0_4px_14px_0_var(--app-accent-glow)]">Cek Status Iuran</Button></Link>
            <Link href="/keuangan"><Button variant="outline" className="w-full sm:w-auto">Laporan Keuangan</Button></Link>
            <Link href="/agenda"><Button variant="outline" className="w-full sm:w-auto">Agenda Warga</Button></Link>
            <Link href="/login"><Button variant="ghost" className="w-full sm:w-auto border border-dashed border-[var(--app-border)] hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-glow)] hover:text-[var(--app-accent)]">Portal Pengurus</Button></Link>
          </div>
        </Card>

        {/* Status Card 1 */}
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--app-accent-glow)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardTitle className="mb-4 relative z-10">Event Insidental</CardTitle>
          <div className="rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-2)] p-4 relative z-10 transition-transform group-hover:scale-[1.02]">
            <p className="text-sm text-[var(--app-text-muted)] mb-1">Status Tahun Ini</p>
            <p className="text-xl font-bold text-[var(--app-text)]">
              {(events?.length ?? 0) > 0 ? "🟢 Aktif" : "⚪ Tidak aktif"}
            </p>
          </div>
        </Card>

        {/* Status Card 2 */}
        <Card className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f620] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardTitle className="mb-4 relative z-10">Jadwal Takjil</CardTitle>
          <div className="rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-2)] p-4 relative z-10 transition-transform group-hover:scale-[1.02]">
            <p className="text-sm text-[var(--app-text-muted)] mb-1">Ramadan {year}</p>
            <p className="text-xl font-bold text-[var(--app-text)]">
              {(publishedRamadan?.length ?? 0) > 0 ? "✨ Tersedia" : "⏳ Belum Rilis"}
            </p>
          </div>
        </Card>

      </section>

      {/* Secondary Links Section */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardLink href="/insidental" title="Iuran Insidental" subtitle="Status event tahunan" icon="◎" />
        <DashboardLink href="/jadwal-takjil" title="Jadwal Takjil" subtitle="Jadwal resmi Ramadan" icon="🌙" />
        <DashboardLink href="/laporan" title="Laporan & Ekspor" subtitle="Preview + PDF/Excel" icon="📊" />
      </section>

      {/* Alerts */}
      <div className="mt-8 space-y-3">
        {(events?.length ?? 0) > 0 ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-3 backdrop-blur-sm">
            <span className="text-lg">🔔</span> Ada event iuran insidental aktif tahun {year}. Cek detail status pembayaran warga.
          </div>
        ) : null}

        {(publishedRamadan?.length ?? 0) > 0 ? (
          <div className="rounded-xl border border-[var(--app-accent-glow)] bg-[var(--app-accent-glow)] px-5 py-4 text-sm text-[var(--app-accent)] font-medium flex items-center gap-3 backdrop-blur-sm">
            <span className="text-lg">✨</span> Jadwal takjil Ramadan tahun {year} sudah tersedia.
          </div>
        ) : null}
      </div>
    </main>
  );
}

function DashboardLink({ href, title, subtitle, icon }: { href: string; title: string; subtitle: string; icon?: string }) {
  return (
    <Link 
      href={href} 
      className="group glass-panel rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--app-accent-glow)] hover:border-[var(--app-accent)] flex items-center gap-4"
    >
      {icon && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--app-surface-2)] text-2xl transition-transform group-hover:scale-110 group-hover:bg-[var(--app-accent-glow)] group-hover:text-[var(--app-accent)]">
          {icon}
        </div>
      )}
      <div>
        <h2 className="text-base font-bold tracking-tight text-[var(--app-text)] group-hover:text-[var(--app-accent)] transition-colors">{title}</h2>
        <p className="mt-1 text-sm text-[var(--app-text-muted)]">{subtitle}</p>
      </div>
    </Link>
  );
}
