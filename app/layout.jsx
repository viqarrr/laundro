import { Inter } from "next/font/google";
import "./globals.css";
import AsistenAI from "@/components/AsistenAI";
import { CartProvider } from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import PwaRegistrar from "@/components/PwaRegistrar";
import { UserPrefsProvider } from "@/components/UserPrefsProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPengaturanToko } from "@/lib/pengaturan";
import { toko } from "@/lib/toko";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

function getMetadataBase() {
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("http://localhost:3000");
}

export const metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: toko.nama,
    template: `%s | ${toko.nama}`,
  },
  description: toko.tagline,
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "id_ID",
    title: toko.nama,
    description: toko.tagline,
    images: [{ url: "/images/hero-machines.jpg", width: 1200, height: 630, alt: toko.nama }],
  },
};

export const viewport = {
  themeColor: "#0066cc",
};

export default async function RootLayout({ children }) {
  const pengaturan = await getPengaturanToko();

  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-latar font-sans text-teks antialiased">
        <PwaRegistrar />
        <UserPrefsProvider>
          <CartProvider>
            <Header pengaturan={pengaturan} />
            <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 sm:px-6">{children}</main>
            <Footer pengaturan={pengaturan} />
            <CartDrawer pengaturan={pengaturan} />
            <AsistenAI />
          </CartProvider>
        </UserPrefsProvider>
      </body>
    </html>
  );
}
