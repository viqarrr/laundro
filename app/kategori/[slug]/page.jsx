import Link from "next/link";
import { notFound } from "next/navigation";
import KartuProduk from "@/components/KartuProduk";
import Tombol from "@/components/Tombol";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { toko } from "@/lib/toko";

export const dynamic = "force-dynamic";

async function ambilKategoriBySlug(slug) {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("kategori")
      .select("id, nama, slug, deskripsi, urutan")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const kategori = await ambilKategoriBySlug(slug);

  if (!kategori) {
    return {
      title: `Kategori Tidak Ditemukan | ${toko.nama}`,
    };
  }

  return {
    title: `${kategori.nama} | ${toko.nama}`,
    description:
      kategori.deskripsi || `Daftar paket layanan ${kategori.nama} di coin laundry ${toko.nama}.`,
  };
}

export default async function HalamanKategori({ params }) {
  const { slug } = await params;
  const kategori = await ambilKategoriBySlug(slug);

  if (!kategori) {
    notFound();
  }

  const supabase = createSupabasePublicClient();
  const [produkRes, semuaKategoriRes, mesinRes] = await Promise.all([
    supabase
      .from("produk")
      .select(
        "id, nama, harga, harga_coret, badge, deskripsi, foto_url, kategori, max_capacity_kg, cycle_duration_minutes, requires_washer, requires_dryer, stok, aktif, urutan, created_at"
      )
      .eq("aktif", true)
      .eq("kategori", kategori.nama)
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("kategori")
      .select("id, nama, slug")
      .order("urutan", { ascending: true })
      .order("nama", { ascending: true }),
    supabase.from("machines").select("id, type, status"),
  ]);

  const machines = mesinRes.data || [];
  const adaDataMesin = !mesinRes.error && machines.length > 0;
  const washerAktif = machines.filter((m) => m.type === "WASHER" && m.status === "ACTIVE").length;
  const dryerAktif = machines.filter((m) => m.type === "DRYER" && m.status === "ACTIVE").length;

  const daftarProduk = (produkRes.data || []).map((item) => {
    if (!adaDataMesin) return item;
    if ((item.requires_washer && washerAktif === 0) || (item.requires_dryer && dryerAktif === 0)) {
      return { ...item, stok: 0 };
    }
    return item;
  });

  const semuaKategori = semuaKategoriRes.data || [];

  return (
    <div className="py-10 sm:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-teks-lembut">
        <Link href="/" className="font-medium text-utama hover:underline">
          Beranda
        </Link>
        <span aria-hidden="true">/</span>
        <span>Kategori</span>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-teks">{kategori.nama}</span>
      </nav>

      {/* Header Kategori */}
      <header className="mt-5 border-b border-garis pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-utama-lembut px-3 py-1 text-xs font-semibold text-utama">
              Kategori Layanan
            </span>
            <h1 className="mt-3 text-[clamp(28px,3.5vw,40px)] font-semibold leading-tight tracking-[-0.02em] text-teks">
              {kategori.nama}
            </h1>
            {kategori.deskripsi ? (
              <p className="mt-2 text-[17px] leading-[24px] tracking-[-0.015em] text-teks-lembut">
                {kategori.deskripsi}
              </p>
            ) : null}
          </div>

          <p className="numeric rounded-full border border-garis bg-permukaan px-4 py-1.5 text-sm font-semibold text-teks">
            {daftarProduk.length} paket tersedia
          </p>
        </div>

        {/* Navigasi antarkategori */}
        {semuaKategori.length > 1 ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex min-h-[36px] items-center rounded-full border border-garis bg-latar px-3.5 py-1 text-xs font-semibold text-teks-lembut transition-colors hover:border-garis-tegas hover:text-teks"
            >
              Semua Layanan
            </Link>
            {semuaKategori.map((kat) => (
              <Link
                key={kat.slug}
                href={`/kategori/${kat.slug}`}
                className={`inline-flex min-h-[36px] items-center rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                  kat.slug === kategori.slug
                    ? "bg-utama text-white"
                    : "border border-garis bg-latar text-teks-lembut hover:border-garis-tegas hover:text-teks"
                }`}
              >
                {kat.nama}
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      {/* Grid Layanan */}
      <section aria-label={`Daftar layanan ${kategori.nama}`} className="pt-8">
        {daftarProduk.length === 0 ? (
          <div className="rounded-[20px] border border-garis bg-permukaan p-10 text-center">
            <p className="text-[17px] font-semibold text-teks">
              Belum ada paket aktif dalam kategori ini
            </p>
            <p className="mt-1 text-sm text-teks-lembut">
              Silakan jelajahi kategori layanan lainnya atau kembali ke katalog utama.
            </p>
            <Tombol href="/" varian="garis" className="mt-5">
              Kembali ke Katalog
            </Tombol>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {daftarProduk.map((produk) => (
              <KartuProduk key={produk.id} produk={produk} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
