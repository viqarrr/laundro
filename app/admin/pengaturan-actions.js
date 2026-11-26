"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/supabase/session";
import { catatLogAdmin } from "@/lib/admin-log";
import { normalisasiNomorWa } from "@/lib/pengaturan";

function isValidLink(value) {
  if (!value) return true;
  if (value.startsWith("/")) {
    return !value.startsWith("//") && !value.includes("..");
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function validasiPengaturan(formData) {
  const errors = {};

  const nama_gerai = String(formData.get("nama_gerai") || "").trim();
  if (nama_gerai.length < 2 || nama_gerai.length > 80) {
    errors.nama_gerai = "Nama gerai wajib diisi (2 hingga 80 karakter).";
  }

  const alamat = String(formData.get("alamat") || "").trim();
  if (alamat.length < 5 || alamat.length > 300) {
    errors.alamat = "Alamat gerai wajib diisi (5 hingga 300 karakter).";
  }

  const waRaw = String(formData.get("nomor_wa") || "").trim();
  const waDigits = waRaw.replace(/\D/g, "");
  const nomor_wa = waDigits ? normalisasiNomorWa(waDigits) : "";
  if (!waDigits || !/^\d{9,16}$/.test(nomor_wa)) {
    errors.nomor_wa = "Nomor WhatsApp wajib diisi (9 hingga 16 digit angka, mis. 6281234567890).";
  }

  const jam_buka = String(formData.get("jam_buka") || "").trim();
  const jam_tutup = String(formData.get("jam_tutup") || "").trim();
  if (!/^\d{2}:\d{2}$/.test(jam_buka)) {
    errors.jam_buka = "Format jam buka harus HH:MM (mis. 07:00).";
  }
  if (!/^\d{2}:\d{2}$/.test(jam_tutup)) {
    errors.jam_tutup = "Format jam tutup harus HH:MM (mis. 22:00).";
  }

  const bufferRaw = String(formData.get("buffer_minutes") ?? "").trim();
  const buffer_minutes = Number(bufferRaw);
  if (!/^\d+$/.test(bufferRaw) || buffer_minutes < 0 || buffer_minutes > 120) {
    errors.buffer_minutes = "Buffer mesin harus antara 0 hingga 120 menit.";
  }

  const dp_type = String(formData.get("dp_type") || "FIXED").trim().toUpperCase();
  if (dp_type !== "FIXED" && dp_type !== "PERCENTAGE") {
    errors.dp_type = "Tipe DP harus FIXED atau PERCENTAGE.";
  }

  const dpRaw = String(formData.get("dp_value") ?? "").trim();
  const dp_value = Number(dpRaw);
  if (!/^\d+$/.test(dpRaw) || dp_value < 0) {
    errors.dp_value = "Nominal atau persentase DP harus bilangan bulat >= 0.";
  } else if (dp_type === "PERCENTAGE" && dp_value > 100) {
    errors.dp_value = "Persentase DP maksimal 100%.";
  }

  const info_rekening = String(formData.get("info_rekening") || "").trim();
  if (info_rekening.length > 300) {
    errors.info_rekening = "Info rekening maksimal 300 karakter.";
  }

  const banner_aktif =
    formData.get("banner_aktif") === "on" || formData.get("banner_aktif") === "true";
  const banner_judul = String(formData.get("banner_judul") || "").trim();
  const banner_subjudul = String(formData.get("banner_subjudul") || "").trim();
  const banner_cta = String(formData.get("banner_cta") || "").trim();
  const banner_link = String(formData.get("banner_link") || "").trim();

  if (banner_aktif && banner_judul.length < 3) {
    errors.banner_judul = "Judul banner wajib diisi minimal 3 karakter saat banner aktif.";
  }
  if (banner_judul.length > 120) {
    errors.banner_judul = "Judul banner maksimal 120 karakter.";
  }
  if (banner_subjudul.length > 240) {
    errors.banner_subjudul = "Subjudul banner maksimal 240 karakter.";
  }
  if (banner_cta.length > 40) {
    errors.banner_cta = "Teks CTA maksimal 40 karakter.";
  }
  if (banner_link && !isValidLink(banner_link)) {
    errors.banner_link = "Tautan banner harus path lokal (mis. /antrean) atau URL http/https.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      id: 1,
      nama_gerai,
      alamat,
      nomor_wa,
      jam_buka,
      jam_tutup,
      buffer_minutes,
      dp_type,
      dp_value,
      info_rekening: info_rekening || null,
      banner_aktif,
      banner_judul: banner_judul || null,
      banner_subjudul: banner_subjudul || null,
      banner_cta: banner_cta || null,
      banner_link: banner_link || "/antrean",
      updated_at: new Date().toISOString(),
    },
  };
}

export async function simpanPengaturanAction(_prevState, formData) {
  let session;
  try {
    session = await requireSuperAdmin({ mode: "throw" });
  } catch {
    return { ok: false, error: "Akses ditolak: hanya Superadmin yang dapat mengubah pengaturan." };
  }

  try {
    const { valid, data, errors } = validasiPengaturan(formData);
    if (!valid) {
      return {
        ok: false,
        error: "Periksa kembali isian pengaturan yang ditandai.",
        errors,
      };
    }

    const { error } = await session.supabase
      .from("pengaturan_toko")
      .upsert(data, { onConflict: "id" });

    if (error) {
      return { ok: false, error: "Gagal menyimpan pengaturan gerai ke database." };
    }

    await catatLogAdmin({
      supabase: session.supabase,
      adminEmail: session.user.email,
      aksi: "UBAH_PENGATURAN",
      entitas: "pengaturan_toko",
      entitasId: "1",
      detail: {
        nama_gerai: data.nama_gerai,
        dp_type: data.dp_type,
        dp_value: data.dp_value,
        banner_aktif: data.banner_aktif,
      },
    });

    revalidatePath("/");
    revalidatePath("/tentang");
    revalidatePath("/antrean");
    revalidatePath("/produk/[id]", "layout");
    revalidatePath("/admin/pengaturan");
    revalidatePath("/admin");

    return { ok: true, success: "Pengaturan gerai dan banner promo berhasil disimpan." };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat menyimpan pengaturan gerai." };
  }
}
