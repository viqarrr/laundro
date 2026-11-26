import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { requireSuperAdmin } from "@/lib/supabase/session";
import { tambahProdukAction } from "@/app/admin/produk-actions";

export const dynamic = "force-dynamic";

export default async function HalamanTambahProduk() {
  const { supabase } = await requireSuperAdmin();

  const { data: kategoriList } = await supabase
    .from("kategori")
    .select("nama")
    .order("urutan", { ascending: true })
    .order("nama", { ascending: true });

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-teks">
          Tambah Paket Layanan
        </h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Tambahkan paket cuci, pengeringan, atau add-on baru ke katalog gerai.
        </p>
      </div>
      <FormProduk
        action={tambahProdukAction}
        labelTombol="Simpan produk"
        daftarKategori={kategoriList || []}
      />
    </div>
  );
}
