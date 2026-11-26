"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/supabase/session";
import { catatLogAdmin } from "@/lib/admin-log";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function tambahAkunAdminAction(_prevState, formData) {
  let session;
  try {
    session = await requireSuperAdmin({ mode: "throw" });
  } catch {
    return { ok: false, error: "Akses ditolak: hanya Superadmin yang dapat menambah akun." };
  }

  try {
    const errors = {};
    const nama = String(formData.get("nama") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const role = String(formData.get("role") || "STAFF").trim().toUpperCase();
    const passwordAwal = String(formData.get("password_awal") || "");

    if (nama.length < 2 || nama.length > 80) {
      errors.nama = "Nama admin wajib diisi (2 hingga 80 karakter).";
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      errors.email = "Format email tidak valid.";
    }
    if (role !== "SUPERADMIN" && role !== "STAFF") {
      errors.role = "Peran harus SUPERADMIN atau STAFF.";
    }
    if (passwordAwal && passwordAwal.length < 8) {
      errors.password_awal = "Password awal minimal 8 karakter jika diisi.";
    }

    if (Object.keys(errors).length > 0) {
      return {
        ok: false,
        error: "Periksa kembali data akun yang dimasukkan.",
        errors,
      };
    }

    const { data: existing } = await session.supabase
      .from("admin_profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return {
        ok: false,
        error: "Email sudah terdaftar di daftar akun admin.",
        errors: { email: "Email ini sudah memiliki profil admin." },
      };
    }

    let userId = crypto.randomUUID();
    if (passwordAwal) {
      const adminAuthClient = createSupabasePublicClient();
      const { data: createdAuth, error: authErr } = await adminAuthClient.auth.admin.createUser({
        email,
        password: passwordAwal,
        email_confirm: true,
        user_metadata: { nama },
      });

      if (authErr || !createdAuth?.user?.id) {
        return {
          ok: false,
          error: "Gagal membuat akun login Supabase Auth untuk email tersebut.",
        };
      }
      userId = createdAuth.user.id;
    }

    const { error } = await session.supabase.from("admin_profiles").insert({
      user_id: userId,
      email,
      nama,
      role,
      aktif: true,
    });

    if (error) {
      return { ok: false, error: "Gagal menyimpan profil admin baru." };
    }

    await catatLogAdmin({
      supabase: session.supabase,
      adminEmail: session.user.email,
      aksi: "TAMBAH_AKUN",
      entitas: "admin_profiles",
      entitasId: userId,
      detail: { email, nama, role },
    });

    revalidatePath("/admin/akun");
    return { ok: true, success: `Akun ${nama} (${role}) berhasil ditambahkan.` };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat menambahkan akun admin." };
  }
}

export async function ubahRoleAkunAction(userId, nextRole) {
  let session;
  try {
    session = await requireSuperAdmin({ mode: "throw" });
  } catch {
    return { ok: false, error: "Akses ditolak." };
  }

  if (!userId || (nextRole !== "SUPERADMIN" && nextRole !== "STAFF")) {
    return { ok: false, error: "Permintaan perubahan peran tidak valid." };
  }

  if (userId === session.user.id && nextRole !== "SUPERADMIN") {
    return { ok: false, error: "Anda tidak dapat menurunkan peran akun Anda sendiri." };
  }

  try {
    const { error } = await session.supabase
      .from("admin_profiles")
      .update({ role: nextRole })
      .eq("user_id", userId);

    if (error) {
      return { ok: false, error: "Gagal memperbarui peran akun." };
    }

    await catatLogAdmin({
      supabase: session.supabase,
      adminEmail: session.user.email,
      aksi: "UBAH_ROLE_AKUN",
      entitas: "admin_profiles",
      entitasId: userId,
      detail: { role: nextRole },
    });

    revalidatePath("/admin/akun");
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat mengubah peran akun." };
  }
}

export async function toggleAktifAkunAction(userId, nextAktif) {
  let session;
  try {
    session = await requireSuperAdmin({ mode: "throw" });
  } catch {
    return { ok: false, error: "Akses ditolak." };
  }

  if (!userId) {
    return { ok: false, error: "ID akun tidak valid." };
  }

  if (userId === session.user.id && !nextAktif) {
    return { ok: false, error: "Anda tidak dapat menonaktifkan akun Anda sendiri." };
  }

  try {
    const { error } = await session.supabase
      .from("admin_profiles")
      .update({ aktif: Boolean(nextAktif) })
      .eq("user_id", userId);

    if (error) {
      return { ok: false, error: "Gagal mengubah status aktif akun." };
    }

    await catatLogAdmin({
      supabase: session.supabase,
      adminEmail: session.user.email,
      aksi: nextAktif ? "AKTIFKAN_AKUN" : "NONAKTIFKAN_AKUN",
      entitas: "admin_profiles",
      entitasId: userId,
      detail: { aktif: Boolean(nextAktif) },
    });

    revalidatePath("/admin/akun");
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat mengubah status akun." };
  }
}
