import Tombol from "@/components/Tombol";

export default function TidakDitemukan() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 py-16">
      <div className="w-full rounded-[20px] border border-garis bg-latar p-8">
        <span className="inline-flex rounded-full bg-utama-lembut px-3 py-1 text-xs font-semibold text-utama">
          404 · Tidak Ditemukan
        </span>
        <h1 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-teks">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-teks-lembut">
          Paket layanan, kategori, atau halaman yang Anda cari tidak tersedia atau telah dihapus.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Tombol href="/">Kembali ke Beranda</Tombol>
          <Tombol href="/antrean" varian="garis">
            Cek Antrean Mesin
          </Tombol>
        </div>
      </div>
    </div>
  );
}
