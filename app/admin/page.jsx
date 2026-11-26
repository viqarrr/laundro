import NavAdmin from "@/components/NavAdmin";
import TabelProduk from "@/components/TabelProduk";
import Tombol from "@/components/Tombol";
import CatatanBelumAktif from "@/components/CatatanBelumAktif";
import { produkContoh } from "@/lib/data-contoh";
import { requireAdmin } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export default async function HalamanAdmin() {
  await requireAdmin();

  // US-07 (bonus): daftar produk masih memakai data contoh, belum dari database.
  const daftarProduk = produkContoh;

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-teks">Produk</h1>
        {/* US-08 (bonus): tambah produk */}
        <Tombol href="/admin/produk/baru">Tambah produk</Tombol>
      </div>
      <CatatanBelumAktif>
        Daftar produk masih memakai data contoh: lihat US-07 di docs/user-stories.md.
      </CatatanBelumAktif>
      <TabelProduk daftarProduk={daftarProduk} />
    </div>
  );
}
