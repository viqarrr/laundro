"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { kirimUlasanAction } from "@/app/produk/[id]/ulasan-actions";

function StarIcon({ filled }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill={filled ? "currentColor" : "none"}
      aria-hidden="true"
    >
      <path
        d="M8 1.5L9.9 5.4L14.2 6L11.1 9L11.8 13.3L8 11.3L4.2 13.3L4.9 9L1.8 6L6.1 5.4L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatTanggal(iso) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function UlasanProduk({ produkId, ulasanList = [] }) {
  const [state, formAction, isPending] = useActionState(kirimUlasanAction, null);
  const [rating, setRating] = useState(5);
  const formRef = useRef(null);

  useEffect(() => {
    if (state?.ok && formRef.current) {
      formRef.current.reset();
      setRating(5);
    }
  }, [state]);

  const totalUlasan = ulasanList.length;
  const rataRata =
    totalUlasan > 0
      ? (ulasanList.reduce((sum, u) => sum + Number(u.rating || 0), 0) / totalUlasan).toFixed(1)
      : "0.0";

  const errors = state?.errors || {};

  return (
    <section
      aria-labelledby="judul-ulasan-layanan"
      className="mt-14 border-t border-garis pt-10"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="judul-ulasan-layanan"
            className="text-[24px] font-semibold tracking-[-0.015em] text-teks"
          >
            Ulasan &amp; Rating Pelanggan
          </h2>
          <p className="mt-1 text-sm text-teks-lembut">
            Pengalaman pelanggan yang telah menggunakan layanan di gerai.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-[16px] border border-garis bg-permukaan px-4 py-2.5">
          <span className="text-harga">
            <StarIcon filled />
          </span>
          <span className="numeric text-lg font-bold text-teks">{rataRata}</span>
          <span className="numeric text-xs text-teks-lembut">
            ({totalUlasan} ulasan disetujui)
          </span>
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Daftar Ulasan Approved */}
        <div className="flex flex-col gap-3">
          {ulasanList.length === 0 ? (
            <div className="rounded-[20px] border border-garis bg-permukaan p-8 text-center">
              <p className="text-base font-semibold text-teks">Belum ada ulasan</p>
              <p className="mt-1 text-sm text-teks-lembut">
                Jadilah pelanggan pertama yang memberikan ulasan untuk paket layanan ini.
              </p>
            </div>
          ) : (
            ulasanList.map((u) => (
              <article
                key={u.id}
                className="flex flex-col gap-2 rounded-[18px] border border-garis bg-latar p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-teks">{u.nama}</p>
                  <span className="numeric text-xs text-teks-lembut">
                    {formatTanggal(u.created_at)}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-harga" aria-label={`Rating ${u.rating} dari 5`}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <StarIcon key={num} filled={num <= Number(u.rating)} />
                  ))}
                </div>

                <p className="text-sm leading-relaxed text-teks-lembut">{u.komentar}</p>
              </article>
            ))
          )}
        </div>

        {/* Form Kirim Ulasan */}
        <form
          ref={formRef}
          action={formAction}
          className="flex flex-col gap-4 rounded-[20px] border border-garis bg-permukaan p-6"
        >
          <input type="hidden" name="produk_id" value={produkId} />
          <input type="hidden" name="rating" value={rating} />

          <div>
            <h3 className="text-base font-semibold text-teks">Tulis Ulasan Anda</h3>
            <p className="mt-0.5 text-xs text-teks-lembut">
              Ulasan akan tampil di halaman ini setelah diverifikasi admin.
            </p>
          </div>

          {state?.error ? (
            <p
              role="alert"
              className="rounded-[12px] border border-bahaya/30 bg-bahaya-latar px-3.5 py-2.5 text-xs font-medium text-bahaya"
            >
              {state.error}
            </p>
          ) : null}

          {state?.success ? (
            <p
              role="status"
              className="rounded-[12px] border border-sukses/30 bg-sukses-latar px-3.5 py-2.5 text-xs font-medium text-sukses"
            >
              {state.success}
            </p>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-teks">Rating</span>
            <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Pilih rating">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  role="radio"
                  aria-checked={rating === num}
                  aria-label={`${num} bintang`}
                  onClick={() => setRating(num)}
                  className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] border transition-colors ${
                    num <= rating
                      ? "border-harga/40 bg-harga-latar text-harga"
                      : "border-garis bg-latar text-teks-lembut"
                  }`}
                >
                  <StarIcon filled={num <= rating} />
                </button>
              ))}
              <span className="numeric ml-2 text-xs font-semibold text-teks-lembut">
                {rating} / 5
              </span>
            </div>
            {errors.rating ? <p className="text-xs font-medium text-bahaya">{errors.rating}</p> : null}
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Nama Anda"
              name="nama"
              placeholder="Contoh: Nadia Putri"
              required
            />
            {errors.nama ? <p className="text-xs font-medium text-bahaya">{errors.nama}</p> : null}
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Komentar"
              name="komentar"
              textarea
              placeholder="Bagikan pengalaman Anda soal kebersihan, kecepatan mesin, atau layanan..."
              required
            />
            {errors.komentar ? (
              <p className="text-xs font-medium text-bahaya">{errors.komentar}</p>
            ) : null}
          </div>

          <Tombol type="submit" disabled={isPending}>
            {isPending ? "Mengirim..." : "Kirim Ulasan"}
          </Tombol>
        </form>
      </div>
    </section>
  );
}
