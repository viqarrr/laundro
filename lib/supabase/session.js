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
 * Memastikan request berasal dari admin yang sudah login.
 * Mode "redirect" (bawaan) mengarahkan ke /admin/login; mode "throw" melempar Error untuk Server Action/API.
 */
export async function requireAdmin({ mode = "redirect" } = {}) {
  const session = await getAdminSession();

  if (!session) {
    if (mode === "throw") {
      throw new Error("Sesi admin tidak valid. Silakan masuk kembali.");
    }
    redirect("/admin/login");
  }

  return session;
}
