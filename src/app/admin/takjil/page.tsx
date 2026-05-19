export const dynamic = "force-dynamic";

import { TakjilAdminClient } from "./ui";

export default function AdminTakjilPage() {
  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Kelola Jadwal Takjil Ramadan</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Generate draft jadwal, edit assignment per hari, lalu publish untuk ditampilkan ke warga.
      </p>
      <TakjilAdminClient />
    </main>
  );
}
