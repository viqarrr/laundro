import Link from "next/link";
import ModerasiUlasan from "@/components/ModerasiUlasan";
import NavAdmin from "@/components/NavAdmin";
import { requireAdmin } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

const FILTER_STATUS = [
  { value: "semua", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

export default async function HalamanUlasanAdmin({ searchParams }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;

  const statusRaw = String(sp?.status || "semua").toLowerCase();
  const status = ["semua", "pending", "approved", "rejected"].includes(statusRaw)
    ? statusRaw
    : "semua";

  let query = supabase
    .from("ulasan")
    .select("id, produk_id, nama, rating, komentar, status, created_at, produk(id, nama)")
    .order("created_at", { ascending: false });

  if (status !== "semua") {
    query = query.eq("status", status);
  }

  const { data: daftarUlasan, error } = await query;

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-teks">
            Moderasi Ulasan Pelanggan
          </h1>
          <p className="mt-1 text-sm text-teks-lembut">
            Setujui, tolak, atau hapus ulasan pelanggan sebelum tampil di halaman layanan publik.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTER_STATUS.map((f) => (
            <Link
              key={f.value}
              href={f.value === "semua" ? "/admin/ulasan" : `/admin/ulasan?status=${f.value}`}
              className={`inline-flex min-h-[38px] items-center rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                status === f.value
                  ? "bg-utama text-white"
                  : "border border-garis bg-latar text-teks-lembut hover:border-garis-tegas hover:text-teks"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-[14px] border border-bahaya/30 bg-bahaya-latar px-4 py-3 text-sm font-medium text-bahaya"
        >
          Gagal memuat daftar ulasan dari database.
        </p>
      ) : (
        <ModerasiUlasan daftarUlasan={daftarUlasan || []} />
      )}
    </div>
  );
}
