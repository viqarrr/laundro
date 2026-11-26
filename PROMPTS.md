# Jurnal Prompt

Catat prompt penting selama membangun aplikasi: apa yang kamu minta, hasilnya, dan perbaikan yang dilakukan. Beri tanda **[SENDIRI]** untuk prompt yang kamu tulis sendiri (bukan dari lembar kerja).

## US-01 Katalog dari database

**Prompt:** **[SENDIRI]**
Kerjakan US-01 dengan setup `lib/supabase/server.js` memakai `@supabase/ssr` untuk Next.js 16. Ubah `app/page.jsx` menjadi Server Component yang mengambil seluruh paket layanan coin laundry aktif (`aktif = true`, urut `urutan ASC, created_at DESC`) dari tabel `produk` Supabase, bukan dari `lib/data-contoh.js`. Tampilkan Hero section sesuai `DESIGN.md` dengan `/images/hero-machines.jpg` dan grid `KartuProduk.jsx` berisi foto, kategori, nama paket, durasi/kapasitas singkat, serta harga Rupiah. Sediakan empty state jika data kosong.

**Hasil:**
Katalog beranda `/` berhasil memuat paket layanan Coin Laundry langsung dari Supabase di sisi server dengan format harga Rupiah dan tampilan mengikuti sistem desain Laundro.

**Perbaikan:**
Menghapus sisa aset SVG dummy UMKM lama (`batik.svg`, `tas.svg`, dll.) di `public/produk/` dan mengganti fallback `lib/data-contoh.js` agar konsisten dengan layanan coin laundry.

## US-02 Detail produk

**Prompt:** **[SENDIRI]**
Kerjakan US-02 pada `app/produk/[id]/page.jsx`. Ambil detail satu paket layanan berdasarkan `id` dari tabel `produk` Supabase (foto, kategori, nama, harga, kapasitas maksimal kg, durasi siklus menit, dan deskripsi). Panggil `notFound()` jika ID tidak ditemukan atau statusnya tidak aktif.

**Hasil:**
Halaman `/produk/[id]` menampilkan detail lengkap layanan laundry dari database dan otomatis mengarah ke halaman 404 ketika mengakses ID yang tidak valid.

**Perbaikan:**
Memastikan `app/not-found.jsx` menggunakan token desain Laundro dan memiliki tombol kembali ke beranda agar tidak tampil polos.

## US-03 Pesan via WhatsApp

**Prompt:** **[SENDIRI]**
Kerjakan US-03 pada `components/TombolWhatsApp.jsx`. Buat tombol "Pesan via WhatsApp" yang mengarah ke `https://wa.me/[nomor]` menggunakan nomor dari `lib/toko.js` (diformat ke 628xxx) dengan teks `encodeURIComponent` berisi nama paket dan harga Rupiah, serta `target="_blank" rel="noopener noreferrer"` agar berfungsi di HP dan desktop.

**Hasil:**
Tombol WhatsApp langsung membuka chat dengan draf pesan otomatis berisi nama paket dan harga layanan di perangkat mobile maupun desktop.

**Perbaikan:**
Menambahkan sanitasi format nomor telepon agar tanda `+`, spasi, atau awalan `08` otomatis dikonversi ke `628` sehingga tautan `wa.me` selalu valid.

## US-04 Login admin

**Prompt:** **[SENDIRI]**
Kerjakan US-04 dengan memisahkan logika autentikasi ke `app/admin/auth-actions.js` (Server Actions `loginAdmin` dan `logoutAdmin`) menggunakan Supabase Auth di sisi server. Sambungkan ke `app/admin/login/page.jsx` dan tombol "Keluar" di `components/NavAdmin.jsx`. Redirect ke `/admin` saat berhasil dan tampilkan pesan error ramah tanpa detail teknis saat gagal.

**Hasil:**
Admin dapat login menggunakan akun Supabase Auth, diarahkan ke `/admin`, dan mengakhiri sesi lewat tombol "Keluar" kembali ke `/admin/login`.

