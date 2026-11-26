"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Tombol from "@/components/Tombol";
import { hapusUlasanAction, ubahStatusUlasanAction } from "@/app/admin/ulasan-actions";

const BADGE_MAP = {
  pending: { label: "Menunggu", cls: "bg-harga-latar text-harga" },
  approved: { label: "Disetujui", cls: "bg-sukses-latar text-sukses" },
  rejected: { label: "Ditolak", cls: "bg-bahaya-latar text-bahaya" },
};

function formatTanggal(iso) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function ModerasiUlasan({ daftarUlasan = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pesanError, setPesanError] = useState("");
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(null);

  function jalankan(fn) {
    setPesanError("");
    startTransition(async () => {
      const res = await fn();
      if (!res?.ok) {
        setPesanError(res?.error || "Gagal memproses ulasan.");
        return;
      }
      router.refresh();
    });
  }

  function konfirmasiDanHapus() {
    if (!konfirmasiHapus) return;
    const target = konfirmasiHapus;
    setKonfirmasiHapus(null);
    jalankan(() => hapusUlasanAction(target.id));
  }

  if (daftarUlasan.length === 0) {
    return (
      <div className="rounded-[20px] border border-garis bg-permukaan p-8 text-center">
        <p className="text-base font-semibold text-teks">Belum ada ulasan pada filter ini</p>
        <p className="mt-1 text-sm text-teks-lembut">
          Ulasan baru dari halaman detail layanan akan masuk dengan status menunggu moderasi.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pesanError ? (
        <p
          role="alert"
          className="rounded-[14px] border border-bahaya/30 bg-bahaya-latar px-4 py-3 text-sm font-medium text-bahaya"
        >
          {pesanError}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {daftarUlasan.map((u) => {
          const badge = BADGE_MAP[u.status] || BADGE_MAP.pending;
          return (
            <article
              key={u.id}
              className="flex flex-col justify-between gap-3 rounded-[20px] border border-garis bg-latar p-5"
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-teks">{u.nama}</p>
                    <p className="text-xs text-teks-lembut">
                      {u.produk?.nama || `Layanan #${u.produk_id}`} ·{" "}
                      <span className="numeric">{formatTanggal(u.created_at)}</span>
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>

                <p className="numeric text-xs font-semibold text-harga">Rating: {u.rating} / 5</p>
                <p className="text-sm leading-relaxed text-teks-lembut">{u.komentar}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-garis pt-3">
                {u.status !== "approved" ? (
                  <Tombol
                    type="button"
                    disabled={isPending}
                    onClick={() => jalankan(() => ubahStatusUlasanAction(u.id, "approved"))}
                    className="min-h-[36px] px-3.5 py-1 text-xs"
                  >
                    Setujui
                  </Tombol>
                ) : null}
                {u.status !== "rejected" ? (
                  <Tombol
                    type="button"
                    varian="garis"
                    disabled={isPending}
                    onClick={() => jalankan(() => ubahStatusUlasanAction(u.id, "rejected"))}
                    className="min-h-[36px] px-3.5 py-1 text-xs"
                  >
                    Tolak
                  </Tombol>
                ) : null}
                <Tombol
                  type="button"
                  varian="bahaya"
                  disabled={isPending}
                  onClick={() => setKonfirmasiHapus(u)}
                  className="ml-auto min-h-[36px] px-3.5 py-1 text-xs"
                >
                  Hapus
                </Tombol>
              </div>
            </article>
          );
        })}
      </div>

      {konfirmasiHapus ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-[20px] border border-garis bg-latar p-6">
            <h2 className="text-lg font-semibold text-teks">Hapus ulasan?</h2>
            <p className="mt-2 text-sm text-teks-lembut">
              Ulasan dari <span className="font-semibold text-teks">{konfirmasiHapus.nama}</span>{" "}
              akan dihapus permanen.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Tombol
                type="button"
                varian="garis"
                onClick={() => setKonfirmasiHapus(null)}
                className="min-h-[40px] px-4 py-2 text-sm"
              >
                Batal
              </Tombol>
              <Tombol
                type="button"
                varian="bahaya"
                onClick={konfirmasiDanHapus}
                className="min-h-[40px] border-bahaya bg-bahaya px-4 py-2 text-sm text-white hover:bg-bahaya/90 hover:text-white"
              >
                Ya, Hapus
              </Tombol>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
