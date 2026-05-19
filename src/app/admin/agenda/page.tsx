export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { agendaCategoryValues } from "@/lib/validators/agenda";
import { AdminAgendaClient } from "./ui";

type AgendaRow = {
  id: string;
  title: string;
  content: string;
  event_date: string;
  location: string | null;
  category: (typeof agendaCategoryValues)[number];
  is_published: boolean;
  created_at: string;
  created_by_name_snapshot: string;
};

export default async function AdminAgendaPage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("agenda_posts")
    .select("id, title, content, event_date, location, category, is_published, created_at, created_by_name_snapshot")
    .order("event_date", { ascending: false })
    .limit(300);

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Kelola Agenda Warga</h1>
      <p className="mt-2 text-sm text-zinc-600">Buat, edit, dan hapus pengumuman/agenda untuk warga.</p>
      <AdminAgendaClient initialRows={(data ?? []) as AgendaRow[]} />
    </main>
  );
}
