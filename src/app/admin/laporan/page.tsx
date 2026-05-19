export const dynamic = "force-dynamic";

import { LaporanClient } from "@/app/laporan/ui";
import { SectionHeader } from "@/components/ui/section-header";

export default function AdminLaporanPage() {
  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <SectionHeader title="Laporan Admin" subtitle="Preview laporan operasional dan export PDF/Excel." />
      <LaporanClient adminMode />
    </main>
  );
}
