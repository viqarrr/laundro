"use client";

import { useUserPrefs } from "@/components/UserPrefsProvider";

export default function KartuProdukActions({ produk }) {
  const { hydrated, isFavorite, toggleFavorite, isCompared, toggleCompare } = useUserPrefs();

  const fav = hydrated && isFavorite(produk.id);
  const compared = hydrated && isCompared(produk.id);

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => toggleFavorite(produk.id)}
        aria-label={fav ? `Hapus ${produk.nama} dari favorit` : `Simpan ${produk.nama} ke favorit`}
        aria-pressed={fav}
        className={`inline-flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full border transition-colors ${
          fav
            ? "border-bahaya/40 bg-bahaya-latar text-bahaya"
            : "border-garis bg-permukaan text-teks-lembut hover:border-garis-tegas hover:text-teks"
        }`}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill={fav ? "currentColor" : "none"}
          aria-hidden="true"
        >
          <path
            d="M8 13.5S2.5 9.8 2.5 5.6A3.1 3.1 0 0 1 8 3.6a3.1 3.1 0 0 1 5.5 2C13.5 9.8 8 13.5 8 13.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => toggleCompare(produk)}
        aria-pressed={compared}
        className={`inline-flex min-h-[38px] cursor-pointer items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
          compared
            ? "border-utama/40 bg-utama-lembut text-utama"
            : "border-garis bg-permukaan text-teks-lembut hover:border-garis-tegas hover:text-teks"
        }`}
      >
        {compared ? "Dipilih" : "Bandingkan"}
      </button>
    </div>
  );
}
