import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
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

export const metadata = {
  title: toko.nama,
  description: toko.tagline,
};

export default async function RootLayout({ children }) {
  const pengaturan = await getPengaturanToko();

  return (
    <html lang="id" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-latar font-sans text-teks antialiased">
        <CartProvider>
          <Header pengaturan={pengaturan} />
          <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 sm:px-6">{children}</main>
          <Footer pengaturan={pengaturan} />
          <CartDrawer pengaturan={pengaturan} />
        </CartProvider>
      </body>
    </html>
  );
}
