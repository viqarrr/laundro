import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Mengambil sesi user terautentikasi di server melalui Supabase Auth getUser().
 * Mengembalikan { user, supabase } jika valid, atau null jika belum login.
 */
export async function getAdminSession() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return { user, supabase };
  } catch {
    return null;
  }
}

/**
 * Mengambil profil admin terverifikasi dari tabel admin_profiles.
 * Fail-closed: mengembalikan null jika akun tidak terdaftar atau terjadi error query.
 */
export async function ensureAdminProfile({ supabase, user }) {
  if (!user?.id) {
    return null;
  }

  const email = String(user?.email || "").trim().toLowerCase();

  try {
    const { data: byUser, error: errByUser } = await supabase
      .from("admin_profiles")
      .select("user_id, email, nama, role, aktif")
      .eq("user_id", user.id)
      .maybeSingle();

    if (errByUser) {
      return null;
    }

    if (byUser) {
      return byUser;
    }

    if (email) {
      const { data: byEmail, error: errByEmail } = await supabase
        .from("admin_profiles")
        .select("user_id, email, nama, role, aktif")
        .eq("email", email)
        .maybeSingle();

      if (errByEmail) {
        return null;
      }

      if (byEmail) {
        return byEmail;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Memastikan request berasal dari admin yang sudah login, memiliki profil terverifikasi, dan berstatus aktif.
 */
export async function requireAdmin({ mode = "redirect" } = {}) {
  const session = await getAdminSession();

  if (!session) {
    if (mode === "throw") {
      throw new Error("Sesi admin tidak valid. Silakan masuk kembali.");
    }
    redirect("/admin/login");
  }

  const profile = await ensureAdminProfile(session);
  if (!profile || !profile.aktif) {
    if (mode === "throw") {
      throw new Error("Akun ini tidak memiliki akses admin aktif.");
    }
    redirect("/admin/login");
  }

  return { ...session, profile };
}

/**
 * Memastikan request berasal dari admin dengan peran SUPERADMIN (US-43, US-44).
 */
export async function requireSuperAdmin({ mode = "redirect" } = {}) {
  const session = await requireAdmin({ mode });

  if (session.profile?.role !== "SUPERADMIN") {
    if (mode === "throw") {
      throw new Error("Akses ditolak: fitur ini khusus untuk Superadmin.");
    }
    redirect("/admin/jadwal");
  }

  return session;
}
