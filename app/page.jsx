import Link from "next/link";
import KartuProduk from "@/components/KartuProduk";
import Tombol from "@/components/Tombol";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { toko } from "@/lib/toko";

export const dynamic = "force-dynamic";

const langkahKerja = [
  {
    nomor: "01",
    judul: "Pilih Paket & Kapasitas",
    deskripsi:
      "Tentukan layanan cuci, pengeringan, atau combo sesuai estimasi berat cucian harian Anda.",
  },
  {
    nomor: "02",
    judul: "Kunci Jadwal & Konfirmasi DP",
    deskripsi:
      "Pilih jam kedatangan dan unit mesin tersedia. Sistem menahan slot mesin selama 15 menit.",
  },
  {
    nomor: "03",
    judul: "Datang & Jalankan Mesin",
    deskripsi:
      "Tiba di gerai dengan kode booking aktif, penjaga outlet membuka siklus drum Anda tanpa antre.",
  },
];

async function ambilDaftarLayanan() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("produk")
      .select(
        "id, nama, harga, harga_coret, badge, deskripsi, foto_url, kategori, max_capacity_kg, cycle_duration_minutes, requires_washer, requires_dryer, stok, aktif, urutan, created_at"
      )
      .eq("aktif", true)
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return { daftarProduk: [], errorMuat: true };
    }

    return { daftarProduk: data || [], errorMuat: false };
  } catch {
    return { daftarProduk: [], errorMuat: true };
  }
}

