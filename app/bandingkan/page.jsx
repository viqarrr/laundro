import Link from "next/link";
import BandingkanClient from "@/components/BandingkanClient";
import { getPengaturanToko } from "@/lib/pengaturan";
import { createSupabasePublicClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bandingkan Paket Layanan",
  description: "Bandingkan tarif, kapasitas tabung, durasi siklus, dan cakupan mesin antar layanan.",
};

export default async function HalamanBandingkan() {
  const supabase = createSupabasePublicClient();
  const [produkRes, pengaturan] = await Promise.all([
    supabase
      .from("produk")
      .select(
        "id, nama, deskripsi, harga, harga_coret, badge, foto_url, kategori, max_capacity_kg, cycle_duration_minutes, requires_washer, requires_dryer, stok"
      )
      .eq("aktif", true)
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: false }),
    getPengaturanToko(),
  ]);

  return (
    <div className="flex flex-col gap-8 py-10 sm:py-12">
      <header className="border-b border-garis pb-6">
        <Link href="/" className="text-sm font-medium text-utama hover:underline">
          &#8249; Kembali ke katalog
        </Link>
        <h1 className="mt-3 text-[clamp(28px,3.5vw,38px)] font-semibold tracking-[-0.02em] text-teks">
          Bandingkan 2 Paket Layanan
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-teks-lembut">
          Bandingkan tarif, kapasitas maksimal kg, durasi siklus, dan cakupan Washer/Dryer secara
          berdampingan sebelum memesan.
        </p>
      </header>

      <BandingkanClient semuaProduk={produkRes.data || []} pengaturan={pengaturan} />
    </div>
  );
}
