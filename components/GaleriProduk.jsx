"use client";

import { useMemo, useState } from "react";

export default function GaleriProduk({ fotoUtama, galeriFoto = [], nama = "Paket Layanan" }) {
  const daftarFoto = useMemo(() => {
    const tambahan = Array.isArray(galeriFoto) ? galeriFoto : [];
    const gabungan = [fotoUtama, ...tambahan]
      .map((item) => String(item || "").trim())
      .filter(Boolean);

    const unik = Array.from(new Set(gabungan));
    return unik.length > 0 ? unik : ["/images/hero-machines.jpg"];
  }, [fotoUtama, galeriFoto]);

  const [aktifIndex, setAktifIndex] = useState(0);
  const safeIndex = aktifIndex < daftarFoto.length ? aktifIndex : 0;
  const fotoAktif = daftarFoto[safeIndex];
  const isDarkMedia = fotoAktif.includes("dark-drum");

  return (
    <div className="flex flex-col gap-3.5">
      <div
        className={`flex items-center justify-center rounded-[20px] border border-garis p-6 transition-colors duration-200 ${
          isDarkMedia ? "bg-[#272729]" : "bg-permukaan"
        }`}
      >
        <img
          src={fotoAktif}
          alt={`${nama} - foto ${safeIndex + 1}`}
          className="aspect-square max-h-[380px] w-full rounded-[14px] object-cover shadow-product transition-opacity duration-200"
        />
      </div>

      {daftarFoto.length > 1 ? (
        <div
          className="flex flex-wrap items-center gap-2.5"
          role="group"
          aria-label="Pilih foto layanan"
        >
          {daftarFoto.map((url, idx) => {
            const aktif = idx === safeIndex;
            const thumbDark = url.includes("dark-drum");
            return (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={() => setAktifIndex(idx)}
                aria-label={`Tampilkan foto ${idx + 1}`}
                aria-pressed={aktif}
                className={`h-16 w-16 cursor-pointer overflow-hidden rounded-[12px] border p-1 transition-all ${
                  thumbDark ? "bg-[#272729]" : "bg-permukaan"
                } ${
                  aktif
                    ? "border-utama ring-2 ring-utama/25"
                    : "border-garis opacity-75 hover:opacity-100"
                }`}
              >
                <img
                  src={url}
                  alt=""
                  className="h-full w-full rounded-[8px] object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
