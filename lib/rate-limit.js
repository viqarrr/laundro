import { headers } from "next/headers";

const STORE_KEY = "__laundroRateLimitStore";
const CLEANUP_INTERVAL_MS = 60 * 1000;

function getStore() {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = {
      buckets: new Map(),
      lastCleanup: Date.now(),
    };
  }
  return globalThis[STORE_KEY];
}

function cleanupExpired(store, now, maxWindowMs) {
  if (now - store.lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  for (const [bucketKey, entry] of store.buckets.entries()) {
    const validHits = entry.hits.filter((ts) => now - ts < entry.windowMs);
    if (validHits.length === 0 && now - entry.updatedAt >= Math.max(entry.windowMs, maxWindowMs)) {
      store.buckets.delete(bucketKey);
    } else {
      entry.hits = validHits;
    }
  }

  store.lastCleanup = now;
}

/**
 * Mengambil alamat IP klien dari header proxy standar secara aman di server.
 */
export async function getClientIp() {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
      const firstIp = forwarded.split(",")[0].trim();
      if (firstIp) return firstIp.slice(0, 64);
    }

    const realIp = headerList.get("x-real-ip");
    if (realIp) {
      return realIp.trim().slice(0, 64);
    }
  } catch {
    // Abaikan jika dipanggil di luar konteks request HTTP.
  }

  return "unknown";
}

/**
 * Rate limiter sliding-window in-memory berbasis kunci (IP / identitas).
 * Jika consume=false, hanya mengecek tanpa menambah hitungan percobaan.
 */
export function checkRateLimit({ key, limit = 5, windowMs = 15 * 60 * 1000, consume = true }) {
  const now = Date.now();
  const store = getStore();
  cleanupExpired(store, now, windowMs);

  const existing = store.buckets.get(key);
  const activeHits = existing ? existing.hits.filter((ts) => now - ts < windowMs) : [];

  if (activeHits.length >= limit) {
    const oldestHit = activeHits[0];
    const retryAfterMs = Math.max(1000, windowMs - (now - oldestHit));
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
    const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

    store.buckets.set(key, { hits: activeHits, windowMs, updatedAt: now });

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      retryAfterMinutes,
    };
  }

  if (consume) {
    activeHits.push(now);
  }

  store.buckets.set(key, { hits: activeHits, windowMs, updatedAt: now });

  return {
    allowed: true,
    remaining: Math.max(0, limit - activeHits.length),
    retryAfterSeconds: 0,
    retryAfterMinutes: 0,
  };
}

/**
 * Menghapus catatan percobaan untuk kunci tertentu (misal setelah login berhasil).
 */
export function resetRateLimit(key) {
  const store = getStore();
  store.buckets.delete(key);
}
