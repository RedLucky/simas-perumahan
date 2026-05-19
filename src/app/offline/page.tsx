export const dynamic = "force-dynamic";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center p-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Koneksi Tidak Tersedia</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Anda sedang offline. Silakan cek koneksi internet lalu muat ulang halaman.
        </p>
      </div>
    </main>
  );
}
