"use client";

import Link from "next/link";
import { useUserPrefs } from "@/components/UserPrefsProvider";
import { formatRupiah } from "@/lib/format";

export default function TerakhirDilihat({ excludeId = null }) {
  const { hydrated, recentItems } = useUserPrefs();

  if (!hydrated) return null;

  const items = recentItems.filter((item) =>
    excludeId ? Number(item.id) !== Number(excludeId) : true
  );

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="judul-terakhir-dilihat" className="border-t border-garis pt-10">
      <div className="mb-5 flex items-baseline justify-between gap-2">
        <h2
          id="judul-terakhir-dilihat"
          className="text-[22px] font-semibold tracking-[-0.01em] text-teks"
        >
          Terakhir Dilihat
        </h2>
        <span className="numeric text-xs font-medium text-teks-lembut">
          {items.length} layanan terakhir
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/produk/${item.id}`}
            className="flex items-center gap-3.5 rounded-[16px] border border-garis bg-latar p-3.5 transition-colors hover:border-garis-tegas"
          >
            <img
              src={item.foto_url || "/images/hero-machines.jpg"}
              alt={item.nama}
              className="h-14 w-14 shrink-0 rounded-[10px] border border-garis bg-permukaan object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-teks-lembut">{item.kategori}</p>
              <p className="truncate text-sm font-semibold text-teks">{item.nama}</p>
              <p className="numeric mt-0.5 text-xs font-semibold text-utama">
                {formatRupiah(item.harga)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
