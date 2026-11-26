import { formatRupiah } from "@/lib/format";
import { toko } from "@/lib/toko";

function normalisasiNomorWa(nomor) {
  const digits = String(nomor || "").replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  return digits;
}

export default function TombolWhatsApp({ produk }) {
  const nomorTujuan = normalisasiNomorWa(toko.nomorWhatsApp);
  const teksPesan = `Halo ${toko.nama}, saya ingin memesan layanan "${produk.nama}" dengan tarif ${formatRupiah(produk.harga)}. Mohon info ketersediaan slot mesin.`;
  const tautanWa = `https://wa.me/${nomorTujuan}?text=${encodeURIComponent(teksPesan)}`;

  return (
    <a
      href={tautanWa}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-utama px-6 py-3 text-[16px] font-semibold tracking-[-0.02em] text-white transition-all duration-150 hover:bg-utama-gelap active:scale-[0.96] sm:w-auto"
    >
      Pesan via WhatsApp
    </a>
  );
}
