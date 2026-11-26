"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CustomSelect from "@/components/CustomSelect";
import KartuProduk from "@/components/KartuProduk";
import Tombol from "@/components/Tombol";
import { useUserPrefs } from "@/components/UserPrefsProvider";

const PAGE_SIZE = 6;

const SORT_OPTIONS = [
  { value: "bawaan", label: "Urutan Bawaan" },
  { value: "termurah", label: "Harga Termurah" },
  { value: "termahal", label: "Harga Termahal" },
  { value: "terbaru", label: "Terbaru" },
  { value: "nama-az", label: "Nama A-Z" },
];

export default function KatalogInteraktif({
  daftarProduk = [],
  daftarKategori = [],
  initialQuery = "",
  initialKategori = "",
  initialSort = "bawaan",
}) {
  const { hydrated, isFavorite, favoriteCount } = useUserPrefs();
  const [query, setQuery] = useState(initialQuery);
  const [selectedKategori, setSelectedKategori] = useState(initialKategori);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState(
    SORT_OPTIONS.some((opt) => opt.value === initialSort) ? initialSort : "bawaan"
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Sinkronisasi URL query parameter tanpa reload halaman atau lonjakan scroll
  useEffect(() => {
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    if (selectedKategori) params.set("kategori", selectedKategori);
    if (sortBy && sortBy !== "bawaan") params.set("sort", sortBy);

    const qs = params.toString();
    const nextUrl = qs ? `/?${qs}` : "/";
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [query, selectedKategori, sortBy]);

  const kategoriItems = useMemo(() => {
    if (daftarKategori.length > 0) {
      return daftarKategori.map((k) => ({
        nama: k.nama,
        slug: k.slug,
      }));
    }
    const uniqueNames = Array.from(
      new Set(daftarProduk.map((p) => p.kategori).filter(Boolean))
    );
    return uniqueNames.map((nama) => ({
      nama,
      slug: nama.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }));
  }, [daftarKategori, daftarProduk]);

  const activeCategoryObj = useMemo(
    () =>
      kategoriItems.find(
        (k) =>
          k.nama.toLowerCase() === selectedKategori.toLowerCase() ||
          k.slug.toLowerCase() === selectedKategori.toLowerCase()
      ) || null,
    [kategoriItems, selectedKategori]
  );

  const filteredAndSorted = useMemo(() => {
    const qLower = query.trim().toLowerCase();

    const filtered = daftarProduk.filter((item) => {
      if (onlyFavorites && (!hydrated || !isFavorite(item.id))) {
        return false;
      }

      if (selectedKategori) {
        const catMatch =
          String(item.kategori || "").toLowerCase() ===
          (activeCategoryObj ? activeCategoryObj.nama.toLowerCase() : selectedKategori.toLowerCase());
        if (!catMatch) return false;
      }

      if (qLower) {
        const matchNama = String(item.nama || "").toLowerCase().includes(qLower);
        const matchKat = String(item.kategori || "").toLowerCase().includes(qLower);
        const matchDesc = String(item.deskripsi || "").toLowerCase().includes(qLower);
        if (!matchNama && !matchKat && !matchDesc) return false;
      }

      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === "termurah") {
        return Number(a.harga) - Number(b.harga);
      }
      if (sortBy === "termahal") {
        return Number(b.harga) - Number(a.harga);
      }
      if (sortBy === "terbaru") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (sortBy === "nama-az") {
        return String(a.nama || "").localeCompare(String(b.nama || ""), "id");
      }
      // Bawaan: urutan ASC, created_at DESC
      const diffUrutan = Number(a.urutan ?? 0) - Number(b.urutan ?? 0);
      if (diffUrutan !== 0) return diffUrutan;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return sorted;
  }, [daftarProduk, query, selectedKategori, activeCategoryObj, sortBy, onlyFavorites, hydrated, isFavorite]);

  const displayedItems = filteredAndSorted.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSorted.length;

  function handleQueryChange(nextVal) {
    setQuery(nextVal);
    setVisibleCount(PAGE_SIZE);
  }

  function handleKategoriSelect(katNama) {
    setOnlyFavorites(false);
    setSelectedKategori(katNama);
    setVisibleCount(PAGE_SIZE);
  }

  function handleSortChange(nextSort) {
    setSortBy(nextSort);
    setVisibleCount(PAGE_SIZE);
  }

  function handleResetAll() {
    setQuery("");
    setSelectedKategori("");
    setOnlyFavorites(false);
    setSortBy("bawaan");
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar Pencarian, Filter Chip Kategori, & Urutan */}
      <div className="flex flex-col gap-4 rounded-[20px] border border-garis bg-permukaan p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex min-w-[230px] flex-1 items-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 text-teks-lembut"
            >
              <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M10.5 10.5L13.5 13.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>

            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Cari paket cuci, pengering, atau add-on..."
              aria-label="Cari paket layanan"
              className="min-h-[44px] w-full rounded-[12px] border border-garis-tegas bg-latar pr-10 pl-10 text-sm text-teks placeholder:text-teks-lembut transition-colors hover:border-utama/70 focus:border-utama focus:outline-none focus:ring-2 focus:ring-utama/15"
            />

            {query ? (
              <button
                type="button"
                onClick={() => handleQueryChange("")}
                aria-label="Hapus kata kunci pencarian"
                className="absolute right-2.5 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-permukaan text-teks-lembut transition-colors hover:bg-garis hover:text-teks"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path
                    d="M3 3L9 9M9 3L3 9"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>

          <CustomSelect
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={handleSortChange}
            ariaLabel="Urutkan paket layanan"
            className="w-full sm:w-[200px]"
          />
        </div>

        {/* Filter Chip Kategori + Tautan Halaman Kategori */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter kategori">
            <button
              type="button"
              onClick={() => handleKategoriSelect("")}
              aria-pressed={!onlyFavorites && selectedKategori === ""}
              className={`inline-flex min-h-[38px] cursor-pointer items-center rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                !onlyFavorites && selectedKategori === ""
                  ? "bg-utama text-white"
                  : "border border-garis bg-latar text-teks-lembut hover:border-garis-tegas hover:text-teks"
              }`}
            >
              Semua
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyFavorites((prev) => !prev);
                setVisibleCount(PAGE_SIZE);
              }}
              aria-pressed={onlyFavorites}
              className={`inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                onlyFavorites
                  ? "bg-bahaya text-white"
                  : "border border-garis bg-latar text-teks-lembut hover:border-garis-tegas hover:text-teks"
              }`}
            >
              <span>Favorit</span>
              {hydrated && favoriteCount > 0 ? (
                <span className="numeric rounded-full bg-latar/20 px-1.5 text-[11px]">
                  {favoriteCount}
                </span>
              ) : null}
            </button>

            {kategoriItems.map((kat) => {
              const aktif =
                activeCategoryObj?.nama.toLowerCase() === kat.nama.toLowerCase();
              return (
                <button
                  key={kat.slug || kat.nama}
                  type="button"
                  onClick={() => handleKategoriSelect(kat.nama)}
                  aria-pressed={aktif}
                  className={`inline-flex min-h-[38px] cursor-pointer items-center rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    aktif
                      ? "bg-utama text-white"
                      : "border border-garis bg-latar text-teks-lembut hover:border-garis-tegas hover:text-teks"
                  }`}
                >
                  {kat.nama}
                </button>
              );
            })}
          </div>

          {activeCategoryObj?.slug ? (
            <Link
              href={`/kategori/${activeCategoryObj.slug}`}
              className="inline-flex min-h-[36px] items-center text-xs font-semibold text-utama hover:underline"
            >
              Buka halaman {activeCategoryObj.nama} &#8250;
            </Link>
          ) : (
            <span className="numeric text-xs font-medium text-teks-lembut">
              Menampilkan {displayedItems.length} dari {filteredAndSorted.length} layanan
            </span>
          )}
        </div>
      </div>

      {/* Daftar Kartu Layanan */}
      {filteredAndSorted.length === 0 ? (
        <div className="rounded-[20px] border border-garis bg-permukaan p-10 text-center">
          <p className="text-[17px] font-semibold text-teks">
            Tidak ada layanan yang sesuai dengan filter Anda
          </p>
          <p className="mt-1 text-sm text-teks-lembut">
            Coba gunakan kata kunci lain atau tampilkan semua kategori layanan.
          </p>
          <Tombol type="button" varian="garis" onClick={handleResetAll} className="mt-4">
            Reset Filter
          </Tombol>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {displayedItems.map((produk) => (
              <KartuProduk key={produk.id} produk={produk} />
            ))}
          </div>

          {/* Tombol Muat Lebih Banyak (US-16) */}
          {hasMore ? (
            <div className="flex flex-col items-center gap-2 pt-2">
              <Tombol
                type="button"
                varian="garis"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                Muat Lebih Banyak ({filteredAndSorted.length - visibleCount} lagi)
              </Tombol>
            </div>
          ) : null}
        </>
      )}

      {/* Tautan Cepat Kategori Khusus (US-49) */}
      {kategoriItems.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-garis pt-4 text-xs text-teks-lembut">
          <span className="font-semibold text-teks">Jelajahi per kategori:</span>
          {kategoriItems.map((kat) => (
            <Link
              key={kat.slug}
              href={`/kategori/${kat.slug}`}
              className="font-medium text-utama hover:underline"
            >
              {kat.nama}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
