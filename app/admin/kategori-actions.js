"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/session";
import { catatLogAdmin } from "@/lib/admin-log";

function buatSlug(teks) {
  return String(teks || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function validasiInputKategori(formData) {
  const errors = {};

  const nama = String(formData.get("nama") || "").trim();
  if (nama.length < 2 || nama.length > 60) {
    errors.nama = "Nama kategori wajib diisi (2 hingga 60 karakter).";
  }

  const slugInput = String(formData.get("slug") || "").trim();
  const slug = slugInput ? buatSlug(slugInput) : buatSlug(nama);
  if (!slug || slug.length < 2 || slug.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug = "Slug wajib berisi huruf kecil, angka, atau tanda hubung (minimal 2 karakter).";
  }

  const deskripsiRaw = String(formData.get("deskripsi") || "").trim();
  if (deskripsiRaw.length > 500) {
    errors.deskripsi = "Deskripsi kategori maksimal 500 karakter.";
  }

  const urutanRaw = String(formData.get("urutan") ?? "").trim();
  let urutan = 0;
  if (urutanRaw) {
    if (!/^-?\d+$/.test(urutanRaw)) {
      errors.urutan = "Urutan harus berupa bilangan bulat.";
    } else {
      const parsed = Number(urutanRaw);
      if (parsed < -9999 || parsed > 99999) {
        errors.urutan = "Urutan harus antara -9999 hingga 99999.";
      } else {
        urutan = parsed;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      nama,
      slug,
      deskripsi: deskripsiRaw || null,
      urutan,
    },
  };
}

function revalidateKategoriPaths() {
  revalidatePath("/admin/kategori");
  revalidatePath("/admin/produk/baru");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function tambahKategoriAction(_prevState, formData) {
  const { supabase, user } = await requireAdmin();

  try {
    const { valid, data, errors } = validasiInputKategori(formData);
    if (!valid) {
      return {
        ok: false,
        error: "Periksa kembali isian kategori yang ditandai.",
        errors,
      };
    }

    const { data: existing } = await supabase
      .from("kategori")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();

    if (existing) {
      return {
        ok: false,
        error: "Slug kategori sudah digunakan.",
        errors: { slug: `Slug "${data.slug}" sudah dipakai kategori lain.` },
      };
    }

    const { data: inserted, error } = await supabase
      .from("kategori")
      .insert(data)
      .select("id")
      .maybeSingle();
    if (error) {
      if (error.code === "23505") {
        return {
          ok: false,
          error: "Slug kategori sudah digunakan.",
          errors: { slug: `Slug "${data.slug}" sudah dipakai kategori lain.` },
        };
      }
      return { ok: false, error: "Gagal menambahkan kategori ke database." };
    }

    await catatLogAdmin({
      supabase,
      adminEmail: user.email,
      aksi: "TAMBAH_KATEGORI",
      entitas: "kategori",
      entitasId: inserted?.id,
      detail: { nama: data.nama, slug: data.slug },
    });

    revalidateKategoriPaths();
    return { ok: true, success: `Kategori "${data.nama}" berhasil ditambahkan.` };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat menyimpan kategori." };
  }
}

export async function ubahKategoriAction(_prevState, formData) {
  const { supabase, user } = await requireAdmin();

  const idRaw = String(formData.get("id") || "").trim();
  if (!/^\d+$/.test(idRaw)) {
    return { ok: false, error: "ID kategori tidak valid." };
  }
  const kategoriId = Number(idRaw);

  try {
    const { valid, data, errors } = validasiInputKategori(formData);
    if (!valid) {
      return {
        ok: false,
        error: "Periksa kembali isian kategori yang ditandai.",
        errors,
      };
    }

    const { data: existing } = await supabase
      .from("kategori")
      .select("id")
      .eq("slug", data.slug)
      .neq("id", kategoriId)
      .maybeSingle();

    if (existing) {
      return {
        ok: false,
        error: "Slug kategori sudah digunakan.",
        errors: { slug: `Slug "${data.slug}" sudah dipakai kategori lain.` },
      };
    }

    const { error } = await supabase.from("kategori").update(data).eq("id", kategoriId);
    if (error) {
      if (error.code === "23505") {
        return {
          ok: false,
          error: "Slug kategori sudah digunakan.",
          errors: { slug: `Slug "${data.slug}" sudah dipakai kategori lain.` },
        };
      }
      return { ok: false, error: "Gagal memperbarui kategori." };
    }

    await catatLogAdmin({
      supabase,
      adminEmail: user.email,
      aksi: "UBAH_KATEGORI",
      entitas: "kategori",
      entitasId: kategoriId,
      detail: { nama: data.nama, slug: data.slug },
    });

    revalidateKategoriPaths();
    return { ok: true, success: `Kategori "${data.nama}" berhasil diperbarui.` };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat memperbarui kategori." };
  }
}

export async function hapusKategoriAction(id) {
  const { supabase, user } = await requireAdmin();

  if (!/^\d+$/.test(String(id))) {
    return { ok: false, error: "ID kategori tidak valid." };
  }

  try {
    const { error } = await supabase.from("kategori").delete().eq("id", Number(id));
    if (error) {
      return { ok: false, error: "Gagal menghapus kategori." };
    }

    await catatLogAdmin({
      supabase,
      adminEmail: user.email,
      aksi: "HAPUS_KATEGORI",
      entitas: "kategori",
      entitasId: id,
    });

    revalidateKategoriPaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat menghapus kategori." };
  }
}
