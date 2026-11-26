import Link from "next/link";

const gaya = {
  utama: "bg-utama text-white hover:bg-utama-gelap",
  garis: "border border-garis-tegas bg-latar text-teks hover:border-utama hover:text-utama hover:bg-permukaan",
  bahaya: "border border-garis bg-latar text-bahaya hover:border-bahaya hover:bg-bahaya-latar",
  lembut: "bg-utama-lembut text-utama hover:opacity-90",
};

export default function Tombol({ href, varian = "utama", className = "", children, ...props }) {
  const kelasVarian = gaya[varian] || gaya.utama;
  const kelas = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-[-0.01em] whitespace-nowrap transition-all duration-150 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45 ${kelasVarian} ${className}`;

  if (href) {
    return (
      <Link href={href} className={kelas}>
        {children}
      </Link>
    );
  }

  return (
    <button className={kelas} {...props}>
      {children}
    </button>
  );
}
