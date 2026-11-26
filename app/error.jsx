"use client";

import Link from "next/link";
import Tombol from "@/components/Tombol";

export default function HalamanError({ reset }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-5 py-16">
      <div className="w-full rounded-[20px] border border-garis bg-latar p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.04em] text-bahaya">
          Gangguan Layanan
        </p>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-teks">
          Terjadi kesalahan saat memuat halaman
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-teks-lembut">
          Sistem mengalami kendala sementara. Silakan muat ulang halaman ini atau kembali ke beranda.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Tombol type="button" onClick={() => reset()}>
            Coba Lagi
          </Tombol>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-garis-tegas bg-latar px-5 py-2.5 text-sm font-semibold text-teks transition-colors hover:border-utama hover:bg-permukaan hover:text-utama"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
