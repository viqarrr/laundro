import Link from "next/link";
import Tombol from "@/components/Tombol";
import { formatRupiah } from "@/lib/format";
import { getPengaturanToko, normalisasiNomorWa } from "@/lib/pengaturan";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const pengaturan = await getPengaturanToko();
  return {
    title: "Tentang Gerai & Kontak",
    description: `Profil gerai ${pengaturan.nama_gerai}, alamat, jam operasional, aturan DP, dan kontak WhatsApp resmi.`,
  };
}

export default async function HalamanTentang() {
  const pengaturan = await getPengaturanToko();
  const nomorWa = normalisasiNomorWa(pengaturan.nomor_wa);
  const waUrl = `https://wa.me/${nomorWa}?text=${encodeURIComponent(
    `Halo Admin ${pengaturan.nama_gerai}, saya ingin bertanya mengenai layanan coin laundry dan ketersediaan mesin.`
  )}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${pengaturan.nama_gerai} ${pengaturan.alamat}`
  )}`;

  const labelDp =
    pengaturan.dp_type === "PERCENTAGE"
      ? `${pengaturan.dp_value}% dari total estimasi`
      : formatRupiah(pengaturan.dp_value);

  return (
    <div className="flex flex-col gap-8 py-10 sm:py-12">
      <header className="border-b border-garis pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.04em] text-utama">
          Profil Gerai Resmi
        </p>
        <h1 className="mt-2 text-[clamp(28px,3.5vw,40px)] font-semibold leading-tight tracking-[-0.02em] text-teks">
          Tentang {pengaturan.nama_gerai}
        </h1>
        <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-teks-lembut">
          Layanan coin laundry swalayan dan semi-self-service dengan sistem pemetaan slot per unit
          mesin agar cucian Anda selesai tepat waktu tanpa antre di lokasi.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="flex flex-col justify-between gap-5 rounded-[20px] border border-garis bg-latar p-6">
          <div className="flex flex-col gap-3">
            <span className="inline-flex self-start rounded-full bg-sukses-latar px-3 py-1 text-xs font-semibold text-sukses">
              Lokasi &amp; Jam Operasional
            </span>
            <h2 className="text-xl font-semibold text-teks">{pengaturan.nama_gerai}</h2>
            <p className="text-sm leading-relaxed text-teks-lembut">{pengaturan.alamat}</p>
            <div className="divide-y divide-garis rounded-[14px] border border-garis bg-permukaan text-sm">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-teks-lembut">Jam Operasional</span>
                <span className="numeric font-semibold text-teks">
                  {pengaturan.jam_operasional_label}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-teks-lembut">Jeda Bongkar-Muat</span>
                <span className="numeric font-semibold text-teks">
                  {pengaturan.buffer_minutes} menit antar antrean
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-teks-lembut">WhatsApp Resmi</span>
                <span className="numeric font-semibold text-teks">+{nomorWa}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-utama px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-utama-gelap"
            >
              Chat WhatsApp Gerai
            </a>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-garis-tegas bg-latar px-5 py-2.5 text-sm font-semibold text-teks transition-colors hover:border-utama hover:text-utama"
            >
              Buka Peta Lokasi
            </a>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-[20px] border border-garis bg-latar p-6">
          <span className="inline-flex self-start rounded-full bg-utama-lembut px-3 py-1 text-xs font-semibold text-utama">
            Aturan Reservasi &amp; Pembayaran DP
          </span>
          <h2 className="text-xl font-semibold text-teks">Ketentuan Slot Mesin</h2>

          <ul className="divide-y divide-garis rounded-[14px] border border-garis bg-permukaan text-sm">
            <li className="px-4 py-3.5">
              <p className="font-semibold text-teks">1. Kunci Sementara 15 Menit</p>
              <p className="mt-1 text-xs leading-relaxed text-teks-lembut">
                Saat memesan slot online, unit mesin ditahan selama 15 menit untuk pengiriman bukti
                transfer DP melalui WhatsApp. Jika melewati batas waktu, slot otomatis terbuka lagi.
              </p>
            </li>
            <li className="px-4 py-3.5">
              <p className="font-semibold text-teks">2. Toleransi Keterlambatan 15 Menit</p>
              <p className="mt-1 text-xs leading-relaxed text-teks-lembut">
                Pelanggan online diharapkan tiba maksimal 15 menit dari jadwal mulai. Bila terlambat
                dan ada antrean berikutnya, penjaga gerai dapat menggeser jadwal ke slot kosong
                terdekat.
              </p>
            </li>
            <li className="px-4 py-3.5">
              <p className="font-semibold text-teks">3. Nominal DP &amp; Rekening Tujuan</p>
              <p className="numeric mt-1 text-xs font-semibold text-utama">Ketentuan DP: {labelDp}</p>
              <p className="mt-1 text-xs text-teks-lembut">
                {pengaturan.info_rekening || "Informasi rekening dikonfirmasi langsung via WhatsApp."}
              </p>
            </li>
          </ul>

          <div className="flex flex-wrap gap-3 pt-1">
            <Tombol href="/antrean">Pesan Slot Antrean</Tombol>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center px-3 text-sm font-semibold text-utama hover:underline"
            >
              Lihat Daftar Paket &#8250;
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
