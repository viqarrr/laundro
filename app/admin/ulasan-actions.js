"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/supabase/session";
import { catatLogAdmin } from "@/lib/admin-log";

export async function ubahStatusUlasanAction(ulasanId, nextStatus) {
  let session;
  try {
    session = await requireSuperAdmin({ mode: "throw" });
  } catch {
    return { ok: false, error: "Akses ditolak: fitur ini khusus untuk Superadmin." };
  }

  if (!/^\d+$/.test(String(ulasanId)) || !["approved", "rejected"].includes(nextStatus)) {
    return { ok: false, error: "Permintaan moderasi ulasan tidak valid." };
  }

  const id = Number(ulasanId);

  try {
    const { data: updated, error } = await session.supabase
      .from("ulasan")
      .update({ status: nextStatus })
      .eq("id", id)
      .select("id, produk_id")
      .maybeSingle();

    if (error || !updated) {
      return { ok: false, error: "Gagal memperbarui status ulasan." };
    }

    await catatLogAdmin({
      supabase: session.supabase,
      adminEmail: session.user.email,
      aksi: nextStatus === "approved" ? "SETUJUI_ULASAN" : "TOLAK_ULASAN",
      entitas: "ulasan",
      entitasId: id,
      detail: { produk_id: updated.produk_id, status: nextStatus },
    });

    revalidatePath("/admin/ulasan");
    if (updated.produk_id) {
      revalidatePath(`/produk/${updated.produk_id}`);
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat memoderasi ulasan." };
  }
}

export async function hapusUlasanAction(ulasanId) {
  let session;
  try {
    session = await requireSuperAdmin({ mode: "throw" });
  } catch {
    return { ok: false, error: "Akses ditolak: fitur ini khusus untuk Superadmin." };
  }

  if (!/^\d+$/.test(String(ulasanId))) {
    return { ok: false, error: "ID ulasan tidak valid." };
  }

  const id = Number(ulasanId);

  try {
    const { data: target } = await session.supabase
      .from("ulasan")
      .select("id, produk_id")
      .eq("id", id)
      .maybeSingle();

    const { error } = await session.supabase.from("ulasan").delete().eq("id", id);
    if (error) {
      return { ok: false, error: "Gagal menghapus ulasan." };
    }

    await catatLogAdmin({
      supabase: session.supabase,
      adminEmail: session.user.email,
      aksi: "HAPUS_ULASAN",
      entitas: "ulasan",
      entitasId: id,
      detail: { produk_id: target?.produk_id || null },
    });

    revalidatePath("/admin/ulasan");
    if (target?.produk_id) {
      revalidatePath(`/produk/${target.produk_id}`);
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat menghapus ulasan." };
  }
}
