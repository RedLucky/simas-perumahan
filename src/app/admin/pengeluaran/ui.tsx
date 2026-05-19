"use client";

import { useMemo, useState } from "react";
import { expenseCategoryValues } from "@/lib/validators/expenses";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ExpenseCategory = (typeof expenseCategoryValues)[number];

type ExpenseRow = {
  id: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  note: string | null;
  created_at: string;
  created_by_name_snapshot: string;
};

const categoryLabels: Record<ExpenseCategory, string> = {
  GAJI_SATPAM_FULLTIME: "Gaji Satpam Fulltime",
  GAJI_SATPAM_MINGGU: "Gaji Satpam Minggu",
  GAJI_TUKANG_SAMPAH: "Gaji Tukang Sampah",
  THR_SATPAM: "THR Satpam",
  THR_TUKANG_SAMPAH: "THR Tukang Sampah",
  UANG_KEMATIAN: "Uang Kematian",
  IURAN_17_AGUSTUS: "Iuran 17 Agustus",
  IURAN_HALAL_BIHALAL: "Iuran Halal Bihalal",
  LAIN_LAIN: "Lain-lain",
};

function toCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function PengeluaranAdminClient({ initialRows, initialMonth }: { initialRows: ExpenseRow[]; initialMonth: string }) {
  const [rows, setRows] = useState<ExpenseRow[]>(initialRows);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState<ExpenseCategory>(expenseCategoryValues[0]);
  const [amount, setAmount] = useState(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const [monthFilter, setMonthFilter] = useState(initialMonth);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "ALL">("ALL");

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(
    () => rows.reduce((acc, row) => ({ total: acc.total + Number(row.amount), count: acc.count + 1 }), { total: 0, count: 0 }),
    [rows],
  );

  function resetForm() {
    setEditingId(null);
    setCategory(expenseCategoryValues[0]);
    setAmount(0);
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setNote("");
  }

  function startEdit(row: ExpenseRow) {
    setEditingId(row.id);
    setCategory(row.category);
    setAmount(Number(row.amount));
    setExpenseDate(row.expense_date);
    setNote(row.note ?? "");
  }

  async function loadRows() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("month", monthFilter);
    if (categoryFilter !== "ALL") params.set("category", categoryFilter);

    const response = await fetch(`/api/admin/expenses?${params.toString()}`, { cache: "no-store" });
    const json = await response.json();

    if (!response.ok || !json.ok) {
      setError(json.message ?? "Gagal memuat pengeluaran.");
      setLoading(false);
      return;
    }

    const nextRows: ExpenseRow[] = (json.data.rows ?? []).map((row: ExpenseRow) => ({ ...row, amount: Number(row.amount) }));
    setRows(nextRows);
    setLoading(false);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/admin/expenses", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(editingId ? { id: editingId } : {}), category, amount: Number(amount), expenseDate, note: note.trim() || undefined }),
    });

    const json = await response.json();
    setSubmitting(false);

    if (!response.ok || !json.ok) {
      setError(json.message ?? "Gagal menyimpan pengeluaran.");
      return;
    }

    setMessage(editingId ? "Pengeluaran berhasil diperbarui." : "Pengeluaran berhasil disimpan.");
    resetForm();
    await loadRows();
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardTitle>{editingId ? "Edit Pengeluaran" : "Form Pengeluaran"}</CardTitle>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <Select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {expenseCategoryValues.map((item) => <option key={item} value={item}>{categoryLabels[item]}</option>)}
          </Select>
          <Input type="number" min={1} step={1000} required value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <Input type="date" required value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Pengeluaran"}</Button>
            {editingId ? <Button type="button" variant="outline" onClick={resetForm}>Batal</Button> : null}
          </div>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>

      <Card className="lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Riwayat Pengeluaran</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="w-auto" />
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value === "ALL" ? "ALL" : (e.target.value as ExpenseCategory))} className="w-auto">
              <option value="ALL">Semua kategori</option>
              {expenseCategoryValues.map((item) => <option key={item} value={item}>{categoryLabels[item]}</option>)}
            </Select>
            <Button type="button" variant="outline" onClick={() => void loadRows()} disabled={loading}>{loading ? "Memuat..." : "Terapkan"}</Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"><p className="text-xs text-zinc-500">Jumlah Transaksi</p><p className="mt-1 text-lg font-semibold">{totals.count}</p></div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"><p className="text-xs text-zinc-500">Total Pengeluaran</p><p className="mt-1 text-lg font-semibold">{toCurrency(totals.total)}</p></div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead><tr className="text-left text-zinc-600"><th className="px-2 py-2 font-medium">Tanggal</th><th className="px-2 py-2 font-medium">Kategori</th><th className="px-2 py-2 font-medium">Nominal</th><th className="px-2 py-2 font-medium">Ketua</th><th className="px-2 py-2 font-medium">Catatan</th><th className="px-2 py-2 font-medium">Aksi</th></tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-2 py-2">{row.expense_date}</td>
                  <td className="px-2 py-2">{categoryLabels[row.category]}</td>
                  <td className="px-2 py-2">{toCurrency(Number(row.amount))}</td>
                  <td className="px-2 py-2">{row.created_by_name_snapshot}</td>
                  <td className="px-2 py-2">{row.note ?? "-"}</td>
                  <td className="px-2 py-2"><Button type="button" variant="outline" onClick={() => startEdit(row)}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && rows.length === 0 ? <p className="px-2 py-4 text-sm text-zinc-500">Belum ada transaksi pengeluaran.</p> : null}
        </div>
      </Card>
    </section>
  );
}
