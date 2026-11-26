import { NextResponse } from "next/server";
import { ensureAdminProfile, getAdminSession } from "@/lib/supabase/session";

const CSV_FORMULA_PREFIX = /^[=+\-@\t\r]/;

function escapeCsvCell(value) {
  if (value === null || value === undefined) return "";
  let str = String(value);

  // Proteksi CSV injection
  if (CSV_FORMULA_PREFIX.test(str.trimStart()) || CSV_FORMULA_PREFIX.test(str)) {
    str = `'${str}`;
  }

  if (/[",\n\r]/.test(str) || str.startsWith("'")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Akses ditolak. Silakan masuk sebagai admin." }, { status: 401 });
  }

  const profile = await ensureAdminProfile(session);
  if (!profile || !profile.aktif) {
    return NextResponse.json({ error: "Akun admin nonaktif atau tidak terverifikasi." }, { status: 403 });
  }
  if (profile.role !== "SUPERADMIN") {
    return NextResponse.json(
      { error: "Akses ditolak: fitur ini khusus untuk Superadmin." },
      { status: 403 }
    );
  }

  try {
    const { data: rows, error } = await session.supabase
      .from("produk")
      .select(
        "id, nama, kategori, harga, harga_coret, badge, max_capacity_kg, cycle_duration_minutes, stok, aktif, urutan, requires_washer, requires_dryer, foto_url, deskripsi, created_at"
      )
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Gagal mengambil data produk." }, { status: 500 });
    }

    const headers = [
      "id",
      "nama",
      "kategori",
      "harga",
      "harga_coret",
      "badge",
      "max_capacity_kg",
      "cycle_duration_minutes",
      "stok",
      "aktif",
      "urutan",
      "requires_washer",
      "requires_dryer",
      "foto_url",
      "deskripsi",
      "created_at",
    ];

    const lines = [
      headers.join(","),
      ...(rows || []).map((row) => headers.map((key) => escapeCsvCell(row[key])).join(",")),
    ];

    const csvString = `\uFEFF${lines.join("\r\n")}`;

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="laundro-produk.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan saat mengekspor CSV." }, { status: 500 });
  }
}
