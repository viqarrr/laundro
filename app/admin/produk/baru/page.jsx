import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import CatatanBelumAktif from "@/components/CatatanBelumAktif";
import { requireAdmin } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

// US-08 (bonus): tambah produk.
export default async function HalamanTambahProduk() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-teks">Tambah produk</h1>
      <CatatanBelumAktif>Simpan produk belum berfungsi: lihat US-08.</CatatanBelumAktif>
      <FormProduk labelTombol="Simpan produk" />
    </div>
  );
}
