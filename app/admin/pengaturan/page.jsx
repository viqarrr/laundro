import NavAdmin from "@/components/NavAdmin";
import FormPengaturan from "@/components/FormPengaturan";
import { getPengaturanToko } from "@/lib/pengaturan";
import { requireSuperAdmin } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export default async function HalamanPengaturanAdmin() {
  await requireSuperAdmin();
  const pengaturan = await getPengaturanToko();

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <div>
        <span className="inline-flex items-center rounded-full bg-utama-lembut px-3 py-1 text-xs font-semibold text-utama">
          Khusus Superadmin
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-teks">
          Pengaturan Gerai &amp; Banner Promo
        </h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Kelola identitas toko, jam operasional, jeda mesin, aturan DP, rekening transfer, dan
          banner promo beranda.
        </p>
      </div>

      <FormPengaturan pengaturan={pengaturan} />
    </div>
  );
}
