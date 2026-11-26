import NavAdmin from "@/components/NavAdmin";
import KelolaAkun from "@/components/KelolaAkun";
import { requireSuperAdmin } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export default async function HalamanAkunAdmin() {
  const { supabase, user, profile } = await requireSuperAdmin();

  const { data: daftarAkun, error } = await supabase
    .from("admin_profiles")
    .select("user_id, email, nama, role, aktif, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <div>
        <span className="inline-flex items-center rounded-full bg-utama-lembut px-3 py-1 text-xs font-semibold text-utama">
          Khusus Superadmin
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-teks">
          Kelola Akun Admin &amp; Penjaga
        </h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Tambah akun staf, atur peran SUPERADMIN atau STAFF, dan nonaktifkan akun yang tidak
          lagi bertugas.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-[14px] border border-bahaya/30 bg-bahaya-latar px-4 py-3 text-sm font-medium text-bahaya"
        >
          Gagal memuat daftar akun admin dari database.
        </p>
      ) : (
        <KelolaAkun
          daftarAkun={daftarAkun || []}
          currentUserId={profile?.user_id || user.id}
          currentUserEmail={profile?.email || user.email}
        />
      )}
    </div>
  );
}
