import Link from "next/link";
import { notFound } from "next/navigation";
import GaleriProduk from "@/components/GaleriProduk";
import KalkulatorLaundry from "@/components/KalkulatorLaundry";
import KartuProduk from "@/components/KartuProduk";
import { getPengaturanToko } from "@/lib/pengaturan";
import { createSupabasePublicClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function ambilDetailDanTerkait(id) {
  if (!/^\d+$/.test(String(id))) {
    return { produk: null, terkait: [] };
  }

  const produkId = Number(id);

  try {
    const supabase = createSupabasePublicClient();

    const [produkRes, mesinRes] = await Promise.all([
      supabase
        .from("produk")
        .select(
          "id, nama, harga, harga_coret, badge, deskripsi, foto_url, galeri_foto, varian, kategori, max_capacity_kg, cycle_duration_minutes, requires_washer, requires_dryer, stok, aktif"
        )
        .eq("id", produkId)
        .eq("aktif", true)
        .maybeSingle(),
      supabase.from("machines").select("id, type, status"),
    ]);

    if (produkRes.error || !produkRes.data) {
      return { produk: null, terkait: [] };
    }

    const machines = mesinRes.data || [];
    const adaDataMesin = !mesinRes.error && machines.length > 0;
    const washerAktif = machines.filter((m) => m.type === "WASHER" && m.status === "ACTIVE").length;
    const dryerAktif = machines.filter((m) => m.type === "DRYER" && m.status === "ACTIVE").length;

    let produk = produkRes.data;
    if (
      adaDataMesin &&
      ((produk.requires_washer && washerAktif === 0) ||
        (produk.requires_dryer && dryerAktif === 0))
    ) {
      produk = { ...produk, stok: 0 };
    }

    // Ambil maksimal 4 layanan terkait aktif (kategori sama atau Add-on, kecualikan ID aktif)
    const { data: kandidatTerkait } = await supabase
      .from("produk")
      .select(
        "id, nama, harga, harga_coret, badge, deskripsi, foto_url, kategori, max_capacity_kg, cycle_duration_minutes, requires_washer, requires_dryer, stok, aktif, urutan, created_at"
      )
      .eq("aktif", true)
      .neq("id", produkId)
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(12);

    const semuaKandidat = (kandidatTerkait || []).map((item) => {
      if (!adaDataMesin) return item;
      if (
        (item.requires_washer && washerAktif === 0) ||
        (item.requires_dryer && dryerAktif === 0)
      ) {
        return { ...item, stok: 0 };
      }
      return item;
    });

    const prioritas = semuaKandidat.filter(
      (item) =>
        item.kategori === produk.kategori ||
        String(item.kategori || "").toLowerCase().includes("add-on")
    );
    const cadangan = semuaKandidat.filter((item) => !prioritas.some((p) => p.id === item.id));
    const terkait = [...prioritas, ...cadangan].slice(0, 4);

    return { produk, terkait };
  } catch {
    return { produk: null, terkait: [] };
  }
}

export default async function HalamanDetailProduk({ params }) {
  const { id } = await params;
  const [{ produk, terkait }, pengaturan] = await Promise.all([
    ambilDetailDanTerkait(id),
    getPengaturanToko(),
  ]);

  if (!produk) {
    notFound();
  }

  return (
    <div className="py-10 sm:py-12">
      <Link
        href="/"
        className="inline-flex min-h-[40px] items-center gap-1.5 text-[15px] font-medium text-utama hover:underline underline-offset-4"
      >
        <span>&#8249; Kembali ke katalog</span>
      </Link>

      <article className="mt-6 grid items-start gap-8 md:grid-cols-[0.95fr_1.05fr] md:gap-12">
        <GaleriProduk
          fotoUtama={produk.foto_url}
          galeriFoto={produk.galeri_foto}
          nama={produk.nama}
        />

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            {produk.kategori ? (
              <span className="rounded-full bg-permukaan px-3 py-1 text-xs font-semibold text-teks-lembut">
                {produk.kategori}
              </span>
            ) : null}
            {produk.badge ? (
              <span className="rounded-full bg-utama-lembut px-3 py-1 text-xs font-semibold text-utama">
                {produk.badge}
              </span>
            ) : null}
          </div>

          <h1 className="text-[clamp(26px,3vw,34px)] font-semibold leading-[1.18] tracking-[-0.02em] text-teks">
            {produk.nama}
          </h1>

          {produk.deskripsi ? (
            <p className="max-w-prose text-[16px] leading-[24px] tracking-[-0.015em] text-teks-lembut">
              {produk.deskripsi}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-[20px] border border-garis bg-latar">
            <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <span className="text-teks-lembut">Cakupan Mesin</span>
              <span className="font-semibold text-teks">
                {[
                  produk.requires_washer ? "Washer" : null,
                  produk.requires_dryer ? "Dryer" : null,
                ]
                  .filter(Boolean)
                  .join(" + ") || "Add-on / Layanan Gerai"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-garis px-5 py-3 text-sm">
              <span className="text-teks-lembut">Ketersediaan Slot / Stok</span>
              <span
                className={`numeric font-semibold ${
                  Number(produk.stok ?? 10) <= 0 ? "text-bahaya" : "text-sukses"
                }`}
              >
                {Number(produk.stok ?? 10) <= 0
                  ? "Penuh / Habis"
                  : `${produk.stok ?? 10} unit siap pakai`}
              </span>
            </div>
          </div>

          <KalkulatorLaundry produk={produk} pengaturan={pengaturan} />
        </div>
      </article>

      {/* Produk Terkait (US-17) */}
      {terkait.length > 0 ? (
        <section
          aria-labelledby="judul-produk-terkait"
          className="mt-16 border-t border-garis pt-10"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="judul-produk-terkait"
                className="text-[24px] font-semibold tracking-[-0.015em] text-teks"
              >
                Layanan &amp; Add-on Terkait
              </h2>
              <p className="mt-1 text-sm text-teks-lembut">
                Lengkapi kebutuhan cuci Anda dengan paket sejenis atau tambahan deterjen dan pewangi.
              </p>
            </div>
            <Link href="/" className="text-sm font-medium text-utama hover:underline">
              Lihat semua layanan &#8250;
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {terkait.map((item) => (
              <KartuProduk key={item.id} produk={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
