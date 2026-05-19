import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getHousesWithContacts, updateHouseContact } from "@/lib/services/houses";
import { updateHouseSchema } from "@/lib/validators/rumah";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const adminCheck = await requireAdminUser(supabase);
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const rows = await getHousesWithContacts(supabase);
    return NextResponse.json({ ok: true, data: { rows } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const adminCheck = await requireAdminUser(supabase);
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const payload = await request.json();
    const validated = updateHouseSchema.parse(payload);

    await updateHouseContact(supabase, validated.id, {
      contact_name: validated.contactName,
      contact_phone: validated.contactPhone,
    });

    return NextResponse.json({ ok: true, message: "Kontak rumah berhasil diperbarui" });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, message: "Validasi gagal", errors: error.flatten() },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
