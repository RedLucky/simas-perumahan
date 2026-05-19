export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminProfiles, AdminProfile } from "@/lib/services/admin-profiles";
import { PengurusAdminClient } from "./ui";
import { redirect } from "next/navigation";

export default async function AdminPengurusPage() {
  const supabase = await createSupabaseServerClient();

  // Ambil user auth saat ini
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/pengurus");
  }

  // Tarik data profil semua pengurus
  let initialProfiles: AdminProfile[] = [];
  try {
    initialProfiles = await getAdminProfiles(supabase);
  } catch (error) {
    console.error("Gagal menarik profil pengurus:", error);
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 space-y-6">
      <PengurusAdminClient
        initialProfiles={initialProfiles}
        currentUserId={user.id}
      />
    </main>
  );
}
