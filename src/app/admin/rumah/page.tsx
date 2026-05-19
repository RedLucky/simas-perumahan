export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHousesWithContacts, HouseWithContact } from "@/lib/services/houses";
import { RumahAdminClient } from "./ui";
import { redirect } from "next/navigation";

export default async function AdminRumahPage() {
  const supabase = await createSupabaseServerClient();

  // Ambil user auth saat ini
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/rumah");
  }

  // Tarik data rumah beserta kontak
  let initialHouses: HouseWithContact[] = [];
  try {
    initialHouses = await getHousesWithContacts(supabase);
  } catch (error) {
    console.error("Gagal menarik data rumah & kontak:", error);
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 space-y-6">
      <RumahAdminClient initialHouses={initialHouses} />
    </main>
  );
}
