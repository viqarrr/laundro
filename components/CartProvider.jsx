"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "laundro_cart_v1";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Abaikan error akses localStorage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Abaikan error penyimpanan localStorage
    }
  }, [items, hydrated]);

  function addItem(newItem) {
    const qtyToAdd = Math.max(1, Number(newItem.jumlah || 1));
    setItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.key === newItem.key);
      if (existingIdx !== -1) {
        return prev.map((item, idx) =>
          idx === existingIdx
            ? {
                ...item,
                jumlah: item.jumlah + qtyToAdd,
                estimasiBeratKg:
                  Number(item.estimasiBeratKg || 0) + Number(newItem.estimasiBeratKg || 0),
              }
            : item
        );
      }
      return [...prev, { ...newItem, jumlah: qtyToAdd }];
    });
  }

  function updateQuantity(key, delta) {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.key !== key) return item;
          const nextQty = item.jumlah + delta;
          if (nextQty <= 0) return null;
          return { ...item, jumlah: nextQty };
        })
        .filter(Boolean)
    );
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  function clearCart() {
    setItems([]);
  }

  const summary = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + Number(item.jumlah || 0), 0);
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.hargaSatuan || 0) * Number(item.jumlah || 0),
      0
    );
    const estimasiDp = Math.round(subtotal * 0.5);
    return { totalItems, subtotal, estimasiDp };
  }, [items]);

  const value = {
    items,
    hydrated,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    ...summary,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart harus dipakai di dalam CartProvider");
  }
  return ctx;
}
