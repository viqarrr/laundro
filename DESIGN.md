# Panduan Sistem Desain Laundro (Referensi `test-agy`)

Sistem desain ini diekstrak dari referensi `_ref/test-agy/styles.css` dan `_ref/test-agy/index.html` dengan pendekatan antarmuka bersih bergaya galeri modern: kontras tinggi, pembatas hairline, aksen biru fungsional, sudut kontinyu, dan angka tabular.

## 1. Palet Warna (Mode Terang & Mode Gelap)

Seluruh warna didefinisikan sebagai CSS custom properties di `app/globals.css` (`:root` untuk mode terang dan `:root.dark` untuk mode gelap, siap untuk US-25) lalu dipetakan ke token `@theme inline` Tailwind CSS 4.

| Token Tailwind | Mode Terang (`:root`) | Mode Gelap (`:root.dark`) | Kegunaan |
| :--- | :--- | :--- | :--- |
| `latar` | `#ffffff` | `#0b0c10` | Latar utama halaman dan kartu |
| `permukaan` | `#f5f5f7` | `#16181d` | Latar media well, footer, kepala tabel, hover sekunder |
| `permukaan-grup` | `#f2f2f7` | `#101216` | Latar section terkelompok dan area wizard |
| `garis` | `rgba(60, 60, 67, 0.16)` | `rgba(235, 235, 245, 0.16)` | Garis tepi hairline kartu, navbar, dan pemisah baris |
| `garis-tegas` | `#c6c6c8` | `#383a42` | Border kontrol form, input, dan tombol sekunder |
| `teks` | `#1d1d1f` | `#f5f5f7` | Teks utama dan judul |
| `teks-lembut` | `#5c5c60` | `#a1a1aa` | Teks pendukung, label kategori, metadata |
| `utama` | `#0066cc` | `#0a84ff` | Tombol utama, tautan aktif, fokus, aksen interaktif |
| `utama-gelap` | `#0055b3` | `#0071e3` | Status hover tombol utama |
| `utama-lembut` | `rgba(0, 122, 255, 0.08)` | `rgba(10, 132, 255, 0.16)` | Latar badge info dan chip terpilih |
| `harga` | `#9c5700` | `#ffb340` | Teks label promo, peringatan, dan hemat |
| `harga-latar` | `rgba(255, 149, 0, 0.12)` | `rgba(255, 159, 10, 0.16)` | Latar pill promo/hemat dan banner peringatan |
| `sukses` | `#1b7f37` | `#32d74b` | Status mesin tersedia dan konfirmasi DP |
| `sukses-latar` | `rgba(52, 199, 89, 0.14)` | `rgba(48, 209, 88, 0.18)` | Latar badge status aktif/tersedia |
| `bahaya` | `#c9241b` | `#ff453a` | Aksi hapus, error validasi, dan pembatalan |
| `bahaya-latar` | `rgba(255, 59, 48, 0.08)` | `rgba(255, 69, 58, 0.16)` | Latar hover tombol destruktif dan pesan error |

Gunakan kelas token Tailwind seperti `bg-latar`, `bg-permukaan`, `text-teks`, `text-teks-lembut`, `border-garis`, dan `bg-utama` tanpa menuliskan hex warna langsung di JSX.

## 2. Tipografi

- **Font Utama (Display & Body):** `Inter` dimuat lewat `next/font/google` di `app/layout.jsx` dengan fallback `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif`.
- **Font Monospace & Angka:** `"SF Mono", ui-monospace, Menlo, Consolas, monospace`. Seluruh harga, durasi menit, kapasitas kg, kode booking, dan penghitung waktu wajib memakai `tabular-nums` (`.numeric`).
- **Skala & Letter-Spacing:**
  - Hero: `clamp(34px, 4.5vw, 52px)`, `font-semibold` (600), `leading-[1.08]`, `tracking-[-0.025em]`
  - Large Title: `clamp(26px, 3vw, 34px)`, `font-semibold` (600), `leading-[1.18]`, `tracking-[-0.02em]`
  - Title 1: `28px`, `font-semibold` (600), `leading-[34px]`, `tracking-[-0.015em]`
  - Title 2: `22px`, `font-semibold` (600), `leading-[28px]`, `tracking-[-0.01em]`
  - Headline / Body: `17px`, `font-semibold` / `font-normal`, `leading-[22px]`, `tracking-[-0.02em]`
  - Footnote: `14px` / `13px`, `leading-[20px]` / `leading-[18px]`, `tracking-[-0.01em]`
  - Ukuran teks minimal di seluruh UI adalah `12px` (`text-xs`).

## 3. Spacing, Border-Radius, Tombol & Kartu

- **Basis Spacing (8px):** `4px`, `8px`, `16px`, `24px`, `32px`, `56px`, `72px`.
- **Lebar Kontainer:** `max-w-[1080px]` untuk halaman utama, katalog, header, dan footer; `max-w-[780px]` untuk halaman form/wizard reservasi.
- **Border Radius:**
  - Kontrol, input, dan thumbnail dalam: `8px` (`rounded-[8px]`)
  - Wadah media kartu & slot box: `14px` (`rounded-[14px]`)
  - Kartu utama, panel, dan sheet: `20px` (`rounded-[20px]`)
  - Tombol, chip filter, badge status: `9999px` (`rounded-full`)
- **Bayangan:** Bayangan tunggal `--shadow-product` (`3px 5px 30px 0 rgba(0, 0, 0, 0.22)`) hanya dipakai pada fotografi mesin/produk, bukan pada container kartu generik.
- **Tombol (`components/Tombol.jsx`):** Tinggi sentuh minimal `44px`, bentuk pill (`rounded-full`), efek tekan `active:scale-[0.96]`, mendukung varian `utama`, `garis`, `bahaya`, dan `lembut`.
- **Kartu Layanan (`components/KartuProduk.jsx`):** Kartu kontinyu `rounded-[20px]` dengan pembatas hairline `border-garis`, wadah foto `bg-permukaan rounded-[14px]`, metadata kapasitas/durasi tabular, badge opsional, harga coret bila ada promo, dan harga Rupiah yang tegas.

## 4. Aturan Kebersihan Antarmuka

- Gunakan bahasa Indonesia yang ringkas, jelas, dan berbasis aksi (contoh: "Simpan produk", "Pesan slot mesin").
- Dilarang memakai karakter em-dash pada teks antarmuka. Gunakan tanda hubung biasa (`-`) atau titik tengah (`·`) seperlunya.
- Hindari penggunaan emoji berlebihan pada UI.
- Selalu verifikasi keterbacaan di lebar mobile (`390px`) dengan target sentuh minimal `44px`.
