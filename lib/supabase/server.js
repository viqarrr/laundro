import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Konfigurasi koneksi server belum lengkap.");
  }

  return { url, publishableKey };
}

/**
 * Membuat client Supabase SSR berbasis cookie sesi admin.
 * Hanya boleh dipanggil dari Server Component, Server Action, Route Handler, atau proxy.
 */
export async function createSupabaseServerClient() {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Di Server Component, penulisan cookie ditangani oleh proxy.js.
        }
      },
    },
  });
}

/**
 * Membuat client Supabase server-only untuk membaca data katalog publik (melewati RLS produk).
 * Tidak menggunakan sesi pengguna dan tidak boleh diekspos ke komponen klien.
 */
export function createSupabasePublicClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Konfigurasi koneksi data publik belum lengkap.");
  }

  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
