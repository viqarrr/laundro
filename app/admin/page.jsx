import NavAdmin from "@/components/NavAdmin";
import TabelProduk from "@/components/TabelProduk";
import Tombol from "@/components/Tombol";
import FilterProdukAdmin from "./FilterProdukAdmin";
import { requireAdmin } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

const PER_PAGE = 10;

function buatUrlAdmin({ q, status, page }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status && status !== "semua") params.set("status", status);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

export default async function HalamanAdmin({ searchParams }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;

  const q = String(sp?.q || "").trim();
  const statusRaw = String(sp?.status || "semua").toLowerCase();
  const status = ["semua", "aktif", "nonaktif"].includes(statusRaw) ? statusRaw : "semua";
  const pageRaw = Number(sp?.page || 1);
  const currentPage = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  let query = supabase
    .from("produk")
    .select(
      "id, nama, harga, harga_coret, badge, foto_url, kategori, max_capacity_kg, cycle_duration_minutes, stok, aktif, urutan, created_at",
      { count: "exact" }
    );

  if (status === "aktif") {
    query = query.eq("aktif", true);
  } else if (status === "nonaktif") {
    query = query.eq("aktif", false);
  }

  const safeQ = q.replace(/[%_,()]/g, " ").trim();
  if (safeQ) {
    query = query.or(`nama.ilike.%${safeQ}%,kategori.ilike.%${safeQ}%`);
  }

  const from = (currentPage - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const { data, count, error } = await query
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: false })
    .range(from, to);

  const daftarProduk = error ? [] : data || [];
  const totalCount = error ? 0 : count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-teks">
            Kelola Paket Layanan
          </h1>
          <p className="numeric mt-0.5 text-sm text-teks-lembut">
            Total {totalCount} paket layanan ditemukan
          </p>
        </div>
        <Tombol href="/admin/produk/baru">Tambah produk</Tombol>
      </div>

      <FilterProdukAdmin initialQ={q} initialStatus={status} />

      {error ? (
        <p
          role="alert"
          className="rounded-[14px] border border-bahaya/30 bg-bahaya-latar px-4 py-3 text-sm font-medium text-bahaya"
        >
          Gagal memuat daftar paket layanan dari database.
        </p>
      ) : (
        <TabelProduk daftarProduk={daftarProduk} />
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="Paginasi tabel layanan"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-garis pt-4 text-sm"
        >
          <span className="numeric text-teks-lembut">
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Tombol
                href={buatUrlAdmin({ q, status, page: currentPage - 1 })}
                varian="garis"
                className="min-h-[38px] px-4 py-1.5 text-xs"
              >
                Sebelumnya
              </Tombol>
            ) : null}
            {currentPage < totalPages ? (
              <Tombol
                href={buatUrlAdmin({ q, status, page: currentPage + 1 })}
                varian="garis"
                className="min-h-[38px] px-4 py-1.5 text-xs"
              >
                Berikutnya
              </Tombol>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
