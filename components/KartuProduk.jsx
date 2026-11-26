import Link from "next/link";
import { formatRupiah } from "@/lib/format";

export default function KartuProduk({ produk }) {
  const adaPromo = Number(produk.harga_coret) > Number(produk.harga);
  const persenHemat = adaPromo
    ? Math.round(((produk.harga_coret - produk.harga) / produk.harga_coret) * 100)
    : 0;

  const isDarkMedia = typeof produk.foto_url === "string" && produk.foto_url.includes("dark-drum");

  const infoMesin = [
    produk.kategori || null,
    produk.max_capacity_kg ? `${produk.max_capacity_kg} kg` : null,
    produk.cycle_duration_minutes ? `${produk.cycle_duration_minutes} mnt` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/produk/${produk.id}`}
      className="group grid grid-cols-1 items-center gap-5 rounded-[20px] border border-garis bg-latar p-6 transition-colors duration-200 hover:border-garis-tegas sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-6"
    >
      <div
        className={`relative aspect-square w-full max-w-[180px] overflow-hidden rounded-[14px] p-2.5 sm:max-w-none ${
          isDarkMedia ? "bg-[#272729]" : "bg-permukaan"
        }`}
      >
        <img
          src={produk.foto_url || "/images/hero-machines.jpg"}
          alt={produk.nama}
          className="h-full w-full rounded-[8px] object-cover shadow-product transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {produk.badge ? (
            <span className="rounded-full bg-utama-lembut px-2.5 py-0.5 text-xs font-semibold text-utama">
              {produk.badge}
            </span>
          ) : null}
          {infoMesin ? (
            <span className="numeric text-[13px] font-medium text-teks-lembut">{infoMesin}</span>
          ) : null}
        </div>

        <h3 className="text-[22px] font-semibold leading-[28px] tracking-[-0.01em] text-teks transition-colors group-hover:text-utama">
          {produk.nama}
        </h3>

        {produk.deskripsi ? (
          <p className="line-clamp-2 text-[14px] leading-[20px] tracking-[-0.01em] text-teks-lembut">
            {produk.deskripsi}
          </p>
        ) : null}

        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="numeric text-[17px] font-semibold leading-[22px] tracking-[-0.02em] text-teks">
            {formatRupiah(produk.harga)}
          </span>
          {adaPromo ? (
            <>
              <span className="numeric text-xs text-teks-lembut line-through">
                {formatRupiah(produk.harga_coret)}
              </span>
              <span className="numeric rounded-full bg-harga-latar px-2.5 py-0.5 text-xs font-semibold text-harga">
                Hemat {persenHemat}%
              </span>
            </>
          ) : null}
        </div>

        <span className="mt-1 inline-flex min-h-[38px] items-center self-start rounded-full bg-utama-lembut px-4 py-1.5 text-[15px] font-semibold text-utama transition-colors group-hover:bg-utama group-hover:text-white">
          Lihat &amp; Pesan
        </span>
      </div>
    </Link>
  );
}
