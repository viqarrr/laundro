"use client";

import { formatRupiah } from "@/lib/format";
import { toko } from "@/lib/toko";
import { catatKlikWa } from "@/lib/wa-tracking";

function normalisasiNomorWa(nomor) {
  const digits = String(nomor || "").replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  return digits;
}

export default function TombolWhatsApp({ produk, pengaturan = null, sumber = "detail" }) {
  const namaGerai = pengaturan?.nama_gerai || toko.nama;
  const nomorTujuan = normalisasiNomorWa(toko.nomorWhatsApp || pengaturan?.nomor_wa);
  const teksPesan = `Halo ${namaGerai}, saya ingin memesan layanan "${produk.nama}" dengan tarif ${formatRupiah(produk.harga)}. Mohon info ketersediaan slot mesin.`;
  const tautanWa = `https://wa.me/${nomorTujuan}?text=${encodeURIComponent(teksPesan)}`;

  return (
    <a
      href={tautanWa}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => catatKlikWa({ produkId: produk?.id, sumber })}
      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-utama px-6 py-3 text-[16px] font-semibold tracking-[-0.02em] text-white transition-all duration-150 hover:bg-utama-gelap active:scale-[0.96] sm:w-auto"
    >
      Pesan via WhatsApp
    </a>
  );
}
