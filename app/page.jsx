import Link from "next/link";
import KatalogInteraktif from "@/components/KatalogInteraktif";
import LiveMesinStatus from "@/components/LiveMesinStatus";
import Tombol from "@/components/Tombol";
import { getJakartaNow, releaseExpiredLocks } from "@/lib/laundry-scheduler";
import { getPengaturanToko } from "@/lib/pengaturan";
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

async function ambilDataKatalog() {
  try {
    const supabase = createSupabasePublicClient();
    await releaseExpiredLocks(supabase);

    const nowJakarta = getJakartaNow();
    const todayStr = nowJakarta.dateStr;

    const [produkRes, kategoriRes, mesinRes, blocksTodayRes, pengaturan] = await Promise.all([
      supabase
        .from("produk")
        .select(
          "id, nama, harga, harga_coret, badge, deskripsi, foto_url, kategori, max_capacity_kg, cycle_duration_minutes, requires_washer, requires_dryer, stok, aktif, urutan, created_at"
        )
        .eq("aktif", true)
        .order("urutan", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("kategori")
        .select("id, nama, slug, deskripsi, urutan")
        .order("urutan", { ascending: true })
        .order("nama", { ascending: true }),
      supabase
        .from("machines")
        .select("id, machine_code, name, type, max_capacity_kg, cycle_duration_minutes, status")
        .order("type", { ascending: false })
        .order("machine_code", { ascending: true }),
      supabase
        .from("machine_time_blocks")
        .select("id, machine_id, start_time, end_time, block_status")
        .eq("block_date", todayStr)
        .in("block_status", ["LOCKED_TEMP", "BOOKED", "RUNNING"]),
      getPengaturanToko(),
    ]);

    if (produkRes.error) {
      return {
        daftarProduk: [],
        daftarKategori: [],
        machines: [],
        blocksToday: [],
        currentTimeStr: nowJakarta.timeStr,
        pengaturan,
        errorMuat: true,
      };
    }

    const machines = mesinRes.data || [];
    const adaDataMesin = !mesinRes.error && machines.length > 0;
    const washerAktif = machines.filter((m) => m.type === "WASHER" && m.status === "ACTIVE").length;
    const dryerAktif = machines.filter((m) => m.type === "DRYER" && m.status === "ACTIVE").length;

    const daftarProduk = (produkRes.data || []).map((item) => {
      if (!adaDataMesin) return item;
      const butuhWasherKosong = item.requires_washer && washerAktif === 0;
      const butuhDryerKosong = item.requires_dryer && dryerAktif === 0;
      if (butuhWasherKosong || butuhDryerKosong) {
        return { ...item, stok: 0 };
      }
      return item;
    });

    return {
      daftarProduk,
      daftarKategori: kategoriRes.error ? [] : kategoriRes.data || [],
      machines,
      blocksToday: blocksTodayRes.data || [],
      currentTimeStr: nowJakarta.timeStr,
      pengaturan,
      errorMuat: false,
    };
  } catch {
    const pengaturan = await getPengaturanToko();
    const nowJakarta = getJakartaNow();
    return {
      daftarProduk: [],
      daftarKategori: [],
      machines: [],
      blocksToday: [],
      currentTimeStr: nowJakarta.timeStr,
      pengaturan,
      errorMuat: true,
    };
  }
}

export default async function HalamanKatalog({ searchParams }) {
  const sp = await searchParams;
  const initialQuery = String(sp?.q || "").trim();
  const initialKategori = String(sp?.kategori || "").trim();
  const initialSort = String(sp?.sort || "bawaan").trim();

  const {
    daftarProduk,
    daftarKategori,
    machines,
    blocksToday,
    currentTimeStr,
    pengaturan,
    errorMuat,
  } = await ambilDataKatalog();
  const namaGerai = pengaturan?.nama_gerai || toko.nama;
  const alamatGerai = pengaturan?.alamat || toko.alamat;
  const jamBukaGerai = pengaturan?.jam_operasional_label || toko.jamBuka;

  return (
    <>
      {/* Banner Promo Dinamis dari Admin (US-42) */}
      {pengaturan?.banner_aktif && pengaturan?.banner_judul ? (
        <section aria-label="Pengumuman dan promo gerai" className="pt-6">
          <div className="flex flex-col justify-between gap-4 rounded-[20px] border border-utama/25 bg-utama-lembut p-5 sm:flex-row sm:items-center sm:px-6">
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-utama px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-white">
                Promo Gerai
              </span>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.015em] text-teks">
                {pengaturan.banner_judul}
              </h2>
              {pengaturan.banner_subjudul ? (
                <p className="mt-0.5 text-sm text-teks-lembut">{pengaturan.banner_subjudul}</p>
              ) : null}
            </div>

            {pengaturan.banner_cta ? (
              <Tombol href={pengaturan.banner_link || "/antrean"} className="shrink-0">
                {pengaturan.banner_cta}
              </Tombol>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Band 1: Hero Section (selaras dengan .hero-section di _ref/test-agy) */}
      <section className="band-full py-12 sm:py-[72px]">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="flex flex-col items-start gap-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-teks-lembut">
              LAUNDRY KOIN DIGITAL · {namaGerai.toUpperCase()}
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
              alt={`Mesin cuci dan pengering komersial ${namaGerai}`}
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
        {machines.length > 0 ? (
          <div className="mb-10">
            <LiveMesinStatus
              machines={machines}
              blocksToday={blocksToday}
              currentTimeStr={currentTimeStr}
              compact
            />
          </div>
        ) : null}

        <div className="mb-8 max-w-[560px]">
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
          <KatalogInteraktif
            daftarProduk={daftarProduk}
            daftarKategori={daftarKategori}
            initialQuery={initialQuery}
            initialKategori={initialKategori}
            initialSort={initialSort}
          />
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
            {jamBukaGerai} dengan pemantauan status mesin per unit secara real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <article className="flex flex-col justify-between gap-4 rounded-[20px] border border-garis bg-latar p-6">
            <div>
              <span className="inline-flex items-center rounded-full bg-sukses-latar px-2.5 py-0.5 text-xs font-semibold text-sukses">
                Gerai Aktif
              </span>
              <h3 className="mt-3 text-[22px] font-semibold leading-[28px] tracking-[-0.01em] text-teks">
                {namaGerai}
              </h3>
              <p className="mt-1 text-[14px] leading-[20px] text-teks-lembut">{alamatGerai}</p>
              <p className="numeric mt-1 text-[14px] leading-[20px] text-teks-lembut">
                {jamBukaGerai}
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
