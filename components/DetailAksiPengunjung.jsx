"use client";

import { useEffect } from "react";
import TombolBagikan from "@/components/TombolBagikan";
import { useUserPrefs } from "@/components/UserPrefsProvider";

export default function DetailAksiPengunjung({ produk }) {
  const { hydrated, isFavorite, toggleFavorite, isCompared, toggleCompare, recordRecentView } =
    useUserPrefs();

  useEffect(() => {
    recordRecentView(produk);
  }, [produk, recordRecentView]);

  const favAktif = hydrated && isFavorite(produk.id);
  const compareAktif = hydrated && isCompared(produk.id);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <TombolBagikan title={produk.nama} text={produk.deskripsi || produk.nama} />

      <button
        type="button"
        onClick={() => toggleFavorite(produk.id)}
        aria-pressed={favAktif}
        className={`inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
          favAktif
            ? "border-bahaya/40 bg-bahaya-latar text-bahaya"
            : "border-garis bg-permukaan text-teks hover:border-garis-tegas"
        }`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill={favAktif ? "currentColor" : "none"}
          aria-hidden="true"
        >
          <path
            d="M8 13.5S2.5 9.8 2.5 5.6A3.1 3.1 0 0 1 8 3.6a3.1 3.1 0 0 1 5.5 2C13.5 9.8 8 13.5 8 13.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
        <span>{favAktif ? "Tersimpan di Favorit" : "Simpan Favorit"}</span>
      </button>

      <button
        type="button"
        onClick={() => toggleCompare(produk)}
        aria-pressed={compareAktif}
        className={`inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
          compareAktif
            ? "border-utama/40 bg-utama-lembut text-utama"
            : "border-garis bg-permukaan text-teks hover:border-garis-tegas"
        }`}
      >
        <span>{compareAktif ? "Dalam Perbandingan" : "Bandingkan"}</span>
      </button>
    </div>
  );
}
