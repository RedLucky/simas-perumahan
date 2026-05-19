import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getAdminProfiles, createAdminProfile, updateAdminProfile } from "@/lib/services/admin-profiles";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env/public";
import { z } from "zod";

// Draf skema validator
const createPengurusSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  phone: z.string().optional(),
  periodLabel: z.string().min(2, "Label periode wajib diisi"),
});

const updatePengurusSchema = z.object({
  id: z.string().uuid("ID tidak valid"),
  fullName: z.string().optional(),
  phone: z.string().nullable().optional(),
  periodLabel: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const adminCheck = await requireAdminUser(supabase);
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const rows = await getAdminProfiles(supabase);
    return NextResponse.json({ ok: true, data: { rows } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const adminCheck = await requireAdminUser(supabase);
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const payload = await request.json();
    const validated = createPengurusSchema.parse(payload);

    // 1. Buat client temporary bebas cookie agar tidak merusak sesi login admin saat ini
    const tempSupabase = createServerClient(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // Sengaja dikosongkan agar cookies respon login baru tidak ditulis
          },
        },
      }
    );

    // 2. Buat user baru di Supabase Auth
    const { data: signUpData, error: signUpError } = await tempSupabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          full_name: validated.fullName,
        },
      },
    });

    if (signUpError || !signUpData.user) {
      return NextResponse.json(
        { ok: false, message: signUpError?.message ?? "Gagal mendaftarkan user baru di sistem Auth." },
        { status: 400 }
      );
    }

    // 3. Tambahkan data profil pengurus ke admin_profiles menggunakan client utama
    const newProfile = await createAdminProfile(supabase, {
      user_id: signUpData.user.id,
      full_name: validated.fullName,
      phone: validated.phone ?? null,
      period_label: validated.periodLabel,
      is_active: true, // Baru terdaftar otomatis aktif
    });

    return NextResponse.json({ ok: true, data: newProfile });
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

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const adminCheck = await requireAdminUser(supabase);
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const payload = await request.json();
    const validated = updatePengurusSchema.parse(payload);

    const updated = await updateAdminProfile(supabase, validated.id, {
      full_name: validated.fullName,
      phone: validated.phone,
      period_label: validated.periodLabel,
      is_active: validated.isActive,
    });

    return NextResponse.json({ ok: true, data: updated });
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