**Perbaikan:**
Memisahkan `auth-actions.js` dari file CRUD produk agar tidak menumpuk menjadi satu file besar (God File) dan memastikan tidak ada `console.log` kredensial atau token.

## US-05 Ganti password

**Prompt:** **[SENDIRI]**
Kerjakan US-05 di `app/admin/password/page.jsx` dan `gantiPasswordAdmin` pada `app/admin/auth-actions.js`. Wajib periksa sesi login di server via `requireAdmin()`, validasi password baru minimal 8 karakter dan cocok dengan konfirmasi password, lalu perbarui lewat Supabase Auth dengan pesan berhasil atau error yang jelas.

**Hasil:**
Form ganti password di `/admin/password` berfungsi penuh dengan validasi server-side dan umpan balik status yang jelas.

**Perbaikan:**
Menambahkan validasi konfirmasi password di sisi server (tidak hanya di HTML form) agar permintaan langsung ke Server Action tetap tervalidasi.

## US-06 Proteksi halaman admin

**Prompt:** **[SENDIRI]**
Kerjakan US-06 dengan membuat `lib/supabase/session.js` (`getAdminSession`, `requireAdmin`), `proxy.js` (konvensi Next.js 16), dan `app/admin/layout.jsx`. Proteksi seluruh rute `/admin/*` kecuali `/admin/login` agar pengguna tanpa sesi otomatis dialihkan ke `/admin/login`, serta pastikan setiap Server Action mutasi memeriksa sesi di server.

**Hasil:**
Seluruh halaman admin dan Server Action terlindungi di sisi server. Akses langsung ke `/admin` atau `/admin/produk/baru` tanpa login langsung dialihkan ke `/admin/login`.

**Perbaikan:**
Menambahkan pengecekan agar admin yang sudah login dan membuka `/admin/login` langsung dialihkan ke `/admin`, serta menghapus `components/CatatanBelumAktif.jsx` yang sudah tidak terpakai.

---

## Debugging dan fitur bonus

### Setup Guardrail, Upgrade Next.js, & Identitas Gerai (K-10)

**Prompt:** **[SENDIRI]**
Verifikasi upgrade `next@16.4.3` di `package.json` untuk menutup kerentanan critical (K-10), tambahkan folder `_ref/` ke `.gitignore` agar dokumen BRD dan referensi desain mentah tidak ikut ter-commit, perbarui `AGENTS.md` dengan guardrail rute/schema/keamanan, dan ubah `lib/toko.js` menjadi identitas gerai Coin Laundry "Laundro".

**Hasil:**
Next.js berjalan di versi `16.4.3`, `npm audit --omit=dev` bebas celah critical, aturan guardrail tertanam di `AGENTS.md`, dan artefak referensi bersih dari `git status`.

**Perbaikan:**
Menyalin aset foto asli (`hero-machines.jpg`, `dark-drum.jpg`, `coin-tokens.jpg`) ke `public/images/` sebelum folder `_ref/` diabaikan oleh `.gitignore`.

### US-EXTRA-01 & US-EXTRA-02: Schema Database Additive & Porting Desain

**Prompt:** **[SENDIRI]**
Buat file migrasi idempoten `docs/schema-laundry.sql` yang menambahkan kolom laundry pada tabel `produk` tanpa menghapus kolom bawaan, serta membuat tabel baru (`kategori`, `pengaturan_toko`, `machines`, `bookings`, `machine_time_blocks`, `ulasan`, `wa_clicks`, `admin_profiles`, `admin_logs`) lengkap dengan RLS policy dan `docs/seed-laundry.sql`. Ekstrak token desain dari `_ref/test-agy/styles.css` ke `DESIGN.md` dan `app/globals.css`, lalu restyle komponen dasar tanpa `dangerouslySetInnerHTML` atau kode vanilla DOM.

**Hasil:**
Seluruh tabel dan data awal (4 kategori, 8 paket layanan, 4 Washer, 4 Dryer, pengaturan gerai) berhasil dieksekusi di Supabase SQL Editor. Tampilan publik mengadopsi palet warna dan tipografi referensi desain dengan bersih.

