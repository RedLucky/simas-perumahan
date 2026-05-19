export const dynamic = "force-dynamic";

import Link from "next/link";
import { LaporanClient } from "./ui";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";

export default function PublicLaporanPage() {
  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:px-8 pt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient-accent">Laporan Warga</h1>
        <p className="mt-2 text-base text-[var(--app-text-muted)]">Preview dan unduh laporan keuangan resmi RT.</p>
      </div>
      <LaporanClient />
      <div className="mt-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-[var(--app-accent)] hover:text-[var(--app-accent-hover)] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6"/></svg>
          Kembali ke dashboard
        </Link>
      </div>
    </main>
  );
}
