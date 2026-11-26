import NavAdmin from "@/components/NavAdmin";
import KelolaKategori from "@/components/KelolaKategori";
import { requireSuperAdmin } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export default async function HalamanKategoriAdmin() {
  const { supabase } = await requireSuperAdmin();

  const { data: daftarKategori, error } = await supabase
    .from("kategori")
    .select("id, nama, slug, deskripsi, urutan, created_at")
    .order("urutan", { ascending: true })
    .order("nama", { ascending: true });

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-teks">Kelola Kategori</h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Atur kategori paket layanan untuk katalog publik, halaman kategori, dan formulir produk.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-[14px] border border-bahaya/30 bg-bahaya-latar px-4 py-3 text-sm font-medium text-bahaya"
        >
          Gagal memuat daftar kategori dari database.
        </p>
      ) : (
        <KelolaKategori daftarKategori={daftarKategori || []} />
      )}
    </div>
  );
}
