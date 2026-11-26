"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/session";
import { validasiFileFotoProduk, validasiInputProduk } from "@/lib/validators/produk";

const STORAGE_BUCKET = "produk-images";

async function uploadFotoKeStorage(supabase, fileCheck) {
  const fileName = `produk/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileCheck.ext}`;
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, fileCheck.buffer, {
      contentType: fileCheck.contentType,
      upsert: false,
    });

  if (uploadError) {
    return {
      error:
        "Gagal mengunggah foto ke penyimpanan. Pastikan bucket 'produk-images' sudah dibuat atau gunakan link foto.",
    };
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
  return { url: data.publicUrl };
}

export async function tambahProdukAction(_prevState, formData) {
  const { supabase } = await requireAdmin();

  let berhasil = false;

  try {
    const { valid, data, errors } = validasiInputProduk(formData);
    const fotoFile = formData.get("foto_file");
    const fileCheck = await validasiFileFotoProduk(fotoFile);

    if (!fileCheck.valid) {
      errors.foto_file = fileCheck.error;
    }

    if (!valid || !fileCheck.valid) {
      return {
        error: "Periksa kembali isian formulir yang ditandai.",
        errors,
      };
    }

    let finalFotoUrl = data.foto_url || "/images/hero-machines.jpg";
    if (fileCheck.hasFile) {
      const uploaded = await uploadFotoKeStorage(supabase, fileCheck);
      if (uploaded.error) {
        return {
          error: uploaded.error,
          errors: { foto_file: uploaded.error },
        };
      }
      finalFotoUrl = uploaded.url;
    }

    const { error } = await supabase.from("produk").insert({
      ...data,
      foto_url: finalFotoUrl,
    });

    if (error) {
      return { error: "Gagal menyimpan paket layanan baru ke database." };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    berhasil = true;
  } catch {
    return { error: "Terjadi kesalahan saat menyimpan paket layanan." };
  }

  if (berhasil) {
    redirect("/admin");
  }

  return { error: "Gagal menyimpan paket layanan." };
}

export async function ubahProdukAction(_prevState, formData) {
  const { supabase } = await requireAdmin();

  const idRaw = String(formData.get("id") || "").trim();
  if (!/^\d+$/.test(idRaw)) {
    return { error: "ID paket layanan tidak valid." };
  }
  const produkId = Number(idRaw);

  let berhasil = false;

  try {
    const { valid, data, errors } = validasiInputProduk(formData);
    const fotoFile = formData.get("foto_file");
    const fileCheck = await validasiFileFotoProduk(fotoFile);

    if (!fileCheck.valid) {
      errors.foto_file = fileCheck.error;
    }

    if (!valid || !fileCheck.valid) {
      return {
        error: "Periksa kembali isian formulir yang ditandai.",
        errors,
      };
    }

    let finalFotoUrl = data.foto_url || "/images/hero-machines.jpg";
    if (fileCheck.hasFile) {
      const uploaded = await uploadFotoKeStorage(supabase, fileCheck);
      if (uploaded.error) {
        return {
          error: uploaded.error,
          errors: { foto_file: uploaded.error },
        };
      }
      finalFotoUrl = uploaded.url;
    }

    const { error } = await supabase
      .from("produk")
      .update({
        ...data,
        foto_url: finalFotoUrl,
      })
      .eq("id", produkId);

    if (error) {
      return { error: "Gagal memperbarui data paket layanan." };
    }

    revalidatePath("/");
    revalidatePath(`/produk/${produkId}`);
    revalidatePath("/admin");
    berhasil = true;
  } catch {
    return { error: "Terjadi kesalahan saat memperbarui paket layanan." };
  }

  if (berhasil) {
    redirect("/admin");
  }

  return { error: "Gagal memperbarui paket layanan." };
}

export async function hapusProdukAction(id) {
  const { supabase } = await requireAdmin();

  if (!/^\d+$/.test(String(id))) {
    return { ok: false, error: "ID paket layanan tidak valid." };
  }

  try {
    const { error } = await supabase.from("produk").delete().eq("id", Number(id));
    if (error) {
      return { ok: false, error: "Gagal menghapus paket layanan." };
    }

    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat menghapus paket layanan." };
  }
}

export async function toggleAktifProdukAction(id, aktifBerikutnya) {
  const { supabase } = await requireAdmin();

  if (!/^\d+$/.test(String(id))) {
    return { ok: false, error: "ID paket layanan tidak valid." };
  }

  try {
    const { error } = await supabase
      .from("produk")
      .update({ aktif: Boolean(aktifBerikutnya) })
      .eq("id", Number(id));

    if (error) {
      return { ok: false, error: "Gagal mengubah status aktif layanan." };
    }

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath(`/produk/${Number(id)}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat mengubah status layanan." };
  }
}

export async function ubahUrutanProdukAction(id, arah) {
  const { supabase } = await requireAdmin();

  if (!/^\d+$/.test(String(id)) || (arah !== "naik" && arah !== "turun")) {
    return { ok: false, error: "Permintaan perubahan urutan tidak valid." };
  }

  const targetId = Number(id);

  try {
    const { data: rows, error } = await supabase
      .from("produk")
      .select("id, urutan, created_at")
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !rows || rows.length < 2) {
      return { ok: false, error: "Data urutan belum dapat diperbarui." };
    }

    const idx = rows.findIndex((row) => row.id === targetId);
    if (idx === -1) {
      return { ok: false, error: "Paket layanan tidak ditemukan." };
    }

    const swapIdx = arah === "naik" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= rows.length) {
      return { ok: true };
    }

    const reordered = [...rows];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(swapIdx, 0, moved);

    // Normalisasi nilai urutan secara berurutan agar pergeseran selalu deterministik
    const updates = reordered.map((row, position) => {
      const nextOrder = position + 1;
      if (row.urutan === nextOrder) return null;
      return supabase.from("produk").update({ urutan: nextOrder }).eq("id", row.id);
    });

    const pendingUpdates = updates.filter(Boolean);
    if (pendingUpdates.length > 0) {
      const results = await Promise.all(pendingUpdates);
      if (results.some((res) => res.error)) {
        return { ok: false, error: "Gagal menyimpan urutan layanan." };
      }
    }

    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat mengubah urutan." };
  }
}

export async function simpanUrutanProdukAction(orderedIds) {
  const { supabase } = await requireAdmin();

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { ok: false, error: "Daftar urutan layanan tidak valid." };
  }

  const parsedIds = orderedIds.map((val) => Number(val));
  if (parsedIds.some((id) => !Number.isInteger(id) || id <= 0)) {
    return { ok: false, error: "ID paket layanan tidak valid." };
  }

  try {
    const { data: rows, error } = await supabase
      .from("produk")
      .select("id, urutan, created_at")
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !rows || rows.length === 0) {
      return { ok: false, error: "Data urutan belum dapat diperbarui." };
    }

    const subsetSet = new Set(parsedIds);
    const validSubsetOrder = parsedIds.filter((id) => rows.some((row) => row.id === id));
    if (validSubsetOrder.length === 0) {
      return { ok: false, error: "Paket layanan tidak ditemukan." };
    }

    let subsetCursor = 0;
    const reorderedIds = rows.map((row) => {
      if (subsetSet.has(row.id) && subsetCursor < validSubsetOrder.length) {
        const nextId = validSubsetOrder[subsetCursor];
        subsetCursor += 1;
        return nextId;
      }
      return row.id;
    });

    const updates = reorderedIds
      .map((id, position) => {
        const nextOrder = position + 1;
        const currentRow = rows.find((r) => r.id === id);
        if (currentRow && currentRow.urutan === nextOrder) return null;
        return supabase.from("produk").update({ urutan: nextOrder }).eq("id", id);
      })
      .filter(Boolean);

    if (updates.length > 0) {
      const results = await Promise.all(updates);
      if (results.some((res) => res.error)) {
        return { ok: false, error: "Gagal menyimpan urutan layanan." };
      }
    }

    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat menyimpan urutan." };
  }
}
