"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import CustomSelect from "@/components/CustomSelect";
import Tombol from "@/components/Tombol";

const DEBOUNCE_MS = 1000;

const STATUS_OPTIONS = [
  { value: "semua", label: "Semua Status" },
  { value: "aktif", label: "Aktif" },
  { value: "nonaktif", label: "Nonaktif" },
];

function buatUrlFilter({ q, status }) {
  const params = new URLSearchParams();
  const trimmedQ = q.trim();
  if (trimmedQ) params.set("q", trimmedQ);
  if (status && status !== "semua") params.set("status", status);
  const qs = params.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

export default function FilterProdukAdmin({ initialQ = "", initialStatus = "semua" }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef(null);

  useEffect(() => {
    setQ(initialQ);
    setStatus(initialStatus);
  }, [initialQ, initialStatus]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  function navigasiFilter(nextQ, nextStatus) {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const targetUrl = buatUrlFilter({ q: nextQ, status: nextStatus });
    startTransition(() => {
      router.replace(targetUrl);
    });
  }

  function handleSearchChange(event) {
    const nextQ = event.target.value;
    setQ(nextQ);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (nextQ.trim() === initialQ.trim() && status === initialStatus) {
      return;
    }

    timerRef.current = setTimeout(() => {
      navigasiFilter(nextQ, status);
    }, DEBOUNCE_MS);
  }

  function handleClearSearch() {
    setQ("");
    navigasiFilter("", status);
  }

  function handleStatusChange(nextStatus) {
    setStatus(nextStatus);
    navigasiFilter(q, nextStatus);
  }

  function handleSubmit(event) {
    event.preventDefault();
    navigasiFilter(q, status);
  }

  function handleReset() {
    setQ("");
    setStatus("semua");
    navigasiFilter("", "semua");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-3 rounded-[20px] border border-garis bg-permukaan p-3.5"
    >
      {/* Searchbar kustom */}
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
          name="q"
          value={q}
          onChange={handleSearchChange}
          placeholder="Cari nama paket atau kategori..."
          aria-label="Cari paket layanan"
          className="min-h-[44px] w-full rounded-[12px] border border-garis-tegas bg-latar pr-10 pl-10 text-sm text-teks placeholder:text-teks-lembut transition-colors hover:border-utama/70 focus:border-utama focus:outline-none focus:ring-2 focus:ring-utama/15"
        />

        {q ? (
          <button
            type="button"
            onClick={handleClearSearch}
            aria-label="Kosongkan pencarian"
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

      {/* Dropdown filter kustom */}
      <CustomSelect
        name="status"
        options={STATUS_OPTIONS}
        value={status}
        onChange={handleStatusChange}
        ariaLabel="Filter status aktif"
        className="w-full sm:w-[175px]"
      />

      <div className="flex items-center gap-2">
        <Tombol type="submit" disabled={isPending} className="min-h-[44px] px-5 py-2 text-sm">
          {isPending ? "Mencari..." : "Cari"}
        </Tombol>

        {q || status !== "semua" ? (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-3 text-sm font-medium text-utama transition-colors hover:bg-latar"
          >
            Reset
          </button>
        ) : null}
      </div>
    </form>
  );
}
