import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: false,
    message: "Gunakan login client Supabase pada /login.",
  });
}
