import { NextResponse } from "next/server";
import { createSupabasePublicClient } from "@/lib/supabase/server";

const ALLOWED_SUMBER = new Set([
  "katalog",
  "detail",
  "kalkulator",
  "keranjang",
  "bandingkan",
  "tentang",
  "booking-dp",
]);

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const produkIdRaw = body.produk_id;
    let produkId = null;
    if (produkIdRaw !== null && produkIdRaw !== undefined && produkIdRaw !== "") {
      const parsed = Number(produkIdRaw);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return NextResponse.json({ ok: false }, { status: 400 });
      }
      produkId = parsed;
    }

    const sumberRaw = String(body.sumber || "katalog").trim().toLowerCase();
    if (!ALLOWED_SUMBER.has(sumberRaw)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = createSupabasePublicClient();
    const { error } = await supabase.from("wa_clicks").insert({
      produk_id: produkId,
      sumber: sumberRaw,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
