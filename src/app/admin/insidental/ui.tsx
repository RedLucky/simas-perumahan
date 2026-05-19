"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type House = { id: string; code: string; display_name: string };
type EventType = "AGUSTUS_17" | "HALAL_BIHALAL";
type EventRow = { id: string; event_year: number; event_type: EventType; amount: number; is_active: boolean; note: string | null };
type PaymentRow = { id: string; paid_amount: number; paid_at: string; note: string | null; houses: { code: string; display_name: string } };

const eventTypeLabels: Record<EventType, string> = { AGUSTUS_17: "17 Agustus", HALAL_BIHALAL: "Halal Bihalal" };

function toCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function InsidentalAdminClient({ initialYear, initialHouses, initialEvents }: { initialYear: number; initialHouses: House[]; initialEvents: EventRow[] }) {
  const [year, setYear] = useState(initialYear);
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  const [eventType, setEventType] = useState<EventType>("AGUSTUS_17");
  const [eventAmount, setEventAmount] = useState(0);
  const [eventActive, setEventActive] = useState(true);
  const [eventNote, setEventNote] = useState("");

  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [houseId, setHouseId] = useState(initialHouses[0]?.id ?? "");
  const [paidAmount, setPaidAmount] = useState(0);
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [paymentNote, setPaymentNote] = useState("");

  const [selectedEventId, setSelectedEventId] = useState<string>(initialEvents[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId) ?? null, [events, selectedEventId]);

  async function refreshEvents(targetYear: number) {
    const response = await fetch(`/api/admin/incidental/events?year=${targetYear}`, { cache: "no-store" });
    const json = await response.json();
    if (!response.ok || !json.ok) { setError(json.message ?? "Gagal memuat event."); return; }
    const rows: EventRow[] = (json.data.rows ?? []).map((row: EventRow) => ({ ...row, amount: Number(row.amount) }));
    setEvents(rows);
    setSelectedEventId(rows[0]?.id ?? "");
  }

  async function refreshPayments(eventId: string) {
    if (!eventId) { setPayments([]); return; }
    const response = await fetch(`/api/admin/incidental/payments?eventId=${eventId}`, { cache: "no-store" });
    const json = await response.json();
    if (!response.ok || !json.ok) { setError(json.message ?? "Gagal memuat pembayaran."); return; }
    const rows: PaymentRow[] = (json.data.rows ?? []).map((row: PaymentRow & { houses: { code: string; display_name: string }[] }) => ({ ...row, paid_amount: Number(row.paid_amount), houses: Array.isArray(row.houses) ? row.houses[0] : row.houses }));
    setPayments(rows);
  }

  function resetPaymentForm() {
    setEditingPaymentId(null);
    setHouseId(initialHouses[0]?.id ?? "");
    setPaidAmount(0);
    setPaidAt(new Date().toISOString().slice(0, 10));
    setPaymentNote("");
  }

  function startEditPayment(row: PaymentRow) {
    setEditingPaymentId(row.id);
    const house = initialHouses.find((h) => h.code === row.houses.code);
    if (house) setHouseId(house.id);
    setPaidAmount(Number(row.paid_amount));
    setPaidAt(row.paid_at);
    setPaymentNote(row.note ?? "");
  }

  async function saveEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setMessage(null); setError(null);
    const response = await fetch("/api/admin/incidental/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventYear: year, eventType, amount: Number(eventAmount), isActive: eventActive, note: eventNote.trim() || undefined }) });
    const json = await response.json();
    setLoading(false);
    if (!response.ok || !json.ok) { setError(json.message ?? "Gagal menyimpan event."); return; }
    setMessage("Event insidental berhasil disimpan.");
    await refreshEvents(year);
  }

  async function savePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEventId) { setError("Pilih event terlebih dahulu."); return; }
    setLoading(true); setMessage(null); setError(null);

    const response = await fetch("/api/admin/incidental/payments", {
      method: editingPaymentId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(editingPaymentId ? { id: editingPaymentId } : {}), eventId: selectedEventId, houseId, paidAmount: Number(paidAmount), paidAt, note: paymentNote.trim() || undefined }),
    });

    const json = await response.json();
    setLoading(false);
    if (!response.ok || !json.ok) { setError(json.message ?? "Gagal menyimpan pembayaran."); return; }
    setMessage(editingPaymentId ? "Pembayaran insidental berhasil diperbarui." : "Pembayaran insidental berhasil disimpan.");
    resetPaymentForm();
    await refreshPayments(selectedEventId);
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card>
        <CardTitle>Pengaturan Event Tahunan</CardTitle>
        <form className="mt-4 space-y-4" onSubmit={saveEvent}>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          <Select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}><option value="AGUSTUS_17">17 Agustus</option><option value="HALAL_BIHALAL">Halal Bihalal</option></Select>
          <Input type="number" min={0} step={1000} value={eventAmount} onChange={(e) => setEventAmount(Number(e.target.value))} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eventActive} onChange={(e) => setEventActive(e.target.checked)} />Event aktif</label>
          <Textarea rows={2} value={eventNote} onChange={(e) => setEventNote(e.target.value)} />
          <div className="flex gap-2"><Button type="submit" disabled={loading}>Simpan Event</Button><Button type="button" variant="outline" onClick={() => void refreshEvents(year)} disabled={loading}>Muat Ulang</Button></div>
        </form>
        <div className="mt-4 overflow-x-auto"><table className="min-w-full divide-y divide-zinc-200 text-sm"><thead><tr className="text-left text-zinc-600"><th className="px-2 py-2">Event</th><th className="px-2 py-2">Nominal</th><th className="px-2 py-2">Status</th></tr></thead><tbody className="divide-y divide-zinc-100">{events.map((row) => <tr key={row.id}><td className="px-2 py-2">{eventTypeLabels[row.event_type]}</td><td className="px-2 py-2">{toCurrency(row.amount)}</td><td className="px-2 py-2">{row.is_active ? "Aktif" : "Nonaktif"}</td></tr>)}</tbody></table></div>
      </Card>

      <Card>
        <CardTitle>{editingPaymentId ? "Edit Pembayaran Insidental" : "Pembayaran Insidental"}</CardTitle>
        <form className="mt-4 space-y-4" onSubmit={savePayment}>
          <Select value={selectedEventId} onChange={(e) => { const nextId = e.target.value; setSelectedEventId(nextId); void refreshPayments(nextId); }}>
            <option value="">-- Pilih event --</option>
            {events.filter((event) => event.is_active).map((event) => <option key={event.id} value={event.id}>{eventTypeLabels[event.event_type]} {event.event_year} ({toCurrency(event.amount)})</option>)}
          </Select>
          {selectedEvent ? <p className="mt-1 text-xs text-zinc-500">Event dipilih: {eventTypeLabels[selectedEvent.event_type]} {selectedEvent.event_year}</p> : null}
          <Select value={houseId} onChange={(e) => setHouseId(e.target.value)}>{initialHouses.map((house) => <option key={house.id} value={house.id}>{house.code} - {house.display_name}</option>)}</Select>
          <Input type="number" min={0} step={1000} value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} />
          <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          <Textarea rows={2} value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} />
          <div className="flex gap-2"><Button type="submit" disabled={loading || !selectedEventId}>{editingPaymentId ? "Simpan Perubahan" : "Simpan Pembayaran"}</Button><Button type="button" variant="outline" onClick={() => void refreshPayments(selectedEventId)} disabled={loading || !selectedEventId}>Muat Riwayat</Button>{editingPaymentId ? <Button type="button" variant="outline" onClick={resetPaymentForm}>Batal</Button> : null}</div>
        </form>

        <div className="mt-4 overflow-x-auto"><table className="min-w-full divide-y divide-zinc-200 text-sm"><thead><tr className="text-left text-zinc-600"><th className="px-2 py-2">Rumah</th><th className="px-2 py-2">Tanggal</th><th className="px-2 py-2">Nominal</th><th className="px-2 py-2">Catatan</th><th className="px-2 py-2">Aksi</th></tr></thead><tbody className="divide-y divide-zinc-100">{payments.map((row) => <tr key={row.id}><td className="px-2 py-2">{row.houses.code}</td><td className="px-2 py-2">{row.paid_at}</td><td className="px-2 py-2">{toCurrency(row.paid_amount)}</td><td className="px-2 py-2">{row.note ?? "-"}</td><td className="px-2 py-2"><Button type="button" variant="outline" onClick={() => startEditPayment(row)}>Edit</Button></td></tr>)}</tbody></table>{payments.length === 0 ? <p className="px-2 py-4 text-sm text-zinc-500">Belum ada pembayaran untuk event ini.</p> : null}</div>

        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>
    </section>
  );
}
