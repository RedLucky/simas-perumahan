"use client";

import { useState } from "react";
import { agendaCategoryValues } from "@/lib/validators/agenda";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Category = (typeof agendaCategoryValues)[number];

type AgendaRow = {
  id: string;
  title: string;
  content: string;
  event_date: string;
  location: string | null;
  category: Category;
  is_published: boolean;
  created_at: string;
  created_by_name_snapshot: string;
};

const categoryLabel: Record<Category, string> = {
  PENGUMUMAN: "Pengumuman",
  RAPAT: "Rapat",
  KEGIATAN: "Kegiatan",
  KEAMANAN: "Keamanan",
  LAINNYA: "Lainnya",
};

export function AdminAgendaClient({ initialRows }: { initialRows: AgendaRow[] }) {
  const [rows, setRows] = useState<AgendaRow[]>(initialRows);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<Category>("PENGUMUMAN");
  const [isPublished, setIsPublished] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setEventDate(new Date().toISOString().slice(0, 10));
    setLocation("");
    setCategory("PENGUMUMAN");
    setIsPublished(true);
  }

  async function reloadRows() {
    const response = await fetch("/api/admin/agenda", { cache: "no-store" });
    const json = await response.json();
    if (response.ok && json.ok) setRows(json.data.rows ?? []);
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      title,
      content,
      eventDate,
      location: location.trim() || undefined,
      category,
      isPublished,
    };

    const response = await fetch("/api/admin/agenda", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    setLoading(false);

    if (!response.ok || !json.ok) {
      setError(json.message ?? "Gagal menyimpan agenda.");
      return;
    }

    setMessage(editingId ? "Agenda berhasil diperbarui." : "Agenda berhasil dibuat.");
    resetForm();
    await reloadRows();
  }

  async function removeRow(id: string) {
    setLoading(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/admin/agenda", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await response.json();
    setLoading(false);

    if (!response.ok || !json.ok) {
      setError(json.message ?? "Gagal menghapus agenda.");
      return;
    }

    setMessage("Agenda berhasil dihapus.");
    await reloadRows();
  }

  function startEdit(row: AgendaRow) {
    setEditingId(row.id);
    setTitle(row.title);
    setContent(row.content);
    setEventDate(row.event_date);
    setLocation(row.location ?? "");
    setCategory(row.category);
    setIsPublished(row.is_published);
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardTitle>{editingId ? "Edit Agenda" : "Tambah Agenda"}</CardTitle>

        <form className="mt-4 space-y-4" onSubmit={submitForm}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul" required />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Isi agenda" rows={5} required />
          <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lokasi (opsional)" />
          <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {agendaCategoryValues.map((item) => (
              <option key={item} value={item}>{categoryLabel[item]}</option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />Publish ke publik</label>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{editingId ? "Simpan Perubahan" : "Simpan Agenda"}</Button>
            {editingId ? <Button type="button" onClick={resetForm} variant="outline">Batal</Button> : null}
          </div>
        </form>

        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>

      <Card className="lg:col-span-2">
        <CardTitle>Daftar Agenda</CardTitle>
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-xl border border-zinc-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{row.title}</h3>
                <Badge variant={row.is_published ? "success" : "default"}>{row.is_published ? "Published" : "Draft"}</Badge>
              </div>
              <p className="mt-1 text-sm text-zinc-600">{row.event_date} • {categoryLabel[row.category]}{row.location ? ` • ${row.location}` : ""}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{row.content}</p>
              <p className="mt-2 text-xs text-zinc-500">Dibuat oleh: {row.created_by_name_snapshot}</p>
              <div className="mt-3 flex gap-2">
                <Button type="button" onClick={() => startEdit(row)} variant="outline">Edit</Button>
                <Button type="button" onClick={() => void removeRow(row.id)} variant="outline" className="text-red-700">Hapus</Button>
              </div>
            </article>
          ))}
          {rows.length === 0 ? <p className="text-sm text-zinc-500">Belum ada agenda.</p> : null}
        </div>
      </Card>
    </section>
  );
}
