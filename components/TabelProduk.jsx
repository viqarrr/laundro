"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/format";
import Tombol from "@/components/Tombol";
import {
  hapusProdukAction,
  simpanUrutanProdukAction,
  toggleAktifProdukAction,
} from "@/app/admin/produk-actions";

export default function TabelProduk({ daftarProduk }) {
  const router = useRouter();
  const [items, setItems] = useState(daftarProduk || []);
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [pesanError, setPesanError] = useState("");
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(null);

  useEffect(() => {
    setItems(daftarProduk || []);
  }, [daftarProduk]);

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

  function simpanUrutanBaru(nextItems) {
    const previousItems = items;
    setItems(nextItems);
    setPesanError("");
    setIsSavingOrder(true);

    startTransition(async () => {
      const res = await simpanUrutanProdukAction(nextItems.map((item) => item.id));
      setIsSavingOrder(false);
      if (res && res.ok === false) {
        setItems(previousItems);
        setPesanError(res.error || "Gagal menyimpan urutan baru.");
        return;
      }
      router.refresh();
    });
  }

  function handleDragStart(event, id) {
    if (isPending) {
      event.preventDefault();
      return;
    }
    setDraggedId(id);
    setDragOverId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(id));
  }

  function handleDragOver(event, targetId) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverId !== targetId) {
      setDragOverId(targetId);
    }
  }

  function handleDrop(event, targetId) {
    event.preventDefault();
    const sourceId = draggedId ?? Number(event.dataTransfer.getData("text/plain"));
    setDraggedId(null);
    setDragOverId(null);

    if (!sourceId || sourceId === targetId) return;

    const fromIdx = items.findIndex((item) => item.id === sourceId);
    const toIdx = items.findIndex((item) => item.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const nextItems = [...items];
    const [moved] = nextItems.splice(fromIdx, 1);
    nextItems.splice(toIdx, 0, moved);

    simpanUrutanBaru(nextItems);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverId(null);
  }

  function handleHandleKeyDown(event, index) {
    if (isPending) return;
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    const targetIndex = event.key === "ArrowUp" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const nextItems = [...items];
    const [moved] = nextItems.splice(index, 1);
    nextItems.splice(targetIndex, 0, moved);
    simpanUrutanBaru(nextItems);
  }

  function konfirmasiDanHapus() {
    if (!konfirmasiHapus) return;
    const target = konfirmasiHapus;
    setKonfirmasiHapus(null);
    jalankanAksi(target.id, () => hapusProdukAction(target.id));
  }

  if (!items || items.length === 0) {
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
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-teks-lembut">
        <span>Seret baris melalui ikon pegangan di kiri untuk mengatur urutan tampil.</span>
        {isSavingOrder ? (
          <span className="font-semibold text-utama">Menyimpan urutan...</span>
        ) : null}
      </div>

      {pesanError ? (
        <p
          role="alert"
          className="rounded-[14px] border border-bahaya/30 bg-bahaya-latar px-4 py-3 text-sm font-medium text-bahaya"
        >
          {pesanError}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-[20px] border border-garis bg-latar">
        <table className="w-full min-w-[740px] text-left text-sm">
          <thead className="bg-permukaan text-xs font-semibold uppercase tracking-[0.03em] text-teks-lembut">
            <tr>
              <th className="w-12 px-3 py-3.5 text-center">
                <span className="sr-only">Geser urutan</span>
              </th>
              <th className="px-4 py-3.5">Layanan</th>
              <th className="px-4 py-3.5">Kategori</th>
              <th className="px-4 py-3.5">Kapasitas &amp; Durasi</th>
              <th className="px-4 py-3.5">Tarif</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((produk, index) => {
              const sibuk = isPending && activeId === produk.id;
              const adaPromo = Number(produk.harga_coret) > Number(produk.harga);
              const isDragged = draggedId === produk.id;
              const isDropTarget = dragOverId === produk.id && draggedId !== produk.id;

              return (
                <tr
                  key={produk.id}
                  draggable={!isPending}
                  onDragStart={(e) => handleDragStart(e, produk.id)}
                  onDragOver={(e) => handleDragOver(e, produk.id)}
                  onDrop={(e) => handleDrop(e, produk.id)}
                  onDragEnd={handleDragEnd}
                  className={`border-t border-garis transition-colors ${
                    isDragged
                      ? "bg-utama-lembut/40 opacity-50"
                      : isDropTarget
                        ? "bg-utama-lembut/25 ring-2 ring-inset ring-utama"
                        : "hover:bg-permukaan/50"
                  }`}
                >
                  <td className="px-3 py-3.5 text-center">
                    <button
                      type="button"
                      onKeyDown={(e) => handleHandleKeyDown(e, index)}
                      aria-label={`Geser urutan ${produk.nama} (gunakan drag atau panah atas/bawah)`}
                      title="Seret untuk mengubah urutan"
                      className="inline-flex h-9 w-9 cursor-grab items-center justify-center rounded-[10px] text-teks-lembut transition-colors hover:bg-permukaan hover:text-teks active:cursor-grabbing"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <circle cx="5.5" cy="3.5" r="1.2" fill="currentColor" />
                        <circle cx="10.5" cy="3.5" r="1.2" fill="currentColor" />
                        <circle cx="5.5" cy="8" r="1.2" fill="currentColor" />
                        <circle cx="10.5" cy="8" r="1.2" fill="currentColor" />
                        <circle cx="5.5" cy="12.5" r="1.2" fill="currentColor" />
                        <circle cx="10.5" cy="12.5" r="1.2" fill="currentColor" />
                      </svg>
                    </button>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={produk.foto_url || "/images/hero-machines.jpg"}
                        alt={produk.nama}
                        draggable={false}
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
