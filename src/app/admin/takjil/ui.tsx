"use client";

import { useMemo, useState } from "react";

type House = { id: string; code: string; display_name: string };

type DraftRow = {
  id: string;
  ramadan_year: number;
  day_number: number;
  assignment_type: "TAKJIL_MUSHOLA" | "SAHUR_SATPAM" | "BUKA_SATPAM";
  house_id: string;
  is_published: boolean;
  houses: { code: string; display_name: string } | { code: string; display_name: string }[];
};

const assignmentLabels: Record<DraftRow["assignment_type"], string> = {
  TAKJIL_MUSHOLA: "Takjil Mushola",
  SAHUR_SATPAM: "Sahur Satpam",
  BUKA_SATPAM: "Buka Satpam",
};

function currentYear() {
  return new Date().getFullYear();
}

export function TakjilAdminClient() {
  const [year, setYear] = useState(currentYear());
  const [totalDays, setTotalDays] = useState(30);
  const [houses, setHouses] = useState<House[]>([]);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draftRows = useMemo(() => rows.filter((row) => !row.is_published), [rows]);
  const publishedRows = useMemo(() => rows.filter((row) => row.is_published), [rows]);

  async function loadDraft() {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/admin/ramadan/draft?year=${year}`, { cache: "no-store" });
    const json = await response.json();

    setLoading(false);

    if (!response.ok || !json.ok) {
      setError(json.message ?? "Gagal memuat jadwal.");
      return;
    }

    setRows(json.data.rows ?? []);
    setHouses(json.data.houses ?? []);
  }

  async function generateDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/admin/ramadan/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ramadanYear: year, totalDays: Number(totalDays) }),
    });

    const json = await response.json();

    if (!response.ok || !json.ok) {
      setLoading(false);
      setError(json.message ?? "Gagal generate draft.");
      return;
    }

    setMessage("Draft jadwal berhasil dibuat.");
    await loadDraft();
  }

  async function updateAssignment(id: string, houseId: string) {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/admin/ramadan/draft?year=${year}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, houseId }),
    });
    const json = await response.json();

    setLoading(false);

    if (!response.ok || !json.ok) {
      setError(json.message ?? "Gagal update assignment.");
      return;
    }

    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, house_id: houseId } : row)));
    setMessage("Assignment berhasil diperbarui.");
  }

  async function publishDraft() {
    setLoading(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/admin/ramadan/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ramadanYear: year }),
    });

    const json = await response.json();
    setLoading(false);

    if (!response.ok || !json.ok) {
      setError(json.message ?? "Gagal publish jadwal.");
      return;
    }

    setMessage(`Publish berhasil (${json.data.publishedCount} assignment).`);
    await loadDraft();
  }

  return (
    <section className="mt-6 space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Generate Draft</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-4" onSubmit={generateDraft}>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Tahun"
          />
          <input
            type="number"
            min={1}
            max={31}
            value={totalDays}
            onChange={(e) => setTotalDays(Number(e.target.value))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Jumlah hari"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-70"
          >
            Generate
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadDraft()}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            Muat Draft
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Draft Assignment ({draftRows.length})</h2>
          <button
            type="button"
            disabled={loading || draftRows.length === 0}
            onClick={() => void publishDraft()}
            className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-70"
          >
            Publish Jadwal
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead>
              <tr className="text-left text-zinc-600">
                <th className="px-2 py-2 font-medium">Hari</th>
                <th className="px-2 py-2 font-medium">Jenis</th>
                <th className="px-2 py-2 font-medium">Rumah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {draftRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-2 py-2">{row.day_number}</td>
                  <td className="px-2 py-2">{assignmentLabels[row.assignment_type]}</td>
                  <td className="px-2 py-2">
                    <select
                      value={row.house_id}
                      onChange={(e) => void updateAssignment(row.id, e.target.value)}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
                    >
                      {houses.map((house) => (
                        <option key={house.id} value={house.id}>
                          {house.code} - {house.display_name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && draftRows.length === 0 ? (
            <p className="px-2 py-4 text-sm text-zinc-500">Belum ada draft. Silakan generate atau muat draft.</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Published Assignment ({publishedRows.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead>
              <tr className="text-left text-zinc-600">
                <th className="px-2 py-2 font-medium">Hari</th>
                <th className="px-2 py-2 font-medium">Jenis</th>
                <th className="px-2 py-2 font-medium">Rumah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {publishedRows.map((row) => {
                const houseRel = Array.isArray(row.houses) ? row.houses[0] : row.houses;
                return (
                  <tr key={row.id}>
                    <td className="px-2 py-2">{row.day_number}</td>
                    <td className="px-2 py-2">{assignmentLabels[row.assignment_type]}</td>
                    <td className="px-2 py-2">{houseRel?.code ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && publishedRows.length === 0 ? (
            <p className="px-2 py-4 text-sm text-zinc-500">Belum ada jadwal yang dipublish.</p>
          ) : null}
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
