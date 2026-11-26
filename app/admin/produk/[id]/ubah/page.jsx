import { notFound } from "next/navigation";
import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import CatatanBelumAktif from "@/components/CatatanBelumAktif";
import { cariProdukContoh } from "@/lib/data-contoh";
import { requireAdmin } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

// US-09 (bonus): ubah produk.
export default async function HalamanUbahProduk({ params }) {
  await requireAdmin();

  const { id } = await params;
  const produk = cariProdukContoh(id);

  if (!produk) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-teks">Ubah produk</h1>
      <CatatanBelumAktif>Simpan perubahan belum berfungsi: lihat US-09.</CatatanBelumAktif>
      <FormProduk produk={produk} labelTombol="Simpan perubahan" />
    </div>
  );
}