**Perbaikan:**
Menyesuaikan struktur `DESIGN.md` agar sekaligus mendefinisikan variabel CSS untuk mode terang dan mode gelap (kesiapan US-25).

### K-6 s/d K-13: Hardening Keamanan Lanjutan

**Prompt:** **[SENDIRI]**
Pasang header keamanan global dan Content-Security-Policy ketat (K-6, K-11) serta `X-Robots-Tag: noindex, nofollow` untuk `/admin/*` di `next.config.mjs`. Tambahkan metadata `robots: { index: false, follow: false }` di `app/admin/layout.jsx` dan buat `app/robots.js` (K-8). Buat `app/error.jsx` dan `app/global-error.jsx` tanpa stack trace (K-9), serta buat `lib/rate-limit.js` untuk membatasi percobaan login di `auth-actions.js` (K-12). Audit codebase agar bebas `dangerouslySetInnerHTML`, `eval`, dan `console.log` sensitif (K-7, K-13).

**Hasil:**
Response header keamanan dan CSP aktif di seluruh rute, `/admin` terblokir dari indexing mesin pencari, percobaan login salah ke-6 ditolak oleh rate limiter, dan error boundary tampil ramah tanpa membocorkan stack trace.

**Perbaikan:**
Menyesuaikan directive `img-src` dan `connect-src` pada CSP agar domain `https://*.supabase.co` dan `wss://*.supabase.co` tetap diizinkan tanpa memblokir foto dari Supabase Storage.

### Debugging: Gagal Upload Foto ke Supabase Storage (US-29)

**Prompt:** **[SENDIRI]**
Terjadi error "Gagal mengunggah foto ke penyimpanan. Pastikan bucket 'produk-images' sudah dibuat atau gunakan link foto" saat menambah produk dengan unggah gambar di `/admin/produk/baru`.

**Hasil:**
Ditemukan dua penyebab: bucket `produk-images` belum memiliki RLS policy `INSERT`/`UPDATE`/`DELETE` untuk role `authenticated` di tabel `storage.objects`, dan batas default payload Server Action Next.js hanya 1 MB.

**Perbaikan:**
Menjalankan query SQL di Supabase untuk membuat/memastikan bucket publik `produk-images` beserta policy `SELECT` publik dan `INSERT/UPDATE/DELETE` untuk `authenticated`, serta menaikkan `experimental.serverActions.bodySizeLimit` di `next.config.mjs` menjadi `4mb`.

### US-07 s/d US-10, US-29, US-31, US-32, US-33, US-34, US-47: CRUD Layanan & Kategori Admin

**Prompt:** **[SENDIRI]**
Buat validator server `lib/validators/produk.js` (US-34) dan pisahkan Server Actions ke `app/admin/produk-actions.js` (wajib `requireAdmin()`). Implementasikan list produk dari database dengan pencarian, filter status, dan paginasi server-side (US-07, US-33), form tambah/ubah dengan upload foto ke Storage (US-08, US-09, US-29), hapus dengan konfirmasi (US-10), toggle aktif/nonaktif (US-32), dan atur urutan tampil (US-47). Lanjutkan dengan CRUD kategori dinamis di `/admin/kategori` (US-31) yang terhubung ke dropdown form produk.

**Hasil:**
Seluruh alur CRUD layanan dan kategori di panel admin berjalan mulus dengan validasi per field di server, upload foto otomatis ke Supabase Storage, dan kontrol visibilitas serta urutan tampil langsung tercermin di katalog publik.

**Perbaikan:**
Memastikan setiap mutasi memanggil `revalidatePath('/')` dan `revalidatePath('/admin')` agar perubahan status aktif/nonaktif dan urutan langsung terlihat tanpa hard refresh.

### US-11, US-12, US-15 s/d US-21, US-48, US-49: Katalog Interaktif, Kalkulator Berat, Varian, Galeri, & Keranjang WA

