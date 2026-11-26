// US-03: tombol ini belum berfungsi.
// Tugas peserta: buka WhatsApp toko dengan pesan otomatis berisi nama dan harga produk.
export default function TombolWhatsApp({ produk }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-utama px-6 py-3 text-[16px] font-semibold tracking-[-0.02em] text-white transition-all duration-150 hover:bg-utama-gelap active:scale-[0.96] sm:w-auto"
    >
      Pesan via WhatsApp
    </button>
  );
}
