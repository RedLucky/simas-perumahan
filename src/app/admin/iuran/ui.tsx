"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type House = { id: string; code: string; display_name: string };

type PaymentRow = {
  id: string;
  house_id?: string;
  month_key: string;
  paid_amount: number;
  paid_at: string;
  note: string | null;
  created_at: string;
  created_by_name_snapshot: string;
  houses: { code: string; display_name: string };
};

function toCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function monthInputFromDate(dateString: string) {
  return dateString.slice(0, 7);
}

export function IuranAdminClient({ initialHouses, initialHistory, initialMonthKey }: { initialHouses: House[]; initialHistory: PaymentRow[]; initialMonthKey: string }) {
  const [houses] = useState<House[]>(initialHouses);
  const [history, setHistory] = useState<PaymentRow[]>(initialHistory);
  const [monthFilter, setMonthFilter] = useState(monthInputFromDate(initialMonthKey));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [houseId, setHouseId] = useState(initialHouses[0]?.id ?? "");
  const [monthKey, setMonthKey] = useState(monthInputFromDate(initialMonthKey));
  const [paidAmount, setPaidAmount] = useState(0);
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedHouse = useMemo(() => houses.find((house) => house.id === houseId) ?? null, [houses, houseId]);

  async function loadHistory(month: string) {
    setLoadingHistory(true);
    setError(null);

    const response = await fetch(`/api/admin/iuran/history?month=${month}`, { cache: "no-store" });
    const json = await response.json();

    if (!response.ok || !json.ok) {
      setError(json.message ?? "Gagal memuat riwayat.");
      setLoadingHistory(false);
      return;
    }

    const rows: PaymentRow[] = (json.data.rows ?? []).map((row: PaymentRow & { houses: { code: string; display_name: string }[] }) => ({ ...row, houses: Array.isArray(row.houses) ? row.houses[0] : row.houses }));
    setHistory(rows);
    setLoadingHistory(false);
  }

  function resetForm() {
    setEditingId(null);
    setHouseId(initialHouses[0]?.id ?? "");
    setMonthKey(monthInputFromDate(initialMonthKey));
    setPaidAmount(0);
    setPaidAt(new Date().toISOString().slice(0, 10));
    setNote("");
  }

  function startEdit(row: PaymentRow) {
    setEditingId(row.id);
    const house = houses.find((h) => h.code === row.houses.code);
    if (house) setHouseId(house.id);
    setMonthKey(monthInputFromDate(row.month_key));
    setPaidAmount(Number(row.paid_amount));
    setPaidAt(row.paid_at);
    setNote(row.note ?? "");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    const method = editingId ? "PUT" : "POST";
    const response = await fetch("/api/admin/iuran/payment", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(editingId ? { id: editingId } : {}), houseId, monthKey: `${monthKey}-01`, paidAmount: Number(paidAmount), paidAt, note: note.trim() || undefined }),
    });

    const json = await response.json();
    setSubmitting(false);

    if (!response.ok || !json.ok) {
      setError(json.message ?? "Gagal menyimpan pembayaran.");
      return;
    }

    const computed = json.data.computed;
    setMessage(`${editingId ? "Perubahan tersimpan" : "Tersimpan"}. Status: ${computed.status}, Tunggakan baru: ${toCurrency(Number(computed.newArrears))}`);

    resetForm();
    setMonthFilter(monthKey);
    await loadHistory(monthKey);
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardTitle>{editingId ? "Edit Pembayaran" : "Form Pembayaran"}</CardTitle>

        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium">Rumah</label>
            <Select required value={houseId} onChange={(e) => setHouseId(e.target.value)}>
              {houses.map((house) => <option key={house.id} value={house.id}>{house.code} - {house.display_name}</option>)}
            </Select>
          </div>

          <Input type="month" required value={monthKey} onChange={(e) => setMonthKey(e.target.value)} />
          <Input type="number" min={0} step={1000} required value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} />
          <Input type="date" required value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || !houseId}>{submitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Pembayaran"}</Button>
            {editingId ? <Button type="button" variant="outline" onClick={resetForm}>Batal</Button> : null}
          </div>
        </form>

        {selectedHouse ? <p className="mt-3 text-xs text-zinc-500">Rumah dipilih: {selectedHouse.code}</p> : null}
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>

      <Card className="lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Riwayat Pembayaran</CardTitle>
          <div className="flex items-center gap-2">
            <Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="w-auto" />
            <Button type="button" variant="outline" onClick={() => void loadHistory(monthFilter)} disabled={loadingHistory}>{loadingHistory ? "Memuat..." : "Terapkan"}</Button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead><tr className="text-left text-zinc-600"><th className="px-2 py-2 font-medium">Rumah</th><th className="px-2 py-2 font-medium">Tanggal</th><th className="px-2 py-2 font-medium">Nominal</th><th className="px-2 py-2 font-medium">Ketua</th><th className="px-2 py-2 font-medium">Catatan</th><th className="px-2 py-2 font-medium">Aksi</th></tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {history.map((row) => (
                <tr key={row.id}>
                  <td className="px-2 py-2">{row.houses.code}</td>
                  <td className="px-2 py-2">{row.paid_at}</td>
                  <td className="px-2 py-2">{toCurrency(Number(row.paid_amount))}</td>
                  <td className="px-2 py-2">{row.created_by_name_snapshot}</td>
                  <td className="px-2 py-2">{row.note ?? "-"}</td>
                  <td className="px-2 py-2"><Button type="button" variant="outline" onClick={() => startEdit(row)}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loadingHistory && history.length === 0 ? <p className="px-2 py-4 text-sm text-zinc-500">Belum ada pembayaran untuk bulan ini.</p> : null}
        </div>
      </Card>
    </section>
  );
}
