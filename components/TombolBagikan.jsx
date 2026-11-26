"use client";

import { useState } from "react";

export default function TombolBagikan({ title, text }) {
  const [feedback, setFeedback] = useState("");

  function tampilkanFeedback(pesan) {
    setFeedback(pesan);
    setTimeout(() => setFeedback(""), 2500);
  }

  async function handleShare() {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    if (!shareUrl) return;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: shareUrl });
        tampilkanFeedback("Tautan dibagikan");
        return;
      } catch {
        // Jika pengguna membatalkan atau share gagal, lanjut fallback salin clipboard
      }
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(shareUrl);
        tampilkanFeedback("Tautan disalin");
      }
    } catch {
      // Abaikan jika akses clipboard dibatasi
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full border border-garis bg-permukaan px-4 py-1.5 text-xs font-semibold text-teks transition-colors hover:border-garis-tegas"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="12" cy="3.5" r="1.75" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="4" cy="8" r="1.75" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="12.5" r="1.75" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M5.6 7.1L10.4 4.4M5.6 8.9L10.4 11.6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <span>{feedback || "Bagikan"}</span>
    </button>
  );
}