export default async function HalamanKatalog() {
  const { daftarProduk, errorMuat } = await ambilDaftarLayanan();

  return (
    <>
      {/* Band 1: Hero Section (selaras dengan .hero-section di _ref/test-agy) */}
      <section className="band-full py-12 sm:py-[72px]">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="flex flex-col items-start gap-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-teks-lembut">
              LAUNDRY KOIN DIGITAL · {toko.nama.toUpperCase()}
            </p>
            <h1 className="text-[clamp(34px,4.5vw,52px)] font-semibold leading-[1.08] tracking-[-0.025em] text-teks">
              Cuci &amp; Kering Tanpa Antre.
            </h1>
            <p className="max-w-[480px] text-[17px] leading-[24px] tracking-[-0.02em] text-teks-lembut">
              {toko.tagline}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <Tombol href="/antrean">Mulai Reservasi</Tombol>
              <Tombol href="#katalog-layanan" varian="garis">
                Lihat Paket Layanan
              </Tombol>
            </div>
          </div>

          <div className="flex justify-center">
            <img
              src="/images/hero-machines.jpg"
              alt={`Mesin cuci dan pengering komersial ${toko.nama}`}
              className="max-h-[340px] w-auto rounded-[14px] object-cover shadow-product"
              width={560}
              height={400}
            />
          </div>
        </div>
      </section>

      {/* Band 2: Cara Kerja (3 Langkah Singkat - .landing-band--grouped) */}
      <section aria-labelledby="judul-cara-kerja" className="band-full band-full--grouped py-14">
        <div className="mb-8 max-w-[560px]">
          <h2
            id="judul-cara-kerja"
            className="text-[28px] font-semibold leading-[34px] tracking-[-0.015em] text-teks"
          >
            Cara Kerja
          </h2>
          <p className="mt-1.5 text-[17px] leading-[22px] tracking-[-0.02em] text-teks-lembut">
            Tiga langkah singkat dari reservasi hingga drum berputar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {langkahKerja.map((item) => (
            <article
              key={item.nomor}
              className="flex flex-col gap-2 rounded-[20px] border border-garis bg-latar p-6"
            >
              <span className="font-mono text-[13px] font-semibold text-utama">{item.nomor}</span>
              <h3 className="text-[17px] font-semibold leading-[22px] tracking-[-0.02em] text-teks">
                {item.judul}
              </h3>
              <p className="text-[14px] leading-[20px] tracking-[-0.01em] text-teks-lembut">
                {item.deskripsi}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Band 3: Katalog Paket & Tarif (.catalog-grid 2 kolom horizontal) */}
      <section id="katalog-layanan" aria-labelledby="judul-produk" className="band-full py-14">
        <div className="mb-8 flex flex-col gap-4">
          <div className="max-w-[560px]">
            <h2
              id="judul-produk"
              className="text-[28px] font-semibold leading-[34px] tracking-[-0.015em] text-teks"
            >
              Katalog Paket &amp; Tarif
            </h2>
            <p className="mt-1.5 text-[17px] leading-[22px] tracking-[-0.02em] text-teks-lembut">
              Pilih paket layanan cuci, pengering, atau add-on sesuai kebutuhan cucian Anda.
            </p>
          </div>
        </div>

        {errorMuat ? (
          <div className="rounded-[20px] border border-garis bg-permukaan p-8 text-center">
            <p className="text-[17px] font-semibold text-teks">
              Daftar layanan belum dapat dimuat
            </p>
            <p className="mt-1 text-[14px] text-teks-lembut">
              Silakan muat ulang halaman beberapa saat lagi atau hubungi gerai melalui WhatsApp.
            </p>
          </div>
        ) : daftarProduk.length === 0 ? (
          <div className="rounded-[20px] border border-garis bg-permukaan p-8 text-center">
            <p className="text-[17px] font-semibold text-teks">
              Belum ada paket layanan tersedia
            </p>
            <p className="mt-1 text-[14px] text-teks-lembut">
              Pemilik gerai belum menambahkan paket layanan aktif. Silakan cek kembali nanti.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {daftarProduk.map((produk) => (
              <KartuProduk key={produk.id} produk={produk} />
            ))}
          </div>
        )}
      </section>

      {/* Band 4: Informasi Gerai & Operasional (.studios-grid 3 kolom) */}
      <section aria-labelledby="judul-gerai" className="band-full band-full--grouped band-full--last py-14">
        <div className="mb-8 max-w-[560px]">
          <h2
            id="judul-gerai"
            className="text-[28px] font-semibold leading-[34px] tracking-[-0.015em] text-teks"
          >
            Gerai &amp; Pemantauan Antrean
          </h2>
          <p className="mt-1.5 text-[17px] leading-[22px] tracking-[-0.02em] text-teks-lembut">
            {toko.jamBuka} dengan pemantauan status mesin per unit secara real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <article className="flex flex-col justify-between gap-4 rounded-[20px] border border-garis bg-latar p-6">
            <div>
              <span className="inline-flex items-center rounded-full bg-sukses-latar px-2.5 py-0.5 text-xs font-semibold text-sukses">
                Gerai Aktif
              </span>
              <h3 className="mt-3 text-[22px] font-semibold leading-[28px] tracking-[-0.01em] text-teks">
                {toko.nama}
              </h3>
              <p className="mt-1 text-[14px] leading-[20px] text-teks-lembut">{toko.alamat}</p>
              <p className="numeric mt-1 text-[14px] leading-[20px] text-teks-lembut">
                {toko.jamBuka}
              </p>
            </div>
            <Link
              href="/tentang"
              className="inline-flex min-h-[36px] items-center gap-1 self-start text-[15px] font-medium text-utama hover:underline"
            >
              <span>Lihat Profil Gerai &#8250;</span>
            </Link>
          </article>

          <article className="flex flex-col justify-between gap-4 rounded-[20px] border border-garis bg-latar p-6">
            <div>
              <span className="inline-flex items-center rounded-full bg-utama-lembut px-2.5 py-0.5 text-xs font-semibold text-utama">
                Slot Terhubung
              </span>
              <h3 className="mt-3 text-[22px] font-semibold leading-[28px] tracking-[-0.01em] text-teks">
                Cek Status Mesin
              </h3>
              <p className="mt-1 text-[14px] leading-[20px] text-teks-lembut">
                Pantau unit Washer dan Dryer yang kosong serta lacak kode booking Anda sebelum datang.
              </p>
            </div>
            <Link
              href="/antrean"
              className="inline-flex min-h-[36px] items-center gap-1 self-start text-[15px] font-medium text-utama hover:underline"
            >
              <span>Buka Papan Antrean &#8250;</span>
            </Link>
          </article>

          <article className="flex flex-col justify-between gap-4 rounded-[20px] border border-garis bg-latar p-6">
            <div>
              <span className="inline-flex items-center rounded-full bg-permukaan px-2.5 py-0.5 text-xs font-semibold text-teks-lembut">
                Komitmen Slot
              </span>
              <h3 className="mt-3 text-[22px] font-semibold leading-[28px] tracking-[-0.01em] text-teks">
                Kunci 15 Menit &amp; DP WA
              </h3>
              <p className="mt-1 text-[14px] leading-[20px] text-teks-lembut">
                Konfirmasi DP langsung lewat WhatsApp tanpa biaya gateway dengan batas toleransi kedatangan 15 menit.
              </p>
            </div>
            <Link
              href="/tentang"
              className="inline-flex min-h-[36px] items-center gap-1 self-start text-[15px] font-medium text-utama hover:underline"
            >
              <span>Baca Aturan Gerai &#8250;</span>
            </Link>
          </article>
        </div>
      </section>
    </>
  );
}
