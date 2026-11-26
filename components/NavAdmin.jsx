import Link from "next/link";
import { logoutAdmin } from "@/app/admin/auth-actions";

export default function NavAdmin() {
  return (
    <nav
      aria-label="Navigasi admin"
      className="flex flex-wrap items-center gap-2 border-b border-garis pb-4 text-sm"
    >
      <Link
        href="/admin"
        className="inline-flex min-h-[40px] items-center rounded-full px-3.5 py-1.5 font-semibold text-teks transition-colors hover:bg-permukaan hover:text-utama"
      >
        Produk
      </Link>
      <Link
        href="/admin/kategori"
        className="inline-flex min-h-[40px] items-center rounded-full px-3.5 py-1.5 font-semibold text-teks transition-colors hover:bg-permukaan hover:text-utama"
      >
        Kategori
      </Link>
      <Link
        href="/admin/password"
        className="inline-flex min-h-[40px] items-center rounded-full px-3.5 py-1.5 font-semibold text-teks transition-colors hover:bg-permukaan hover:text-utama"
      >
        Ganti password
      </Link>

      <form action={logoutAdmin} className="ml-auto">
        <button
          type="submit"
          className="inline-flex min-h-[40px] cursor-pointer items-center rounded-full border border-garis bg-latar px-4 py-1.5 text-sm font-semibold text-teks-lembut transition-colors hover:border-bahaya hover:bg-bahaya-latar hover:text-bahaya"
        >
          Keluar
        </button>
      </form>
    </nav>
  );
}
