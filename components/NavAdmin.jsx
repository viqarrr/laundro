import Link from "next/link";
import TombolKeluarAdmin from "@/components/TombolKeluarAdmin";
import { ensureAdminProfile, getAdminSession } from "@/lib/supabase/session";

const superAdminLinks = [
  { href: "/admin", label: "Produk" },
  { href: "/admin/kategori", label: "Kategori" },
  { href: "/admin/jadwal", label: "Jadwal" },
  { href: "/admin/ulasan", label: "Ulasan" },
  { href: "/admin/pengaturan", label: "Pengaturan" },
  { href: "/admin/akun", label: "Akun" },
  { href: "/admin/log", label: "Log" },
  { href: "/admin/password", label: "Ganti password" },
];

const staffLinks = [{ href: "/admin/jadwal", label: "Jadwal" }];

export default async function NavAdmin({ role = null }) {
  let effectiveRole = role;
  if (!effectiveRole) {
    const session = await getAdminSession();
    if (session) {
      const profile = await ensureAdminProfile(session);
      effectiveRole = profile?.role || "STAFF";
    } else {
      effectiveRole = "STAFF";
    }
  }

  const adminLinks = effectiveRole === "SUPERADMIN" ? superAdminLinks : staffLinks;

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

      <TombolKeluarAdmin />
    </nav>
  );
}
