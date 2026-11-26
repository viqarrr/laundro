import Link from "next/link";
import { toko } from "@/lib/toko";

export default function Footer({ pengaturan = null }) {
  const namaGerai = pengaturan?.nama_gerai || toko.nama;
  const alamatGerai = pengaturan?.alamat || toko.alamat;
  const jamBukaGerai = pengaturan?.jam_operasional_label || toko.jamBuka;

  return (
    <footer className="border-t border-garis bg-latar">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-3 px-4 py-6 text-[14px] text-teks-lembut sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="numeric">
          <span className="font-semibold text-teks">{namaGerai}</span>
          {" · "}
          {alamatGerai}
          {" · "}
          {jamBukaGerai}
        </p>

        <nav aria-label="Tautan footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/" className="inline-flex min-h-[36px] items-center text-utama hover:underline underline-offset-4">
            Paket Layanan
          </Link>
          <Link href="/antrean" className="inline-flex min-h-[36px] items-center text-utama hover:underline underline-offset-4">
            Antrean Mesin
          </Link>
          <Link href="/tentang" className="inline-flex min-h-[36px] items-center text-utama hover:underline underline-offset-4">
            Tentang Gerai
          </Link>
          <Link href="/admin" className="inline-flex min-h-[36px] items-center text-utama hover:underline underline-offset-4">
            Portal Admin
          </Link>
        </nav>
      </div>
    </footer>
  );
}
