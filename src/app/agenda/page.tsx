export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PublicAgendaClient } from "./ui";

type AgendaRow = {
  id: string;
  title: string;
  content: string;
  event_date: string;
  location: string | null;
  category: string;
  created_at: string;
};

export default async function PublicAgendaPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("agenda_posts")
    .select("id, title, content, event_date, location, category, created_at")
    .eq("is_published", true)
    .order("event_date", { ascending: false })
    .limit(300);

  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:px-8 pt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient-accent">Agenda & Informasi Warga</h1>
        <p className="mt-2 text-base text-[var(--app-text-muted)]">Pengumuman, rapat, dan informasi penting untuk warga.</p>
      </div>
      <PublicAgendaClient initialRows={(data ?? []) as AgendaRow[]} />
    </main>
  );
}
