import type { SupabaseClient } from "@supabase/supabase-js";

export type HouseWithContact = {
  id: string;
  code: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  contact_name: string | null;
  contact_phone: string | null;
  order_number: number;
};

/**
 * Mengambil semua data rumah beserta kontak langsung dari tabel houses.
 * Query ini aman karena dipanggil pada sesi terotentikasi admin.
 */
export async function getHousesWithContacts(supabase: SupabaseClient): Promise<HouseWithContact[]> {
  const { data, error } = await supabase
    .from("houses")
    .select("id, code, display_name, is_active, created_at, updated_at, contact_name, contact_phone, order_number")
    .order("order_number", { ascending: true });

  if (error) {
    throw new Error(`Gagal mengambil data rumah: ${error.message}`);
  }

  return (data ?? []) as HouseWithContact[];
}

/**
 * Memperbarui data nama kontak dan nomor telepon langsung di tabel houses.
 */
export async function updateHouseContact(
  supabase: SupabaseClient,
  houseId: string,
  updates: {
    contact_name?: string | null;
    contact_phone?: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("houses")
    .update({
      contact_name: updates.contact_name ?? null,
      contact_phone: updates.contact_phone ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", houseId);

  if (error) {
    throw new Error(`Gagal memperbarui kontak rumah: ${error.message}`);
  }
}
