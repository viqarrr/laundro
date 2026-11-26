"use server";

import { revalidatePath } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function kirimUlasanAction(_prevState, formData) {
  try {
    const clientIp = await getClientIp();
    const rate = checkRateLimit({
      key: `ulasan-ip:${clientIp}`,
      limit: 3,
      windowMs: 15 * 60 * 1000,
      consume: true,
    });

    if (!rate.allowed) {
      return {
        ok: false,
        error: `Batas pengiriman ulasan tercapai. Silakan tunggu ${rate.retryAfterMinutes} menit sebelum mengirim lagi.`,
      };
    }

    const produkIdRaw = String(formData.get("produk_id") || "").trim();
    const nama = String(formData.get("nama") || "").trim();
    const ratingRaw = String(formData.get("rating") || "").trim();
    const komentar = String(formData.get("komentar") || "").trim();

    const errors = {};
    if (!/^\d+$/.test(produkIdRaw)) {
      return { ok: false, error: "ID layanan tidak valid." };
    }

    if (nama.length < 2 || nama.length > 60) {
      errors.nama = "Nama wajib diisi (2 hingga 60 karakter).";
    }

    const rating = Number(ratingRaw);
    if (!/^\d+$/.test(ratingRaw) || rating < 1 || rating > 5) {
      errors.rating = "Pilih rating bintang antara 1 hingga 5.";
    }

    if (komentar.length < 5 || komentar.length > 500) {
      errors.komentar = "Komentar wajib diisi (5 hingga 500 karakter).";
    }

    if (Object.keys(errors).length > 0) {
      return {
        ok: false,
        error: "Periksa kembali isian ulasan Anda.",
        errors,
      };
    }

    const produkId = Number(produkIdRaw);
    const supabase = createSupabasePublicClient();

    const { data: produk } = await supabase
      .from("produk")
      .select("id")
      .eq("id", produkId)
      .eq("aktif", true)
      .maybeSingle();

    if (!produk) {
      return { ok: false, error: "Paket layanan tidak ditemukan." };
    }

    const { error } = await supabase.from("ulasan").insert({
      produk_id: produkId,
      nama,
      rating,
      komentar,
      status: "pending",
    });

    if (error) {
      return { ok: false, error: "Gagal mengirim ulasan. Silakan coba beberapa saat lagi." };
    }

    revalidatePath("/admin/ulasan");

    return {
      ok: true,
      success: "Terima kasih! Ulasan Anda berhasil dikirim dan menunggu persetujuan admin.",
    };
  } catch {
    return { ok: false, error: "Terjadi gangguan saat mengirim ulasan." };
  }
}
