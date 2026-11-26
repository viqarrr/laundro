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
 * Mengambil profil admin dari admin_profiles.
 * Jika tabel masih kosong, akun pertama yang login di-bootstrap sebagai SUPERADMIN agar tidak terkunci.
 */
export async function ensureAdminProfile({ supabase, user }) {
  const email = String(user?.email || "").trim().toLowerCase();
  const fallbackName = email ? email.split("@")[0] : "Admin";

  try {
    const { data: byUser } = await supabase
      .from("admin_profiles")
      .select("user_id, email, nama, role, aktif")
      .eq("user_id", user.id)
      .maybeSingle();

    if (byUser) {
      return byUser;
    }

    if (email) {
      const { data: byEmail } = await supabase
        .from("admin_profiles")
        .select("user_id, email, nama, role, aktif")
        .eq("email", email)
        .maybeSingle();

      if (byEmail) {
        return byEmail;
      }
    }

    const { count } = await supabase
      .from("admin_profiles")
      .select("user_id", { count: "exact", head: true });

    if ((count ?? 0) === 0 && email) {
      const bootstrapProfile = {
        user_id: user.id,
        email,
        nama: String(user.user_metadata?.nama || fallbackName),
        role: "SUPERADMIN",
        aktif: true,
      };
      const { data: inserted } = await supabase
        .from("admin_profiles")
        .insert(bootstrapProfile)
        .select("user_id, email, nama, role, aktif")
        .maybeSingle();

      return inserted || bootstrapProfile;
    }

    return {
      user_id: user.id,
      email,
      nama: fallbackName,
      role: "STAFF",
      aktif: true,
    };
  } catch {
    return {
      user_id: user.id,
      email,
      nama: fallbackName,
      role: "SUPERADMIN",
      aktif: true,
    };
  }
}

/**
 * Memastikan request berasal dari admin yang sudah login dan berstatus aktif.
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
  if (!profile.aktif) {
    if (mode === "throw") {
      throw new Error("Akun admin ini sedang dinonaktifkan.");
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
