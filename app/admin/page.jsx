import NavAdmin from "@/components/NavAdmin";
import TabelProduk from "@/components/TabelProduk";
import Tombol from "@/components/Tombol";
import ImporCsvModal from "@/components/ImporCsvModal";
import FilterProdukAdmin from "./FilterProdukAdmin";
import { requireSuperAdmin } from "@/lib/supabase/session";

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
  const { supabase, profile } = await requireSuperAdmin();
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

  const [
    listRes,
    aktifCountRes,
    machinesRes,
    pendingBookingsRes,
    waClicksRes,
    bookingsProdRes,
    allProdukRes,
  ] = await Promise.all([
    query
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase.from("produk").select("id", { count: "exact", head: true }).eq("aktif", true),
    supabase.from("machines").select("id, status"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("booking_status", "PENDING_LOCK"),
    supabase.from("wa_clicks").select("produk_id"),
    supabase.from("bookings").select("service_product_id"),
    supabase.from("produk").select("id, nama, kategori"),
  ]);

  const daftarProduk = listRes.error ? [] : listRes.data || [];
  const totalCount = listRes.error ? 0 : listRes.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  // Metrik Ringkasan (US-30)
  const layananAktifCount = aktifCountRes.count ?? 0;
  const machines = machinesRes.data || [];
  const mesinAktif = machines.filter((m) => m.status === "ACTIVE").length;
  const mesinMaintenance = machines.filter((m) => m.status === "MAINTENANCE").length;
  const pendingDpCount = pendingBookingsRes.count ?? 0;
  const waClicks = waClicksRes.data || [];
  const totalWaClicks = waClicks.length;

  // Agregasi Layanan Terlaris strictly berdasarkan klik WhatsApp (US-41) + jumlah produk per kategori (US-30)
  const allProdukList = allProdukRes.data || [];
  const produkMap = new Map(allProdukList.map((p) => [p.id, p]));
  const clicksMap = new Map();

  for (const row of waClicks) {
    if (!row.produk_id) continue;
    clicksMap.set(row.produk_id, (clicksMap.get(row.produk_id) || 0) + 1);
  }

  const layananTerlaris = Array.from(clicksMap.entries())
    .map(([produkId, clicks]) => {
      const info = produkMap.get(produkId);
      if (!info || clicks <= 0) return null;
      return {
        id: produkId,
        nama: info.nama,
        kategori: info.kategori,
        clicks,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  const maxTerlaris = layananTerlaris[0]?.clicks || 1;

  const kategoriCountMap = new Map();
  for (const p of allProdukList) {
    const kat = String(p.kategori || "Lainnya").trim() || "Lainnya";
    kategoriCountMap.set(kat, (kategoriCountMap.get(kat) || 0) + 1);
  }
  const kategoriStats = Array.from(kategoriCountMap.entries())
    .map(([nama, jumlah]) => ({ nama, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah);

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      {/* Ringkasan Operasional (US-30) */}
      <section aria-label="Ringkasan operasional gerai" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-[20px] border border-garis bg-latar p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.03em] text-teks-lembut">
            Layanan Aktif
          </p>
          <p className="numeric mt-2 text-3xl font-semibold tracking-tight text-teks">
            {layananAktifCount}
          </p>
          <p className="mt-1 text-xs text-teks-lembut">Tampil di katalog publik</p>
        </article>

        <article className="rounded-[20px] border border-garis bg-latar p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.03em] text-teks-lembut">
            Unit Mesin
          </p>
          <p className="numeric mt-2 text-3xl font-semibold tracking-tight text-teks">
            {mesinAktif}
            <span className="text-base font-medium text-teks-lembut"> / {machines.length}</span>
          </p>
          <p className="numeric mt-1 text-xs text-teks-lembut">
            {mesinMaintenance > 0 ? `${mesinMaintenance} sedang maintenance` : "Semua unit siap"}
          </p>
        </article>

        <article className="rounded-[20px] border border-garis bg-latar p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.03em] text-teks-lembut">
            Menunggu DP
          </p>
          <p className="numeric mt-2 text-3xl font-semibold tracking-tight text-utama">
            {pendingDpCount}
          </p>
          <p className="mt-1 text-xs text-teks-lembut">Antrean slot terkunci sementara</p>
        </article>

        <article className="rounded-[20px] border border-garis bg-latar p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.03em] text-teks-lembut">
            Klik WhatsApp
          </p>
          <p className="numeric mt-2 text-3xl font-semibold tracking-tight text-sukses">
            {totalWaClicks}
          </p>
          <p className="mt-1 text-xs text-teks-lembut">
            Masuk sebagai {profile?.role || "ADMIN"}
          </p>
        </article>
      </section>

      {/* Jumlah Produk per Kategori (US-30) & Layanan Terpopuler (US-41) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[20px] border border-garis bg-latar p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-teks">Produk per Kategori</h2>
              <p className="text-xs text-teks-lembut">
                Distribusi jumlah paket layanan pada tiap kategori.
              </p>
            </div>
            <span className="numeric rounded-full bg-permukaan px-3 py-1 text-xs font-semibold text-teks-lembut">
              {kategoriStats.length} kategori
            </span>
          </div>

          {kategoriStats.length === 0 ? (
            <p className="text-sm text-teks-lembut">Belum ada produk tersimpan.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {kategoriStats.map((kat) => (
                <div
                  key={kat.nama}
                  className="flex items-center justify-between gap-2 rounded-[14px] border border-garis bg-permukaan px-3.5 py-2.5 text-sm"
                >
                  <span className="truncate font-medium text-teks">{kat.nama}</span>
                  <span className="numeric shrink-0 rounded-full bg-latar px-2.5 py-0.5 text-xs font-semibold text-utama">
                    {kat.jumlah}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[20px] border border-garis bg-latar p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-teks">Layanan Terpopuler</h2>
              <p className="text-xs text-teks-lembut">
                Berdasarkan jumlah klik tombol WhatsApp terbanyak.
              </p>
            </div>
            <span className="numeric rounded-full bg-permukaan px-3 py-1 text-xs font-semibold text-teks-lembut">
              Top {layananTerlaris.length}
            </span>
          </div>

          {layananTerlaris.length === 0 ? (
            <p className="text-sm text-teks-lembut">
              Belum ada klik WhatsApp yang tercatat.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {layananTerlaris.map((item) => {
                const widthPct = Math.max(8, Math.round((item.clicks / maxTerlaris) * 100));
                return (
                  <li key={item.id} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-semibold text-teks">{item.nama}</span>
                      <span className="numeric shrink-0 text-xs font-medium text-teks-lembut">
                        {item.clicks} klik WA
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-permukaan">
                      <div
                        className="h-full rounded-full bg-utama transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Manajemen Paket Layanan */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-teks">
            Kelola Paket Layanan
          </h1>
          <p className="numeric mt-0.5 text-sm text-teks-lembut">
            Total {totalCount} paket layanan ditemukan
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/admin/produk/export"
            download="laundro-produk.csv"
            className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-garis-tegas bg-latar px-4 py-2 text-xs font-semibold text-teks transition-colors hover:border-utama hover:bg-permukaan hover:text-utama"
          >
            Ekspor CSV
          </a>
          <ImporCsvModal />
          <Tombol href="/admin/produk/baru">Tambah produk</Tombol>
        </div>
      </div>

      <FilterProdukAdmin initialQ={q} initialStatus={status} />

      {listRes.error ? (
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
