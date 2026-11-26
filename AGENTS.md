# Aturan untuk AI Agent

Baca file ini sebelum mengerjakan apa pun. Aturan di sini berlaku untuk setiap prompt.

## ATURAN KERAS SISTEM PENILAIAN, USER STORIES & DOMAIN

- **Single Source of Truth:** Seluruh pengerjaan fitur wajib merujuk pada `docs/user-stories.md` (US-01 s/d US-50, K-6 s/d K-13, serta US-EXTRA-01 s/d US-EXTRA-03) dan menggunakan format pesan commit sesuai nomor US (mis. `US-07: list paket layanan dari database`).
- **Route Guardrail:** Dilarang menghapus atau mengganti nama rute bawaan (`/`, `/produk/[id]`, `/admin`, `/admin/login`, `/admin/password`, `/admin/produk/baru`, `/admin/produk/[id]/ubah`). Fitur baru Coin Laundry (`/antrean`, `/tentang`, `/bandingkan`, `/kategori/[slug]`, `/admin/jadwal`, `/admin/kategori`, `/admin/ulasan`, `/admin/pengaturan`, `/admin/akun`, `/admin/log`) wajib ditambahkan secara additive.
- **Schema Guardrail:** Dilarang menghapus atau mengubah nama tabel/kolom bawaan di `docs/schema.sql`. Perubahan database wajib bersifat additive (menambah kolom nullable/default pada tabel `produk` atau membuat tabel baru seperti `machines`, `bookings`, `machine_time_blocks`, `kategori`, `ulasan`, `wa_clicks`, `pengaturan_toko`, `admin_profiles`, `admin_logs`).
- **Domain Mapping:** Entitas `produk` bawaan dipetakan sebagai "Paket Layanan & Add-on Coin Laundry" (Cuci + Kering, Cuci Saja, Kering Saja, Add-on Deterjen/Pewangi, Drop-off).
- **Security Guardrail (K-6 s/d K-13):** Dilarang menggunakan `dangerouslySetInnerHTML`, `eval()`, `new Function()`, atau `console.log` yang mencetak password, token, API key, atau data sensitif. Setiap Server Action dan API mutasi wajib mengecek sesi login admin dan memvalidasi input di server. Pesan error ke user tidak boleh membocorkan stack trace atau query SQL.
- **Clean UI Rule:** Bebas karakter em-dash pada teks antarmuka, hindari UI emoji berlebihan, hindari template card generik, dan ikuti token visual dari `_ref/test-agy/` saat masuk tahap implementasi desain (US-EXTRA-02).

## Tentang proyek

Aplikasi katalog produk UMKM. Pengunjung melihat katalog dan detail produk, lalu memesan lewat WhatsApp. Pemilik toko masuk ke halaman admin untuk mengganti password dan mengelola produk.

Sebelum mengerjakan fitur, baca:

- `docs/PRD.md` untuk tujuan dan ruang lingkup
- `docs/user-stories.md` untuk kriteria selesai setiap fitur (US-01, US-02, dan seterusnya)
- `docs/rancangan-teknis.md` untuk alur data dan struktur folder
- `DESIGN.md` untuk aturan tampilan

## Stack (jangan diganti)

- Next.js 16 dengan App Router, JavaScript (bukan TypeScript)
- Tailwind CSS 4, token warna ada di `app/globals.css`
- Supabase (`@supabase/supabase-js` dan `@supabase/ssr` sudah terpasang)
- Hosting di Vercel

## Aturan keamanan (wajib)

1. Supabase hanya boleh diakses dari server: Server Component, Server Action, atau Route Handler. Jangan membuat client Supabase di file yang memakai `"use client"`.
2. Environment variable tidak boleh memakai awalan `NEXT_PUBLIC_`. Nama variabel: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (lihat `.env.example`).
3. Setiap aksi yang mengubah data (ganti password, tambah, ubah, hapus produk) wajib memeriksa di server bahwa admin sudah login sebelum dijalankan.
4. Semua halaman di bawah `/admin` (kecuali `/admin/login`) hanya boleh dibuka admin yang sudah login.
5. Jangan menulis kunci, password, atau email admin di dalam kode.
6. Jangan mematikan Row Level Security (RLS) dan jangan mengubah aturan di `docs/schema.sql` tanpa diminta.

## Catatan Next.js 16

- `params` pada halaman dinamis berupa Promise: gunakan `const { id } = await params`.
- File untuk memproteksi rute bernama `proxy.js` di root proyek (pengganti `middleware.js`).
- Gunakan Server Action untuk memproses form.

## Data

Tabel `produk` dengan kolom: `id`, `nama`, `harga`, `deskripsi`, `foto_url`, `kategori`, `created_at`. Jangan mengganti nama kolom. Data contoh di `lib/data-contoh.js` memakai nama kolom yang sama dan tidak dipakai lagi setelah halaman terhubung ke database.

Identitas toko (nama, nomor WhatsApp, alamat, jam buka) ada di `lib/toko.js`.

## Cara bekerja

1. Kerjakan satu fitur atau satu user story per prompt.
2. Ubah hanya file yang disebut atau yang memang dibutuhkan fitur itu.
3. Pakai komponen yang sudah ada di `components/` sebelum membuat yang baru.
4. Jangan memasang paket npm baru tanpa diminta.
5. Jangan menjalankan perintah Git apa pun (commit, push, dan lainnya dilakukan manual oleh pengguna).
6. Hapus komponen `CatatanBelumAktif` dari halaman yang fiturnya sudah selesai.
7. Setelah selesai, jelaskan singkat: file apa saja yang diubah dan cara mengetesnya.