**Prompt:** **[SENDIRI]**
Buat `components/KatalogInteraktif.jsx` untuk pencarian teks, filter chip kategori (US-11), pengurutan (US-15), dan paginasi (US-16), serta tampilkan status stok (US-19) dan harga coret/badge (US-20) pada `KartuProduk.jsx`. Buat halaman dinamis `/kategori/[slug]` (US-49). Di `/produk/[id]`, bangun `GaleriProduk.jsx` (US-18), `KalkulatorLaundry.jsx` untuk pilihan varian ukuran tabung (US-48) dan kalkulator estimasi berat kg ke jumlah tabung (US-12), produk terkait (US-17), serta `CartProvider` + `CartDrawer` untuk pesan semua item via WhatsApp (US-21). Tambahkan dukungan input galeri dan varian di `FormProduk.jsx`.

**Hasil:**
Pengunjung bisa menyaring, mengurutkan, dan melihat halaman per kategori; memilih ukuran tabung (Standar 7 kg / Jumbo 10 kg) dengan perhitungan jumlah tabung dan estimasi DP otomatis; serta menggabungkan beberapa layanan ke dalam satu pesan WhatsApp lewat drawer keranjang.

**Perbaikan:**
Menangani sinkronisasi `localStorage` pada `CartProvider` menggunakan state mounted agar tidak menimbulkan hydration mismatch di Next.js App Router.

### US-30, US-40 s/d US-45: Pengaturan Gerai, Role Admin, Audit Log, Banner Promo, & Analitik

**Prompt:** **[SENDIRI]**
Buat helper `lib/pengaturan.js` dan `lib/admin-log.js`. Bangun `/admin/pengaturan` (US-42, US-43) untuk mengubah info gerai, buffer time, aturan DP, rekening transfer, dan banner promo beranda; `/admin/akun` (US-44) untuk manajemen role `SUPERADMIN`/`STAFF`; dan `/admin/log` (US-45) untuk riwayat aktivitas admin. Buat `POST /api/analytics/wa-click` (US-40) dengan trigger non-blocking di tombol WA, lalu tampilkan Dashboard Ringkasan (US-30) dan widget Layanan Terlaris (US-41) di `/admin`.

**Hasil:**
Pemilik gerai dapat mengatur profil toko, nominal DP, dan banner promo tanpa ubah kode; klik WhatsApp tercatat otomatis ke database; dan dashboard admin menampilkan metrik operasional serta peringkat layanan terpopuler.

**Perbaikan:**
Menambahkan mekanisme auto-bootstrap akun admin pertama sebagai `SUPERADMIN` di `admin_profiles` agar akses ke `/admin/pengaturan` dan `/admin/akun` tidak terkunci saat pertama kali login.

### US-EXTRA-03: Core Reservasi Coin Laundry (Slot Picker TTL 15 Menit & Timeline Grid Admin)

**Prompt:** **[SENDIRI]**
Buat `lib/laundry-scheduler.js` untuk auto-release kunci slot kadaluwarsa (`PENDING_LOCK` > 15 menit), cek anti-overlap per `machine_id`, pencarian *linked slots* Washer + buffer 5 menit ke Dryer, generator Kode Booking `LND-YYMMDD-XXX`, dan kalkulasi nominal DP. Bangun `/antrean` berisi `LiveMesinStatus.jsx`, `MachineSlotPicker.jsx` (dilindungi rate limit K-12, countdown 15 menit, dan tombol konfirmasi bukti DP via WA sesuai format BRD), dan `TrackingBooking.jsx`. Bangun `/admin/jadwal` dengan `MachineTimelineGrid.jsx` untuk konfirmasi DP, perpanjang timer +10 menit, quick walk-in, kontrol siklus mesin, pindah mesin, dan sakelar maintenance.

**Hasil:**
Pelanggan dapat melihat status mesin real-time, memesan blok waktu spesifik (Washer -> Dryer) dengan kunci sementara 15 menit dan pesan WA berisi Kode Booking serta nominal DP, lalu melacak status antreannya. Admin penjaga dapat mengelola seluruh jadwal mesin dan walk-in dalam satu timeline grid.

