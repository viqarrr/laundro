import Link from "next/link";
import CartHeaderButton from "@/components/CartHeaderButton";
import { toko } from "@/lib/toko";

const navItems = [
  { href: "/", label: "Beranda" },
  { href: "/antrean", label: "Antrean" },
  { href: "/tentang", label: "Tentang" },
];

export default function Header({ pengaturan = null }) {
  const namaGerai = pengaturan?.nama_gerai || toko.nama;
  return (
    <header
      className="sticky top-0 z-50 border-b border-garis backdrop-blur-xl"
      style={{ backgroundColor: "var(--nav-latar)" }}
    >
      <div className="mx-auto flex h-16 max-w-[1080px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2.5 text-[18px] font-semibold tracking-[-0.02em] text-teks whitespace-nowrap transition-colors hover:text-utama"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className="shrink-0 text-utama"
          >
            <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="10" cy="10" r="3.75" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="10" cy="10" r="1.2" fill="currentColor" />
          </svg>
          <span>{namaGerai}</span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-6 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-[44px] items-center px-1.5 text-[15px] font-medium text-teks-lembut whitespace-nowrap transition-colors hover:text-teks"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Slot kontrol tema, keranjang, dan akses cepat admin */}
          <CartHeaderButton />
          <Link
            href="/admin"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-garis bg-permukaan px-3.5 py-1.5 text-xs font-semibold text-teks whitespace-nowrap transition-colors hover:border-garis-tegas"
          >
            <span className="h-2 w-2 rounded-full bg-utama" aria-hidden="true" />
            <span>Admin</span>
          </Link>
        </div>
      </div>

      <nav
        aria-label="Navigasi mobile"
        className="flex items-center gap-4 overflow-x-auto border-t border-garis px-4 sm:hidden"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex min-h-[44px] shrink-0 items-center text-sm font-medium text-teks-lembut transition-colors hover:text-teks"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
