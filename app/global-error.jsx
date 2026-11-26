"use client";

import "./globals.css";

export default function GlobalError({ reset }) {
  return (
    <html lang="id">
      <body className="flex min-h-screen items-center justify-center bg-latar px-4 font-sans text-teks antialiased">
        <main className="w-full max-w-lg rounded-[20px] border border-garis bg-latar p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-bahaya">
            Gangguan Sistem
          </p>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-teks">
            Layanan sedang tidak tersedia
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-teks-lembut">
            Terjadi gangguan tak terduga pada aplikasi. Silakan coba lagi atau kembali ke halaman utama.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-full bg-utama px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-utama-gelap"
            >
              Coba Lagi
            </button>
            <a
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-garis-tegas bg-latar px-5 py-2.5 text-sm font-semibold text-teks transition-colors hover:border-utama hover:bg-permukaan hover:text-utama"
            >
              Kembali ke Beranda
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
