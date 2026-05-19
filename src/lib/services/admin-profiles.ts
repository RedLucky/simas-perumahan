import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminProfile = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  period_label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function getAdminProfiles(supabase: SupabaseClient): Promise<AdminProfile[]> {
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("id, user_id, full_name, phone, period_label, is_active, created_at, updated_at")
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminProfile[];
}

export async function updateAdminProfile(
  supabase: SupabaseClient,
  id: string,
  updates: {
    is_active?: boolean;
    period_label?: string;
    full_name?: string;
    phone?: string | null;
  }
): Promise<AdminProfile> {
  const { data, error } = await supabase
    .from("admin_profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminProfile;
}

export async function createAdminProfile(
  supabase: SupabaseClient,
  profile: {
    user_id: string;
    full_name: string;
    phone?: string | null;
    period_label: string;
    is_active: boolean;
  }
): Promise<AdminProfile> {
  const { data, error } = await supabase
    .from("admin_profiles")
    .insert([profile])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminProfile;
}
