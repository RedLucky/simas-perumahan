"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import type { HouseWithContact } from "@/lib/services/houses";

export function RumahAdminClient({ initialHouses }: { initialHouses: HouseWithContact[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [houses, setHouses] = useState<HouseWithContact[]>(initialHouses);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "FILLED" | "EMPTY">("ALL");

  // Edit Modal State
  const [editingHouse, setEditingHouse] = useState<HouseWithContact | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stats Calculations
  const totalHouses = houses.length;
  const filledHouses = houses.filter((h) => h.contact_name || h.contact_phone).length;
  const emptyHouses = totalHouses - filledHouses;
  const completionRate = totalHouses > 0 ? Math.round((filledHouses / totalHouses) * 100) : 0;

  // Filter & Search Logic
  const filteredHouses = houses.filter((h) => {
    const matchesSearch =
      h.code.toLowerCase().includes(search.toLowerCase()) ||
      h.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (h.contact_name && h.contact_name.toLowerCase().includes(search.toLowerCase())) ||
      (h.contact_phone && h.contact_phone.includes(search));

    if (filterType === "FILLED") {
      return matchesSearch && (h.contact_name || h.contact_phone);
    }
    if (filterType === "EMPTY") {
      return matchesSearch && !h.contact_name && !h.contact_phone;
    }
    return matchesSearch;
  });

  async function refreshData() {
    try {
      const res = await fetch("/api/admin/rumah", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.ok) {
        setHouses(json.data.rows ?? []);
      }
    } catch (err) {
      console.error("Gagal memuat ulang data rumah:", err);
    }
  }

  function handleOpenEdit(house: HouseWithContact) {
    setEditingHouse(house);
    setContactName(house.contact_name ?? "");
    setContactPhone(house.contact_phone ?? "");
    setMessage(null);
    setError(null);
  }

  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    if (!editingHouse) return;

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/rumah", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingHouse.id,
          contactName: contactName.trim() || null,
          contactPhone: contactPhone.trim() || null,
        }),
      });

      const json = await response.json();
      setSubmitting(false);

      if (!response.ok || !json.ok) {
        if (json.errors) {
          const errorsMap = json.errors.fieldErrors || json.errors;
          const validationError = Object.values(errorsMap).flat().join(", ");
          setError(validationError || "Validasi gagal.");
        } else {
          setError(json.message ?? "Gagal menyimpan kontak.");
        }
        return;
      }

      // Success
      setMessage("Kontak rumah berhasil diperbarui.");
      setTimeout(() => {
        setEditingHouse(null);
      }, 1000);

      // Refresh listings in-place and trigger next router refresh
      await refreshData();
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setSubmitting(false);
      setError("Koneksi internet bermasalah.");
    }
  }

  function getWhatsAppLink(phone: string) {
    let cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    return `https://wa.me/${cleaned}`;
  }

  return (
    <>
      <SectionHeader
        title="Kelola Data & Kontak Rumah"
        subtitle="Manajemen data rumah warga, nama kontak pemilik, serta nomor telepon darurat pengurus secara aman."
      />

      {/* Bento Grid Statistik Kontak */}
      <div className="grid gap-6 md:grid-cols-4 mt-6">
        {/* Card 1: Total Rumah */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-5 text-neutral-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--app-text-muted)] tracking-wider uppercase">
              Total Rumah Terdaftar
            </span>
            <h2 className="text-3xl font-black mt-2 text-gradient">
              {totalHouses} <span className="text-sm font-medium text-[var(--app-text-muted)]">Rumah</span>
            </h2>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--app-border-soft)]">
            <span className="text-xs text-[var(--app-text-muted)]">
              Seluruh unit kavling Mastrip Residence.
            </span>
          </div>
        </div>

        {/* Card 2: Kontak Terisi */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-5 text-neutral-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--app-text-muted)] tracking-wider uppercase">
              Kontak Teridentifikasi
            </span>
            <h2 className="text-3xl font-black mt-2 text-emerald-500">
              {filledHouses} <span className="text-sm font-medium text-[var(--app-text-muted)]">Rumah</span>
            </h2>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--app-border-soft)]">
            <span className="text-xs text-[var(--app-text-muted)]">
              Sudah memiliki nama atau nomor HP.
            </span>
          </div>
        </div>

        {/* Card 3: Belum Ada Kontak */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-5 text-neutral-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--app-text-muted)] tracking-wider uppercase">
              Kontak Belum Lengkap
            </span>
            <h2 className="text-3xl font-black mt-2 text-rose-500">
              {emptyHouses} <span className="text-sm font-medium text-[var(--app-text-muted)]">Rumah</span>
            </h2>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--app-border-soft)]">
            <span className="text-xs text-[var(--app-text-muted)]">
              Kavling kosong atau belum diisi.
            </span>
          </div>
        </div>

        {/* Card 4: Persentase Kelengkapan */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-5 text-neutral-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m8 11.5 3 3 5-5"/></svg>
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--app-text-muted)] tracking-wider uppercase">
              Rasio Kelengkapan Data
            </span>
            <h2 className="text-3xl font-black mt-2 text-gradient-accent">
              {completionRate}%
            </h2>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--app-border-soft)]">
            <div className="h-2 w-full bg-[var(--app-surface-2)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--app-accent)] to-[#3b82f6] rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Kontrol Pencarian & Filter */}
      <div className="glass-panel rounded-3xl p-5 mt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[var(--app-text-muted)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <Input
            type="text"
            className="pl-11 pr-4 bg-[var(--app-surface-2)] border-0 placeholder:text-[var(--app-text-muted)] h-11"
            placeholder="Cari kode rumah, nama pemilik, nomor HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <Button
            type="button"
            variant={filterType === "ALL" ? "primary" : "outline"}
            className="px-4 py-2 h-10 text-xs rounded-xl"
            onClick={() => setFilterType("ALL")}
          >
            Semua
          </Button>
          <Button
            type="button"
            variant={filterType === "FILLED" ? "primary" : "outline"}
            className="px-4 py-2 h-10 text-xs rounded-xl"
            onClick={() => setFilterType("FILLED")}
          >
            Terisi ({filledHouses})
          </Button>
          <Button
            type="button"
            variant={filterType === "EMPTY" ? "primary" : "outline"}
            className="px-4 py-2 h-10 text-xs rounded-xl"
            onClick={() => setFilterType("EMPTY")}
          >
            Kosong ({emptyHouses})
          </Button>
        </div>
      </div>

      {/* Grid Rumah */}
      {filteredHouses.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center mt-6 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--app-surface-2)] mx-auto text-[var(--app-text-muted)] border border-[var(--app-border-soft)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[var(--app-text)]">Rumah tidak ditemukan</h4>
            <p className="text-xs text-[var(--app-text-muted)] max-w-sm mx-auto">
              Tidak ada rumah yang cocok dengan kriteria pencarian atau filter yang Anda pilih.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-6">
          {filteredHouses.map((house) => {
            return (
              <Card key={house.id} className="flex flex-col justify-between border-[var(--app-border-soft)] relative overflow-hidden group">
                <div className="space-y-4">
                  {/* Header Rumah */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--app-accent-glow)] text-[var(--app-accent)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      </div>
                      <span className="font-black text-sm text-[var(--app-text)]">{house.code}</span>
                    </div>
                    <Badge variant={house.is_active ? "success" : "default"} className="text-[10px] px-1.5 py-0">
                      {house.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>

                  {/* Info Rumah & Detail Kontak */}
                  <div>
                    <h3 className="font-bold text-xs text-[var(--app-text-muted)]">{house.display_name}</h3>
                    
                    <div className="mt-3 bg-[var(--app-surface-2)] border border-[var(--app-border-soft)] rounded-xl p-3 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-[var(--app-text-muted)] uppercase tracking-wider block">Pemilik/Kontak</span>
                        <span className={`font-semibold ${house.contact_name ? "text-[var(--app-text)]" : "text-[var(--app-text-muted)] italic"}`}>
                          {house.contact_name ?? "—"}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-[10px] font-bold text-[var(--app-text-muted)] uppercase tracking-wider block">No. Telepon</span>
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${house.contact_phone ? "text-[var(--app-text)] font-mono" : "text-[var(--app-text-muted)] italic"}`}>
                            {house.contact_phone ?? "—"}
                          </span>
                          
                          {house.contact_phone && (
                            <a
                              href={getWhatsAppLink(house.contact_phone)}
                              target="_blank"
                              rel="noreferrer"
                              title="Hubungi via WhatsApp"
                              className="text-emerald-500 hover:text-emerald-600 p-1 hover:bg-emerald-500/10 rounded transition-colors shrink-0"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--app-border-soft)]">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-xs h-9 rounded-xl flex items-center gap-1.5"
                    onClick={() => handleOpenEdit(house)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    Edit Kontak
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Edit Glassmorphic */}
      {editingHouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[var(--app-surface-solid)] border border-[var(--app-border-soft)] p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--app-border-soft)] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-accent-glow)] text-[var(--app-accent)] border border-[var(--app-accent-glow)] shadow-sm shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--app-text)]">Edit Kontak Rumah</h3>
                  <p className="text-xs text-[var(--app-text-muted)]">Kavling perumahan {editingHouse.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingHouse(null)}
                className="text-[var(--app-text-muted)] hover:text-[var(--app-text)] p-1 hover:bg-[var(--app-surface-2)] rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={(e) => void handleSaveContact(e)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--app-text-muted)]" htmlFor="contactName">
                  Nama Pemilik / Penghuni
                </label>
                <Input
                  id="contactName"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Contoh: Bpk. Budi Santoso"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--app-text-muted)]" htmlFor="contactPhone">
                  Nomor HP / WhatsApp
                </label>
                <Input
                  id="contactPhone"
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                />
                <span className="text-[10px] text-[var(--app-text-muted)] mt-1 block">
                  Kosongkan jika rumah kosong / tidak berpenghuni.
                </span>
              </div>

              {/* Status Messages */}
              {message && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-semibold animate-pulse">
                  {message}
                </div>
              )}
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--app-border-soft)]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingHouse(null)}
                  disabled={submitting}
                  className="rounded-xl h-10 px-4 py-2 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl h-10 px-5 py-2 text-xs flex items-center gap-1.5"
                >
                  {submitting ? "Menyimpan..." : "Simpan Kontak"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
