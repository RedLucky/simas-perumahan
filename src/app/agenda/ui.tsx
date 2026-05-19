"use client";

import { useEffect, useMemo, useState } from "react";

type AgendaRow = {
  id: string;
  title: string;
  content: string;
  event_date: string;
  location: string | null;
  category: string;
  created_at: string;
};

const LAST_VISIT_KEY = "simas_agenda_last_visit_at";

function toDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function PublicAgendaClient({ initialRows }: { initialRows: AgendaRow[] }) {
  const [rows] = useState<AgendaRow[]>(initialRows);
  const [lastVisitAt] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LAST_VISIT_KEY);
  });

  useEffect(() => {
    localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
  }, []);

  const hasNewInfo = useMemo(() => {
    if (!lastVisitAt) return rows.length > 0;
    const lastVisitTs = new Date(lastVisitAt).getTime();
    return rows.some((row) => new Date(row.created_at).getTime() > lastVisitTs);
  }, [rows, lastVisitAt]);

  return (
    <section className="space-y-6">
      {hasNewInfo ? (
        <div className="rounded-xl border border-[var(--app-accent-glow)] bg-[var(--app-accent-glow)] px-5 py-4 text-sm text-[var(--app-accent)] font-medium flex items-center gap-3 backdrop-blur-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--app-accent)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--app-accent)]"></span>
          </span>
          Ada info baru sejak kunjungan terakhir Anda.
        </div>
      ) : null}

      <div className="space-y-4">
        {rows.map((row) => (
          <article key={row.id} className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--app-accent-glow)] group">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h2 className="text-xl font-bold tracking-tight text-[var(--app-text)] group-hover:text-[var(--app-accent)] transition-colors">{row.title}</h2>
              <span className="rounded-full bg-[var(--app-surface-2)] border border-[var(--app-border-soft)] px-3 py-1 text-xs font-semibold text-[var(--app-text-muted)] tracking-wide">{row.category}</span>
            </div>
            <p className="flex items-center gap-1.5 mt-1 text-sm text-[var(--app-text-muted)] font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              {toDateLabel(row.event_date)}
              {row.location ? (
                <>
                  <span className="mx-1">•</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  {row.location}
                </>
              ) : ""}
            </p>
            <p className="mt-4 whitespace-pre-wrap text-base text-[var(--app-text)] leading-relaxed">{row.content}</p>
          </article>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-[var(--app-text-muted)]">Belum ada agenda atau pengumuman.</p>
        </div>
      ) : null}
    </section>
  );
}
