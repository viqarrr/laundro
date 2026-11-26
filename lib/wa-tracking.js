"use client";

/**
 * Mengirim event klik WhatsApp secara non-blocking sebelum/saat membuka tab WA (US-40).
 */
export function catatKlikWa({ produkId = null, sumber = "katalog" } = {}) {
  try {
    const idNum = produkId !== null && produkId !== undefined ? Number(produkId) : null;
    const payload = JSON.stringify({
      produk_id: Number.isInteger(idNum) && idNum > 0 ? idNum : null,
      sumber: String(sumber || "katalog").slice(0, 60),
    });

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/wa-click", blob);
      return;
    }

    if (typeof fetch === "function") {
      fetch("/api/analytics/wa-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Jangan pernah menghambat tautan WhatsApp.
  }
}
