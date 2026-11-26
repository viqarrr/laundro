import Link from "next/link";
import CartHeaderButton from "@/components/CartHeaderButton";
import LogoLaundro from "@/components/LogoLaundro";
import ThemeToggle from "@/components/ThemeToggle";
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
          className="group inline-flex min-h-[44px] items-center whitespace-nowrap transition-opacity hover:opacity-90"
        >
          <LogoLaundro varian="full" nama={namaGerai} />
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
          {/* Slot kontrol tema dan keranjang */}
          <ThemeToggle />
          <CartHeaderButton />
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
