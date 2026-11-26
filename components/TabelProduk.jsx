"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/format";
import Tombol from "@/components/Tombol";
import {
  hapusProdukAction,
  toggleAktifProdukAction,
  ubahUrutanProdukAction,
} from "@/app/admin/produk-actions";

export default function TabelProduk({ daftarProduk }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState(null);
  const [pesanError, setPesanError] = useState("");
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(null);

  function jalankanAksi(id, aksiFn) {
    setPesanError("");
    setActiveId(id);
    startTransition(async () => {
      const res = await aksiFn();
      setActiveId(null);
      if (res && res.ok === false) {
        setPesanError(res.error || "Aksi gagal dijalankan.");
        return;
      }
      router.refresh();
    });
  }

  function konfirmasiDanHapus() {
    if (!konfirmasiHapus) return;
    const target = konfirmasiHapus;
    setKonfirmasiHapus(null);
    jalankanAksi(target.id, () => hapusProdukAction(target.id));
  }

  if (!daftarProduk || daftarProduk.length === 0) {
    return (
      <div className="rounded-[20px] border border-garis bg-permukaan p-8 text-center">
        <p className="text-[17px] font-semibold text-teks">Tidak ada paket layanan ditemukan</p>
        <p className="mt-1 text-sm text-teks-lembut">
          Coba ubah kata kunci pencarian/filter atau tambahkan paket layanan baru.
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

      <div className="overflow-x-auto rounded-[20px] border border-garis bg-latar">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-permukaan text-xs font-semibold uppercase tracking-[0.03em] text-teks-lembut">
            <tr>
              <th className="px-4 py-3.5">Layanan</th>
              <th className="px-4 py-3.5">Kategori</th>
              <th className="px-4 py-3.5">Kapasitas &amp; Durasi</th>
              <th className="px-4 py-3.5">Tarif</th>
              <th className="px-4 py-3.5">Urutan</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {daftarProduk.map((produk, index) => {
              const sibuk = isPending && activeId === produk.id;
              const adaPromo = Number(produk.harga_coret) > Number(produk.harga);

              return (
                <tr key={produk.id} className="border-t border-garis transition-colors hover:bg-permukaan/50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={produk.foto_url || "/images/hero-machines.jpg"}
                        alt={produk.nama}
                        className="h-11 w-11 shrink-0 rounded-[8px] border border-garis bg-permukaan object-cover"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-teks">{produk.nama}</p>
                        {produk.badge ? (
                          <span className="mt-0.5 inline-block rounded-full bg-utama-lembut px-2 py-0.5 text-[11px] font-semibold text-utama">
                            {produk.badge}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-teks-lembut">{produk.kategori || "-"}</td>

                  <td className="numeric px-4 py-3.5 text-teks-lembut">
                    {produk.max_capacity_kg || 7} kg · {produk.cycle_duration_minutes || 40} mnt
                  </td>

                  <td className="numeric px-4 py-3.5">
                    <span className="font-semibold text-teks">{formatRupiah(produk.harga)}</span>
                    {adaPromo ? (
                      <span className="block text-xs text-teks-lembut line-through">
                        {formatRupiah(produk.harga_coret)}
                      </span>
                    ) : null}
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        disabled={sibuk || index === 0}
                        onClick={() =>
                          jalankanAksi(produk.id, () => ubahUrutanProdukAction(produk.id, "naik"))
                        }
                        aria-label={`Naikkan urutan ${produk.nama}`}
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[8px] border border-garis bg-latar text-xs font-semibold text-teks transition-colors hover:border-utama hover:text-utama disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={sibuk || index === daftarProduk.length - 1}
                        onClick={() =>
                          jalankanAksi(produk.id, () => ubahUrutanProdukAction(produk.id, "turun"))
                        }
                        aria-label={`Turunkan urutan ${produk.nama}`}
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[8px] border border-garis bg-latar text-xs font-semibold text-teks transition-colors hover:border-utama hover:text-utama disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ↓
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      disabled={sibuk}
                      onClick={() =>
                        jalankanAksi(produk.id, () =>
                          toggleAktifProdukAction(produk.id, !produk.aktif)
                        )
                      }
                      className={`inline-flex min-h-[32px] cursor-pointer items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        produk.aktif
                          ? "bg-sukses-latar text-sukses hover:opacity-85"
                          : "bg-permukaan text-teks-lembut hover:text-teks"
                      }`}
                    >
                      {produk.aktif ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-2">
                      <Tombol
                        href={`/admin/produk/${produk.id}/ubah`}
                        varian="garis"
                        className="min-h-[36px] px-3.5 py-1.5 text-xs"
                      >
                        Ubah
                      </Tombol>
                      <Tombol
                        type="button"
                        varian="bahaya"
                        disabled={sibuk}
                        onClick={() => setKonfirmasiHapus(produk)}
                        className="min-h-[36px] px-3.5 py-1.5 text-xs"
                      >
                        Hapus
                      </Tombol>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {konfirmasiHapus ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-hapus-judul"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-[20px] border border-garis bg-latar p-6">
            <h2 id="dialog-hapus-judul" className="text-lg font-semibold text-teks">
              Hapus paket layanan?
            </h2>
            <p className="mt-2 text-sm text-teks-lembut">
              Paket <span className="font-semibold text-teks">{konfirmasiHapus.nama}</span> akan
              dihapus permanen dari katalog. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
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
