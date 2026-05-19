import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: false,
    message: "Endpoint logout akan diaktifkan saat admin shell tersedia.",
  });
}
