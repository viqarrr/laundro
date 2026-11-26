import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Mencatat aktivitas mutasi admin ke tabel admin_logs secara aman (US-45).
 * Tidak pernah melempar error agar tidak menggagalkan aksi utama.
 */
export async function catatLogAdmin({
  supabase = null,
  adminEmail,
  aksi,
  entitas,
  entitasId = null,
  detail = {},
}) {
  try {
    const client = supabase || (await createSupabaseServerClient());
    await client.from("admin_logs").insert({
      admin_email: String(adminEmail || "admin"),
      aksi: String(aksi || "AKSI"),
      entitas: String(entitas || "sistem"),
      entitas_id: entitasId !== null && entitasId !== undefined ? String(entitasId) : null,
      detail: detail && typeof detail === "object" ? detail : {},
    });
  } catch {
    // Abaikan kegagalan logging agar operasi operasional tetap berjalan.
  }
}
