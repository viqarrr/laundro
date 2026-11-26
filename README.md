# Katalog UMKM + Order WhatsApp

Template workshop vibe coding Creative Hub App Talent (CHAT) 2026. Repo ini berisi tampilan aplikasi katalog UMKM; tugasmu merangkainya menjadi sistem utuh dengan bantuan AI: database, login admin, keamanan, dan pemesanan lewat WhatsApp.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fandixurniawan%2Fkatalog-umkm&project-name=katalog-umkm&repository-name=katalog-umkm)

## Langkah awal

1. **Salin repo ke akun GitHub-mu.** Klik tombol **Deploy with Vercel** di atas. Vercel akan membuat repo baru di akun GitHub-mu dan langsung men-deploy-nya. Setelah selesai, buka link Vercel-mu: katalog tampil dengan data contoh.
2. **Buat proyek Supabase.** Masuk ke [supabase.com](https://supabase.com) dengan akun GitHub, lalu buat proyek baru. Simpan password database di tempat aman.
3. **Siapkan database.** Di Supabase, buka **SQL Editor**, tempel seluruh isi `docs/schema.sql`, lalu klik **Run**. Tabel `produk` beserta data awal akan terbentuk.
4. **Siapkan akun admin.** Ikuti panduan akun admin yang dibagikan mentor. Setelah itu matikan pendaftaran akun baru di **Authentication > Sign In / Providers**.
5. **Isi environment variable di Vercel.** Buka proyekmu di Vercel > **Settings > Environment Variables**, lalu isi tiga variabel dari `.env.example`. Nilainya ada di Supabase > **Project Settings > API**. Setelah itu lakukan **Redeploy**.
6. **Clone repo ke laptop.**

   ```bash
   git clone https://github.com/<akunmu>/<nama-repo>.git
   cd <nama-repo>
   npm install
   ```

7. **Buat file `.env.local`.** Salin `.env.example` menjadi `.env.local`, lalu isi dengan nilai yang sama seperti di Vercel.
8. **Jalankan di laptop.**

   ```bash
   npm run dev
   ```

   Buka `http://localhost:3000`.

## Alur kerja

Kerjakan satu user story setiap kali, lalu simpan dan kirim perubahan:

```bash
git add .
git commit -m "US-01: katalog dari database"
git push
```

Setiap `git push`, Vercel otomatis men-deploy versi terbaru. Cek hasilnya di link Vercel-mu.

Urutan yang disarankan: US-01, US-02, US-03, US-04, US-05, US-06, lalu fitur bonus. Daftar lengkap ada di `docs/user-stories.md`.

## Isi repo

| File atau folder | Isi |
| --- | --- |
| `AGENTS.md` | Aturan untuk AI agent, dibaca sebelum setiap prompt |
| `DESIGN.md` | Panduan warna, huruf, dan komponen |
| `PROMPTS.md` | Jurnal prompt, wajib diisi |
| `docs/` | Problem statement, PRD, user story, rancangan teknis, skema database, checklist |
| `lib/toko.js` | Nama toko, nomor WhatsApp, alamat, jam buka |
| `app/` | Halaman aplikasi |
| `components/` | Komponen tampilan |

## Menyesuaikan dengan usahamu

- Identitas toko: ubah `lib/toko.js`.
- Warna: ubah bagian `@theme` di `app/globals.css` (lihat `DESIGN.md`).
- Produk: ubah langsung di Supabase > **Table Editor > produk**.

## Aturan penting

- Jangan menyimpan kunci atau password di kode, dan jangan push file `.env.local`.
- Jangan memberi awalan `NEXT_PUBLIC_` pada environment variable.
- Isi `PROMPTS.md` setiap menyelesaikan fitur.

## Sebelum mengumpulkan

1. Jalankan semua poin di `docs/checklist-keamanan.md` dan `docs/checklist-pengujian.md` pada link Vercel.
2. Lengkapi bagian di bawah ini.
3. Push perubahan terakhir sebelum batas waktu.

## Tentang aplikasi ini

- **Nama usaha:** Laundro (Coin Laundry & Reservasi Antrean Mesin Digital)
- **Pembuat:** Viqar Mulya
- **Link aplikasi:** *(isi dengan URL deploy Vercel aktif, mis. `https://laundro-app.vercel.app`)*
- **Fitur bonus yang dikerjakan:**
  - **Manajemen Katalog & Admin (`US-07` s/d `US-10`, `US-29` s/d `US-35`, `US-46`, `US-47`):** CRUD paket layanan & kategori dinamis (`/admin/kategori`), upload foto ke Supabase Storage (validasi MIME + magic bytes maks 2 MB), status aktif/nonaktif, pengurutan drag-and-drop (`urutan`), pencarian & paginasi server-side, dashboard ringkasan + layanan terpopuler (`US-41`), serta ekspor & impor CSV dengan proteksi CSV injection.
  - **Pengalaman Pengunjung & Katalog Interaktif (`US-11`, `US-12`, `US-15` s/d `US-24`, `US-36`, `US-37`, `US-48`, `US-49`):** Pencarian, filter chip kategori, pengurutan, paginasi "Muat Lebih Banyak", halaman dinamis `/kategori/[slug]`, galeri multi-foto, varian ukuran tabung, kalkulator estimasi berat kg ke jumlah tabung & DP, status stok mesin, harga coret & badge promo, keranjang multi-layanan via WhatsApp, halaman `/tentang`, tombol bagikan tautan, favorit & riwayat terakhir dilihat (`localStorage`), serta halaman perbandingan `/bandingkan`.
  - **Ulasan, Analitik, Pengaturan, Peran, & Audit (`US-38` s/d `US-45`):** Ulasan & rating bintang (status awal `pending` + rate limit) dengan halaman moderasi `/admin/ulasan`, pelacakan klik WhatsApp (`/api/analytics/wa-click`), pengaturan gerai & banner promo dinamis (`/admin/pengaturan`), manajemen peran `SUPERADMIN` vs `STAFF` penjaga outlet (`/admin/akun`, di mana `STAFF` dibatasi khusus pada pengelolaan pesanan, quick walk-in, dan jadwal di `/admin/jadwal`), serta log aktivitas admin (`/admin/log`).
  - **PWA, SEO, Mode Gelap, & Performa (`US-13`, `US-25` s/d `US-28`):** Instalasi PWA (`manifest.json`, `sw.js`, ikon 192 & 512), toggle mode terang/gelap, metadata SEO & Open Graph dinamis, `sitemap.xml` & `robots.txt`, serta halaman 404 & loading skeleton.
  - **Integrasi AI Gemini (`US-14`, `US-50`):** Generator deskripsi paket layanan AI di form admin (`POST /api/ai/deskripsi`) dan widget chat Asisten AI publik (`POST /api/ai/asisten`) yang menjawab rekomendasi paket serta ketersediaan mesin sesuai data aktual gerai.
  - **Fitur Coin Laundry & Hardening Keamanan (`US-EXTRA-01` s/d `US-EXTRA-03`, `K-6` s/d `K-13`):** Skema database additive, identitas visual + logo SVG kustom (`LogoLaundro`), live status mesin, reservasi *linked slots* Washer -> Dryer dengan kunci sementara TTL 15 menit (`PENDING_LOCK`), tracking kode booking `LND-YYMMDD-XXX` (`/antrean`), papan jadwal timeline interaktif admin + quick walk-in (`/admin/jadwal`), serta security headers, CSP ketat, rate limiter, dan error boundary tanpa stack trace.
