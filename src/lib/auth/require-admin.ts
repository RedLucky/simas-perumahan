import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function requireAdminUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: profileError.message }, { status: 500 }),
    };
  }

  if (!profile) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, user };
}
