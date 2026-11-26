import Link from "next/link";
import { notFound } from "next/navigation";
import TombolWhatsApp from "@/components/TombolWhatsApp";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

async function ambilDetailLayanan(id) {
  if (!/^\d+$/.test(String(id))) {
    return null;
  }

  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("produk")
      .select(
        "id, nama, harga, harga_coret, badge, deskripsi, foto_url, kategori, max_capacity_kg, cycle_duration_minutes, requires_washer, requires_dryer, stok, aktif"
      )
      .eq("id", Number(id))
      .eq("aktif", true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export default async function HalamanDetailProduk({ params }) {
  const { id } = await params;
  const produk = await ambilDetailLayanan(id);

  if (!produk) {
    notFound();
  }

  const adaPromo = Number(produk.harga_coret) > Number(produk.harga);
  const isDarkMedia = typeof produk.foto_url === "string" && produk.foto_url.includes("dark-drum");

  return (
    <article className="py-10 sm:py-12">
      <Link
        href="/"
        className="inline-flex min-h-[40px] items-center gap-1.5 text-[15px] font-medium text-utama hover:underline underline-offset-4"
      >
        <span>&#8249; Kembali ke katalog</span>
      </Link>

      <div className="mt-6 grid items-start gap-8 md:grid-cols-[0.95fr_1.05fr] md:gap-12">
        <div
          className={`flex items-center justify-center rounded-[20px] border border-garis p-6 ${
            isDarkMedia ? "bg-[#272729]" : "bg-permukaan"
          }`}
        >
          <img
            src={produk.foto_url || "/images/hero-machines.jpg"}
            alt={produk.nama}
            className="aspect-square max-h-[380px] w-full rounded-[14px] object-cover shadow-product"
          />
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            {produk.kategori ? (
              <span className="rounded-full bg-permukaan px-3 py-1 text-xs font-semibold text-teks-lembut">
                {produk.kategori}
              </span>
            ) : null}
            {produk.badge ? (
              <span className="rounded-full bg-utama-lembut px-3 py-1 text-xs font-semibold text-utama">
                {produk.badge}
              </span>
            ) : null}
          </div>

          <h1 className="text-[clamp(26px,3vw,34px)] font-semibold leading-[1.18] tracking-[-0.02em] text-teks">
            {produk.nama}
          </h1>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="numeric text-[28px] font-semibold leading-[34px] tracking-[-0.015em] text-teks">
              {formatRupiah(produk.harga)}
            </span>
            {adaPromo ? (
              <span className="numeric text-[15px] text-teks-lembut line-through">
                {formatRupiah(produk.harga_coret)}
              </span>
            ) : null}
          </div>

          {produk.deskripsi ? (
            <p className="max-w-prose text-[16px] leading-[24px] tracking-[-0.015em] text-teks-lembut">
              {produk.deskripsi}
            </p>
          ) : null}

          {produk.max_capacity_kg || produk.cycle_duration_minutes ? (
            <div className="overflow-hidden rounded-[20px] border border-garis bg-latar">
              {produk.max_capacity_kg ? (
                <div className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
                  <span className="text-teks-lembut">Kapasitas Tabung Maksimal</span>
                  <span className="numeric font-semibold text-teks">{produk.max_capacity_kg} kg</span>
                </div>
              ) : null}
              {produk.cycle_duration_minutes ? (
                <div className="flex items-center justify-between gap-4 border-t border-garis px-5 py-3.5 text-sm">
                  <span className="text-teks-lembut">Estimasi Durasi Siklus</span>
                  <span className="numeric font-semibold text-teks">
                    {produk.cycle_duration_minutes} menit
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4 border-t border-garis px-5 py-3.5 text-sm">
                <span className="text-teks-lembut">Cakupan Mesin</span>
                <span className="font-semibold text-teks">
                  {[
                    produk.requires_washer ? "Washer" : null,
                    produk.requires_dryer ? "Dryer" : null,
                  ]
                    .filter(Boolean)
                    .join(" + ") || "Add-on / Layanan Gerai"}
                </span>
              </div>
            </div>
          ) : null}

          <div className="pt-1">
            <TombolWhatsApp produk={produk} />
          </div>
        </div>
      </div>
    </article>
  );
}
