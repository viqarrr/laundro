"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";

const FAV_KEY = "laundro_favorites_v1";
const COMPARE_KEY = "laundro_compare_v1";
const RECENT_KEY = "laundro_recent_v1";

const UserPrefsContext = createContext(null);

function toSnapshot(produk) {
  return {
    id: produk.id,
    nama: produk.nama,
    harga: produk.harga,
    harga_coret: produk.harga_coret || null,
    badge: produk.badge || null,
    foto_url: produk.foto_url || "/images/hero-machines.jpg",
    kategori: produk.kategori || "",
    max_capacity_kg: produk.max_capacity_kg || 7,
    cycle_duration_minutes: produk.cycle_duration_minutes || 40,
    requires_washer: Boolean(produk.requires_washer),
    requires_dryer: Boolean(produk.requires_dryer),
    stok: produk.stok ?? 10,
  };
}

export function UserPrefsProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [compareItems, setCompareItems] = useState([]);
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    try {
      const favRaw = window.localStorage.getItem(FAV_KEY);
      if (favRaw) {
        const parsed = JSON.parse(favRaw);
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
      const cmpRaw = window.localStorage.getItem(COMPARE_KEY);
      if (cmpRaw) {
        const parsed = JSON.parse(cmpRaw);
        if (Array.isArray(parsed)) setCompareItems(parsed.slice(0, 2));
      }
      const recRaw = window.localStorage.getItem(RECENT_KEY);
      if (recRaw) {
        const parsed = JSON.parse(recRaw);
        if (Array.isArray(parsed)) setRecentItems(parsed.slice(0, 6));
      }
    } catch {
      // Abaikan error akses localStorage
    }
    setHydrated(true);
  }, []);

  const toggleFavorite = useCallback((produkId) => {
    const idNum = Number(produkId);
    setFavorites((prev) => {
      const exists = prev.includes(idNum);
      const next = exists ? prev.filter((id) => id !== idNum) : [...prev, idNum];
      try {
        window.localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {
        // Abaikan
      }
      return next;
    });
  }, []);

  const toggleCompare = useCallback((produk) => {
    const snap = toSnapshot(produk);
    setCompareItems((prev) => {
      const exists = prev.some((item) => item.id === snap.id);
      let next;
      if (exists) {
        next = prev.filter((item) => item.id !== snap.id);
      } else if (prev.length >= 2) {
        next = [prev[1], snap];
      } else {
        next = [...prev, snap];
      }
      try {
        window.localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      } catch {
        // Abaikan
      }
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareItems([]);
    try {
      window.localStorage.setItem(COMPARE_KEY, JSON.stringify([]));
    } catch {
      // Abaikan
    }
  }, []);

  const recordRecentView = useCallback((produk) => {
    if (!produk?.id) return;
    const snap = toSnapshot(produk);
    setRecentItems((prev) => {
      const filtered = prev.filter((item) => item.id !== snap.id);
      const next = [snap, ...filtered].slice(0, 6);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // Abaikan
      }
      return next;
    });
  }, []);

  const value = {
    hydrated,
    favorites,
    favoriteCount: favorites.length,
    isFavorite: (id) => favorites.includes(Number(id)),
    toggleFavorite,
    compareItems,
    compareCount: compareItems.length,
    isCompared: (id) => compareItems.some((item) => item.id === Number(id)),
    toggleCompare,
    clearCompare,
    recentItems,
    recordRecentView,
  };

  return (
    <UserPrefsContext.Provider value={value}>
      {children}

      {hydrated && compareItems.length > 0 ? (
        <div className="fixed right-4 bottom-4 left-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-full border border-garis-tegas bg-latar/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
          <div className="min-w-0">
            <p className="numeric text-xs font-semibold text-teks">
              Bandingkan Layanan ({compareItems.length}/2)
            </p>
            <p className="truncate text-[11px] text-teks-lembut">
              {compareItems.map((i) => i.nama).join(" vs ")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={clearCompare}
              className="cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold text-teks-lembut hover:text-bahaya"
            >
              Reset
            </button>
            <Link
              href="/bandingkan"
              className="inline-flex min-h-[34px] items-center rounded-full bg-utama px-3.5 py-1 text-xs font-semibold text-white hover:bg-utama-gelap"
            >
              Bandingkan &#8250;
            </Link>
          </div>
        </div>
      ) : null}
    </UserPrefsContext.Provider>
  );
}

export function useUserPrefs() {
  const ctx = useContext(UserPrefsContext);
  if (!ctx) {
    throw new Error("useUserPrefs harus dipakai di dalam UserPrefsProvider");
  }
  return ctx;
}
