"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import type { AdminProfile } from "@/lib/services/admin-profiles";

export function PengurusAdminClient({
  initialProfiles,
  currentUserId,
}: {
  initialProfiles: AdminProfile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<AdminProfile[]>(initialProfiles);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handover Self-Deactivation Warning Modal State
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingHandoverProfile, setPendingHandoverProfile] = useState<AdminProfile | null>(null);

  async function loadProfiles() {
    try {
      const response = await fetch("/api/admin/pengurus", { cache: "no-store" });
      const json = await response.json();
      if (response.ok && json.ok) {
        setProfiles(json.data.rows ?? []);
      }
    } catch (err) {
      console.error("Gagal merefresh daftar pengurus:", err);
    }
  }

  async function onSubmitNewPengurus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/pengurus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone: phone.trim() || undefined,
          periodLabel,
        }),
      });

      const json = await response.json();
      setSubmitting(false);

      if (!response.ok || !json.ok) {
        setError(json.message ?? "Gagal mendaftarkan pengurus baru.");
        return;
      }

      setMessage(`Pengurus baru "${fullName}" berhasil didaftarkan dan diaktifkan.`);
      // Reset form
      setEmail("");
      setPassword("");
      setFullName("");
      setPhone("");
      setPeriodLabel("");

      await loadProfiles();
      router.refresh();
    } catch {
      setSubmitting(false);
      setError("Terjadi kesalahan koneksi internet.");
    }
  }

  async function handleToggleStatus(profile: AdminProfile) {
    // Jika menonaktifkan dirinya sendiri, tampilkan modal bahaya
    if (profile.user_id === currentUserId && profile.is_active) {
      setPendingHandoverProfile(profile);
      setShowWarningModal(true);
      return;
    }

    await executeToggleStatus(profile.id, !profile.is_active);
  }

  async function executeToggleStatus(id: string, nextActiveState: boolean) {
    setUpdatingId(id);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/pengurus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          isActive: nextActiveState,
        }),
      });

      const json = await response.json();
      setUpdatingId(null);

      if (!response.ok || !json.ok) {
        setError(json.message ?? "Gagal memperbarui status pengurus.");
        return;
      }

      setMessage(
        nextActiveState
          ? "Akun pengurus berhasil diaktifkan kembali."
          : "Akun pengurus berhasil dinonaktifkan."
      );

      // Jika kita baru saja menonaktifkan akun sendiri, redirect keluar karena hak akses sudah hilang
      if (pendingHandoverProfile && pendingHandoverProfile.user_id === currentUserId && !nextActiveState) {
        setShowWarningModal(false);
        setPendingHandoverProfile(null);
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      await loadProfiles();
      router.refresh();
    } catch {
      setUpdatingId(null);
      setError("Gagal mengubah status pengurus.");
    }
  }

  return (
    <>
      <SectionHeader
        title="Kelola Pengurus Perumahan"
        subtitle="Daftarkan pengurus baru atau lakukan serah terima jabatan (handover) kepengurusan secara aman."
      />

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        {/* Kolom Kiri: Riwayat & Status Pengurus */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <CardTitle className="text-gradient">Daftar & Riwayat Pengurus</CardTitle>
            <p className="text-xs text-[var(--app-text-muted)] mt-1">
              Daftar pengurus perumahan yang memiliki hak akses pencatatan kas & iuran SiMas.
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead>
                  <tr className="text-left text-zinc-500 border-b border-zinc-200">
                    <th className="px-3 py-3 font-semibold">Nama Pengurus</th>
                    <th className="px-3 py-3 font-semibold">Periode</th>
                    <th className="px-3 py-3 font-semibold">No. HP</th>
                    <th className="px-3 py-3 font-semibold text-center">Status</th>
                    <th className="px-3 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {profiles.map((p) => {
                    const isSelf = p.user_id === currentUserId;
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-3 py-4">
                          <div className="font-bold text-[var(--app-text)] flex items-center gap-1.5">
                            {p.full_name}
                            {isSelf && (
                              <span className="rounded-full bg-[var(--app-accent-glow)] border border-[var(--app-accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-accent)]">
                                Anda
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-zinc-600 font-medium">{p.period_label}</td>
                        <td className="px-3 py-4 text-zinc-600 font-medium">{p.phone ?? "-"}</td>
                        <td className="px-3 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                              p.is_active
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
                            }`}
                          >
                            {p.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-right">
                          <Button
                            type="button"
                            variant={p.is_active ? "outline" : "primary"}
                            className="px-3 py-1.5 text-xs rounded-lg"
                            disabled={updatingId !== null}
                            onClick={() => void handleToggleStatus(p)}
                          >
                            {updatingId === p.id
                              ? "Memproses..."
                              : p.is_active
                              ? "Nonaktifkan"
                              : "Aktifkan"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-[var(--app-border-soft)]">
            {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
            {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
          </div>
        </Card>

        {/* Kolom Kanan: Form Pengurus Baru */}
        <Card className="lg:col-span-1">
          <CardTitle className="text-gradient">Registrasi Pengurus Baru</CardTitle>
          <p className="text-xs text-[var(--app-text-muted)] mt-1">
            Buat akun login baru untuk calon pengurus perumahan berikutnya.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmitNewPengurus}>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--app-text-muted)]" htmlFor="email">
                Email Baru
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@mastrip.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--app-text-muted)]" htmlFor="password">
                Password Awal
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--app-text-muted)]" htmlFor="fullName">
                Nama Lengkap Pengurus
              </label>
              <Input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama Lengkap Pengurus"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--app-text-muted)]" htmlFor="phone">
                Nomor Handphone (Optional)
              </label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxx"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--app-text-muted)]" htmlFor="periodLabel">
                Periode Jabatan
              </label>
              <Input
                id="periodLabel"
                type="text"
                required
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="Contoh: Periode 2026-2028"
              />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={submitting}>
              {submitting ? "Mendaftarkan..." : "Daftarkan Pengurus Baru"}
            </Button>
          </form>
        </Card>
      </div>

      {/* Modal Peringatan Serah Terima Jabatan */}
      {showWarningModal && pendingHandoverProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border border-red-100 p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3.5 text-rose-500">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 shadow-sm shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-950">Konfirmasi Serah Terima Jabatan</h3>
                <p className="text-xs text-rose-700/80">Tindakan berisiko tinggi.</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed">
              Anda sedang mencoba **menonaktifkan akun Anda sendiri**. Setelah tindakan ini dilakukan:
            </p>
            <ul className="text-xs text-zinc-500 space-y-2 list-disc list-inside bg-zinc-50 border border-zinc-100 rounded-2xl p-4">
              <li>Anda akan kehilangan hak akses admin **seketika**.</li>
              <li>Sistem akan mengeluarkan Anda secara otomatis dari modul admin dan mengarahkan kembali ke dasbor publik warga.</li>
              <li>Tindakan ini **tidak bisa dibatalkan** kecuali melalui bantuan administrator database utama Supabase.</li>
            </ul>
            <p className="text-xs font-semibold text-rose-600 bg-rose-50/50 border border-rose-100 rounded-xl p-3">
              ⚠️ PASTIKAN pengurus perumahan baru sudah memegang akun email dan password-nya untuk login berikutnya!
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowWarningModal(false);
                  setPendingHandoverProfile(null);
                }}
              >
                Batal
              </Button>
              <Button
                type="button"
                className="bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-md shadow-rose-200"
                onClick={() => void executeToggleStatus(pendingHandoverProfile.id, false)}
              >
                Ya, Serahkan Jabatan
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
