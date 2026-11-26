import { notFound } from "next/navigation";
import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { requireAdmin } from "@/lib/supabase/session";
import { ubahProdukAction } from "@/app/admin/produk-actions";

export const dynamic = "force-dynamic";

export default async function HalamanUbahProduk({ params }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  if (!/^\d+$/.test(String(id))) {
    notFound();
  }

  const [{ data: produk }, { data: kategoriList }] = await Promise.all([
    supabase
      .from("produk")
      .select(
        "id, nama, harga, harga_coret, badge, deskripsi, foto_url, kategori, max_capacity_kg, cycle_duration_minutes, requires_washer, requires_dryer, stok, aktif, urutan"
      )
      .eq("id", Number(id))
      .maybeSingle(),
    supabase
      .from("kategori")
      .select("nama")
      .order("urutan", { ascending: true })
      .order("nama", { ascending: true }),
  ]);

  if (!produk) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-teks">
          Ubah Paket Layanan
        </h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Perbarui tarif, spesifikasi kapasitas, foto, atau status tampil paket layanan.
        </p>
      </div>
      <FormProduk
        produk={produk}
        action={ubahProdukAction}
        labelTombol="Simpan perubahan"
        daftarKategori={kategoriList || []}
      />
    </div>
  );
}
