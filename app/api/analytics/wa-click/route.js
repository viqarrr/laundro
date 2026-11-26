import { NextResponse } from "next/server";
import { createSupabasePublicClient } from "@/lib/supabase/server";

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

    const sumber = String(body.sumber || "katalog")
      .trim()
      .slice(0, 60);
    if (!sumber) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = createSupabasePublicClient();
    const { error } = await supabase.from("wa_clicks").insert({
      produk_id: produkId,
      sumber,
    });

    if (error) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
