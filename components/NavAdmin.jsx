import Link from "next/link";
import { logoutAdmin } from "@/app/admin/auth-actions";

const adminLinks = [
  { href: "/admin", label: "Produk" },
  { href: "/admin/kategori", label: "Kategori" },
  { href: "/admin/jadwal", label: "Jadwal" },
  { href: "/admin/ulasan", label: "Ulasan" },
  { href: "/admin/pengaturan", label: "Pengaturan" },
  { href: "/admin/akun", label: "Akun" },
  { href: "/admin/log", label: "Log" },
  { href: "/admin/password", label: "Ganti password" },
];

export default function NavAdmin() {
  return (
    <nav
      aria-label="Navigasi admin"
      className="flex flex-wrap items-center gap-1.5 border-b border-garis pb-4 text-sm"
    >
      {adminLinks.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex min-h-[38px] items-center rounded-full px-3.5 py-1.5 font-semibold text-teks transition-colors hover:bg-permukaan hover:text-utama"
        >
          {item.label}
        </Link>
      ))}

      <form action={logoutAdmin} className="ml-auto">
        <button
          type="submit"
          className="inline-flex min-h-[38px] cursor-pointer items-center rounded-full border border-garis bg-latar px-4 py-1.5 text-sm font-semibold text-teks-lembut transition-colors hover:border-bahaya hover:bg-bahaya-latar hover:text-bahaya"
        >
          Keluar
        </button>
      </form>
    </nav>
  );
}