**Perbaikan:**
Memastikan `releaseExpiredLocks()` selalu dipanggil sebelum pengecekan bentrok slot agar slot yang ditinggalkan user (hit-and-run > 15 menit) langsung terbuka kembali tanpa menunggu cron job eksternal.

### US-13, US-22 s/d US-28, US-36, US-37: PWA, Mode Gelap, SEO, Sitemap, Loading, & Komparasi

**Prompt:** **[SENDIRI]**
Tambahkan `public/manifest.json` dan `public/sw.js` (US-13), `ThemeToggle.jsx` untuk mode gelap/terang (US-25), metadata SEO & Open Graph dinamis (US-26), `app/sitemap.js` (US-27), dan skeleton `loading.jsx` untuk publik serta admin (US-28). Buat halaman `/tentang` (US-22), `TombolBagikan.jsx` (US-23), fitur simpan Favorit di `localStorage` (US-24), `TerakhirDilihat.jsx` (US-36), dan halaman komparasi `/bandingkan` untuk 2 layanan berdampingan (US-37).

**Hasil:**
Aplikasi mendukung instalasi PWA, pergantian tema terang/gelap yang konsisten, SEO lengkap dengan `sitemap.xml` dan `robots.txt`, loading skeleton, halaman tentang gerai, serta fitur favorit, riwayat terakhir dilihat, dan perbandingan 2 paket layanan.

**Perbaikan:**
Menyelaraskan warna border, permukaan kartu, dan kontras teks pada mode gelap agar seluruh komponen publik maupun tabel admin tetap nyaman dibaca.

### US-35, US-38, US-39, US-46: Ulasan/Moderasi & Ekspor/Impor CSV

**Prompt:** **[SENDIRI]**
Implementasikan sistem ulasan & rating bintang 1-5 di `/produk/[id]` dengan status default `pending` dan rate limit (US-38), serta halaman moderasi `/admin/ulasan` untuk setujui/tolak/hapus ulasan (US-39). Buat endpoint terproteksi `GET /api/admin/produk/export` dengan proteksi CSV injection (US-35) dan fitur impor CSV dengan validasi tiap baris serta laporan baris berhasil/gagal di `/admin` (US-46).

**Hasil:**
Pengunjung dapat mengirim ulasan yang baru tampil ke publik setelah disetujui admin, sementara admin dapat mengekspor data layanan ke `.csv` dan mengimpor banyak layanan sekaligus dengan umpan balik validasi per baris.

**Perbaikan:**
Menambahkan sanitasi prefix petik tunggal (`'`) pada sel CSV yang diawali karakter formula (`=`, `+`, `-`, `@`) untuk mencegah celah CSV injection saat dibuka di spreadsheet.

### US-14 & US-50: Generator Deskripsi AI Admin & Asisten AI Tanya Jawab Produk

**Prompt:** **[SENDIRI]**
Bangun `POST /api/ai/deskripsi` (terproteksi sesi admin + rate limit) memakai `GEMINI_API_KEY` dan model `gemini-2.5-flash` lalu hubungkan ke tombol "Buat Deskripsi AI" di `FormProduk.jsx` dengan aturan output ringkas tanpa em-dash (US-14). Bangun `POST /api/ai/asisten` (dilindungi rate limit) yang mengambil konteks katalog layanan aktif dan status mesin dari Supabase agar jawaban akurat, lalu pasang widget `AsistenAI.jsx` di halaman publik (US-50).

**Hasil:**
Admin dapat membuat deskripsi paket layanan otomatis dalam satu klik, dan pengunjung dapat berkonsultasi mengenai estimasi berat cucian serta rekomendasi paket lewat widget Asisten AI sesuai data gerai aktual.

**Perbaikan:**
Menyembunyikan widget `AsistenAI` saat pengguna berada di rute `/admin/*` dan memastikan seluruh respons AI dirender sebagai teks biasa (tanpa `dangerouslySetInnerHTML`) serta menangani error kuota API secara ramah.