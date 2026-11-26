"use client";

import { useEffect } from "react";
import { useCart } from "@/components/CartProvider";
import { formatRupiah } from "@/lib/format";
import { toko } from "@/lib/toko";
import { catatKlikWa } from "@/lib/wa-tracking";

function normalisasiNomorWa(nomor) {
  const digits = String(nomor || "").replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  return digits;
}

export default function CartDrawer({ pengaturan = null }) {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    subtotal,
    estimasiDp,
  } = useCart();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeCart();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const namaGerai = pengaturan?.nama_gerai || toko.nama;
  const nomorTujuan = normalisasiNomorWa(toko.nomorWhatsApp || pengaturan?.nomor_wa);
  const barisItem = items
    .map((item, idx) => {
      const totalBaris = Number(item.hargaSatuan || 0) * Number(item.jumlah || 0);
      const infoVarian = item.varianNama ? ` (${item.varianNama})` : "";
      const infoBerat = item.estimasiBeratKg ? `, est. ${item.estimasiBeratKg} kg` : "";
      return `${idx + 1}. ${item.nama}${infoVarian} x${item.jumlah} tabung/unit${infoBerat} - ${formatRupiah(totalBaris)}`;
    })
    .join("\n");

  const pesanWa = [
    `Halo ${namaGerai}, saya ingin memesan layanan berikut:`,
    barisItem,
    "",
    `Subtotal: ${formatRupiah(subtotal)}`,
    `Estimasi DP (50%): ${formatRupiah(estimasiDp)}`,
    "Mohon info ketersediaan slot mesin dan konfirmasi pembayarannya.",
  ].join("\n");

  const tautanWa = `https://wa.me/${nomorTujuan}?text=${encodeURIComponent(pesanWa)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs"
      onClick={closeCart}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-garis bg-latar shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-garis px-5 py-4">
          <div>
            <h2 id="cart-drawer-title" className="text-lg font-semibold text-teks">
              Keranjang Layanan
            </h2>
            <p className="numeric text-xs text-teks-lembut">{totalItems} unit dipilih</p>
          </div>

          <button
            type="button"
            onClick={closeCart}
            aria-label="Tutup keranjang"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-permukaan text-teks transition-colors hover:bg-garis"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="rounded-[20px] border border-garis bg-permukaan p-8 text-center">
              <p className="text-base font-semibold text-teks">Keranjang masih kosong</p>
              <p className="mt-1 text-sm text-teks-lembut">
                Tambahkan paket cuci, pengering, atau add-on untuk dipesan bersamaan lewat WhatsApp.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => {
                const totalItem = Number(item.hargaSatuan || 0) * Number(item.jumlah || 0);
                return (
                  <li
                    key={item.key}
                    className="flex flex-col gap-3 rounded-[16px] border border-garis bg-permukaan p-4"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={item.fotoUrl || "/images/hero-machines.jpg"}
                        alt={item.nama}
                        className="h-14 w-14 shrink-0 rounded-[10px] border border-garis bg-latar object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-teks">{item.nama}</p>
                        {item.varianNama ? (
                          <p className="text-xs text-teks-lembut">{item.varianNama}</p>
                        ) : null}
                        <p className="numeric mt-1 text-xs font-medium text-teks-lembut">
                          {formatRupiah(item.hargaSatuan)} / unit
                          {item.estimasiBeratKg ? ` · Est. ${item.estimasiBeratKg} kg` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        aria-label={`Hapus ${item.nama}`}
                        className="cursor-pointer rounded-full px-2 py-1 text-xs font-semibold text-bahaya hover:bg-bahaya-latar"
                      >
                        Hapus
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-garis pt-2.5">
                      <div className="inline-flex items-center gap-1 rounded-full border border-garis bg-latar p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, -1)}
                          aria-label={`Kurangi jumlah ${item.nama}`}
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-sm font-semibold text-teks hover:bg-permukaan"
                        >
                          -
                        </button>
                        <span className="numeric min-w-[28px] text-center text-xs font-semibold text-teks">
                          {item.jumlah}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, 1)}
                          aria-label={`Tambah jumlah ${item.nama}`}
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-sm font-semibold text-teks hover:bg-permukaan"
                        >
                          +
                        </button>
                      </div>

                      <span className="numeric text-sm font-semibold text-teks">
                        {formatRupiah(totalItem)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-garis bg-permukaan p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-teks-lembut">Subtotal Layanan</span>
              <span className="numeric text-base font-semibold text-teks">
                {formatRupiah(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-teks-lembut">Estimasi DP (50%)</span>
              <span className="numeric font-semibold text-utama">{formatRupiah(estimasiDp)}</span>
            </div>

            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={clearCart}
                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-full border border-garis-tegas bg-latar px-4 py-2 text-xs font-semibold text-teks-lembut transition-colors hover:border-bahaya hover:text-bahaya"
              >
                Kosongkan
              </button>

              <a
                href={tautanWa}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  const uniqueIds = Array.from(
                    new Set(items.map((item) => item.produkId).filter(Boolean))
                  );
                  if (uniqueIds.length === 0) {
                    catatKlikWa({ produkId: null, sumber: "keranjang" });
                    return;
                  }
                  uniqueIds.forEach((pid) => {
                    catatKlikWa({ produkId: pid, sumber: "keranjang" });
                  });
                }}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-utama px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-utama-gelap active:scale-[0.98]"
              >
                Pesan Semua via WhatsApp
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
