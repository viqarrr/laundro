"use client";

import { useCart } from "@/components/CartProvider";

export default function CartHeaderButton() {
  const { totalItems, hydrated, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label="Buka keranjang layanan"
      className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full border border-garis bg-permukaan px-3 py-1.5 text-xs font-semibold text-teks whitespace-nowrap transition-colors hover:border-garis-tegas"
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M2.5 3H4.2L5.5 10.2H12.3L13.5 5H4.8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6.2" cy="12.7" r="1" fill="currentColor" />
        <circle cx="11.6" cy="12.7" r="1" fill="currentColor" />
      </svg>
      <span>Keranjang</span>
      {hydrated && totalItems > 0 ? (
        <span className="numeric inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-utama px-1.5 text-[11px] font-semibold text-white">
          {totalItems}
        </span>
      ) : null}
    </button>
  );
}
