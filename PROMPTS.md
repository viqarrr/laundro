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
Seluruh tabel (`kategori`, `pengaturan_toko`, `machines`, `bookings`, `machine_time_blocks`, `ulasan`, `wa_clicks`, `admin_profiles`, `admin_logs`) dan data awal di `docs/seed-laundry.sql` (4 kategori, 7 paket layanan, 4 Washer, 4 Dryer, pengaturan gerai) berhasil dieksekusi di Supabase SQL Editor. Tampilan publik mengadopsi palet warna dan tipografi referensi desain dengan bersih.

**Perbaikan:**
Menyesuaikan struktur `DESIGN.md` dan `app/globals.css` agar sekaligus mendefinisikan variabel CSS untuk mode terang (`:root`) dan mode gelap (`:root.dark`), layout band penuh (`.band-full`), serta angka tabular (`.numeric`) untuk kesiapan US-25.

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
Ditemukan penyebab utama berupa belum adanya RLS policy `INSERT`/`UPDATE`/`DELETE` untuk role `authenticated` pada tabel `storage.objects` untuk bucket `produk-images`, sementara batas upload gambar di aplikasi ditetapkan maksimal 2 MB dengan validasi server-side di `lib/validators/produk.js`.

**Perbaikan:**
Menjalankan query SQL di Supabase untuk membuat/memastikan bucket publik `produk-images` beserta policy `SELECT` publik dan `INSERT/UPDATE/DELETE` untuk `authenticated`, serta melengkapi `validasiFileFotoProduk()` di `lib/validators/produk.js` dengan pengecekan tipe MIME, ukuran maks 2 MB, dan verifikasi magic bytes file sebelum `uploadFotoKeStorage()` di `app/admin/produk-actions.js` dijalankan.

### US-07 s/d US-10, US-29, US-31, US-32, US-33, US-34, US-47: CRUD Layanan & Kategori Admin

**Prompt:** **[SENDIRI]**
Buat validator server `lib/validators/produk.js` (US-34) dan pisahkan Server Actions ke `app/admin/produk-actions.js` (wajib `requireAdmin()`). Implementasikan list produk dari database dengan pencarian, filter status, dan paginasi server-side (US-07, US-33), form tambah/ubah dengan upload foto ke Storage (US-08, US-09, US-29), hapus dengan konfirmasi (US-10), toggle aktif/nonaktif (US-32), dan atur urutan tampil (US-47). Lanjutkan dengan CRUD kategori dinamis di `/admin/kategori` (US-31) yang terhubung ke dropdown form produk.

**Hasil:**
Seluruh alur CRUD layanan dan kategori di `/admin`, `/admin/produk/baru`, `/admin/produk/[id]/ubah`, dan `/admin/kategori` berjalan dengan validasi per field di server, upload foto ke Supabase Storage (`produk-images`), filter/paginasi via `FilterProdukAdmin.jsx`, serta kontrol status aktif dan urutan tampil yang langsung tercermin di katalog publik.

**Perbaikan:**
Menambahkan pengurutan drag-and-drop dan tombol panah keyboard di `TabelProduk.jsx` lewat `simpanUrutanProdukAction`, memastikan setiap mutasi memanggil `revalidatePath` pada `/`, `/admin`, `/produk/[id]`, dan `/admin/kategori`, serta mencatat aktivitas ke `admin_logs`.

### US-11, US-12, US-15 s/d US-21, US-48, US-49: Katalog Interaktif, Kalkulator Berat, Varian, Galeri, & Keranjang WA

**Prompt:** **[SENDIRI]**
Buat `components/KatalogInteraktif.jsx` untuk pencarian teks, filter chip kategori (US-11), pengurutan (US-15), dan paginasi (US-16), serta tampilkan status stok (US-19) dan harga coret/badge (US-20) pada `KartuProduk.jsx`. Buat halaman dinamis `/kategori/[slug]` (US-49). Di `/produk/[id]`, bangun `GaleriProduk.jsx` (US-18), `KalkulatorLaundry.jsx` untuk pilihan varian ukuran tabung (US-48) dan kalkulator estimasi berat kg ke jumlah tabung (US-12), produk terkait (US-17), serta `CartProvider` + `CartDrawer` untuk pesan semua item via WhatsApp (US-21). Tambahkan dukungan input galeri dan varian di `FormProduk.jsx`.

**Hasil:**
Pengunjung dapat menyaring, mengurutkan, dan membuka halaman `/kategori/[slug]`; melihat galeri foto di `GaleriProduk.jsx`, memilih varian ukuran tabung di `KalkulatorLaundry.jsx` dengan estimasi jumlah tabung dan DP otomatis; serta menggabungkan beberapa layanan ke dalam satu pesan WhatsApp lewat `CartDrawer.jsx`.

**Perbaikan:**
Menangani sinkronisasi `localStorage` (`laundro_cart_v1`) pada `CartProvider.jsx` menggunakan state `hydrated` agar tidak menimbulkan hydration mismatch, serta menyinkronkan query `?q=...&kategori=...&sort=...` di `KatalogInteraktif.jsx` lewat `window.history.replaceState` tanpa lonjakan scroll.

### US-30, US-40 s/d US-45: Pengaturan Gerai, Role Admin, Audit Log, Banner Promo, & Analitik

**Prompt:** **[SENDIRI]**
Buat helper `lib/pengaturan.js` dan `lib/admin-log.js`. Bangun `/admin/pengaturan` (US-42, US-43) untuk mengubah info gerai, buffer time, aturan DP, rekening transfer, dan banner promo beranda; `/admin/akun` (US-44) untuk manajemen role `SUPERADMIN`/`STAFF`; dan `/admin/log` (US-45) untuk riwayat aktivitas admin. Buat `POST /api/analytics/wa-click` (US-40) dengan trigger non-blocking di tombol WA, lalu tampilkan Dashboard Ringkasan (US-30) dan widget Layanan Terlaris (US-41) di `/admin`.

**Hasil:**
Pemilik gerai dapat mengatur profil toko, nominal DP, dan banner promo di `/admin/pengaturan`, mengelola peran admin di `/admin/akun`, serta memantau riwayat mutasi di `/admin/log`; klik WhatsApp tercatat otomatis ke tabel `wa_clicks` lewat `POST /api/analytics/wa-click`; dan dashboard `/admin` menampilkan ringkasan operasional serta peringkat layanan terpopuler.

**Perbaikan:**
Menambahkan mekanisme auto-bootstrap akun admin pertama sebagai `SUPERADMIN` di `ensureAdminProfile` (`lib/supabase/session.js`), membatasi akses `/admin/pengaturan` dan `/admin/akun` via `requireSuperAdmin()`, serta mencegah Superadmin menonaktifkan atau menurunkan peran akunnya sendiri di `app/admin/akun-actions.js`.

### US-EXTRA-03: Core Reservasi Coin Laundry (Slot Picker TTL 15 Menit & Timeline Grid Admin)

**Prompt:** **[SENDIRI]**
Buat `lib/laundry-scheduler.js` untuk auto-release kunci slot kadaluwarsa (`PENDING_LOCK` > 15 menit), cek anti-overlap per `machine_id`, pencarian *linked slots* Washer + buffer 5 menit ke Dryer, generator Kode Booking `LND-YYMMDD-XXX`, dan kalkulasi nominal DP. Bangun `/antrean` berisi `LiveMesinStatus.jsx`, `MachineSlotPicker.jsx` (dilindungi rate limit K-12, countdown 15 menit, dan tombol konfirmasi bukti DP via WA sesuai format BRD), dan `TrackingBooking.jsx`. Bangun `/admin/jadwal` dengan `MachineTimelineGrid.jsx` untuk konfirmasi DP, perpanjang timer +10 menit, quick walk-in, kontrol siklus mesin, pindah mesin, dan sakelar maintenance.

**Hasil:**
Pelanggan dapat melihat status mesin real-time di `/` dan `/antrean`, memesan blok waktu spesifik (Washer -> Dryer) lewat `MachineSlotPicker.jsx` dengan kunci sementara 15 menit (`PENDING_LOCK`) dan pesan WA berisi Kode Booking serta nominal DP, lalu melacak status antrean di `TrackingBooking.jsx`. Admin penjaga mengelola seluruh jadwal mesin dan walk-in di `/admin/jadwal`.

**Perbaikan:**
Memastikan `releaseExpiredLocks()` selalu dipanggil sebelum pengecekan bentrok slot agar kunci `PENDING_LOCK` kadaluwarsa (> 15 menit) langsung terbuka kembali, serta menambahkan rate limit IP (maks 10 permintaan/15 menit) dan batas maksimal 2 booking `PENDING_LOCK` aktif per nomor WhatsApp di `app/antrean/actions.js` (K-12).

### US-13, US-22 s/d US-28, US-36, US-37: PWA, Mode Gelap, SEO, Sitemap, Loading, & Komparasi

**Prompt:** **[SENDIRI]**
Tambahkan `public/manifest.json` dan `public/sw.js` (US-13), `ThemeToggle.jsx` untuk mode gelap/terang (US-25), metadata SEO & Open Graph dinamis (US-26), `app/sitemap.js` (US-27), dan skeleton `loading.jsx` untuk publik serta admin (US-28). Buat halaman `/tentang` (US-22), `TombolBagikan.jsx` (US-23), fitur simpan Favorit di `localStorage` (US-24), `TerakhirDilihat.jsx` (US-36), dan halaman komparasi `/bandingkan` untuk 2 layanan berdampingan (US-37).

**Hasil:**
Aplikasi mendukung instalasi PWA (`manifest.json`, `sw.js`, `PwaRegistrar.jsx`), pergantian tema terang/gelap lewat `ThemeToggle.jsx`, metadata SEO & Open Graph dinamis di `app/layout.jsx` dan `app/produk/[id]/page.jsx`, `sitemap.xml` dan `robots.txt`, loading skeleton (`app/loading.jsx`, `app/produk/[id]/loading.jsx`, `app/admin/loading.jsx`), halaman `/tentang`, serta fitur favorit, riwayat terakhir dilihat (`TerakhirDilihat.jsx`), dan komparasi 2 layanan di `/bandingkan`.

**Perbaikan:**
Menyelaraskan warna border, permukaan kartu, dan kontras teks pada mode gelap (`:root.dark`), mengecualikan rute `/admin` dan `/api` dari intersepsi fetch di `public/sw.js`, serta menggunakan state `hydrated` pada `UserPrefsProvider.jsx` untuk sinkronisasi `localStorage` tanpa hydration mismatch.

### US-35, US-38, US-39, US-46: Ulasan/Moderasi & Ekspor/Impor CSV

**Prompt:** **[SENDIRI]**
Implementasikan sistem ulasan & rating bintang 1-5 di `/produk/[id]` dengan status default `pending` dan rate limit (US-38), serta halaman moderasi `/admin/ulasan` untuk setujui/tolak/hapus ulasan (US-39). Buat endpoint terproteksi `GET /api/admin/produk/export` dengan proteksi CSV injection (US-35) dan fitur impor CSV dengan validasi tiap baris serta laporan baris berhasil/gagal di `/admin` (US-46).

**Hasil:**
Pengunjung dapat mengirim ulasan lewat `UlasanProduk.jsx` dan `app/produk/[id]/ulasan-actions.js` yang baru tampil di `/produk/[id]` setelah disetujui admin di `/admin/ulasan` (`ModerasiUlasan.jsx` & `app/admin/ulasan-actions.js`), sementara admin dapat mengekspor data ke `laundro-produk.csv` lewat `GET /api/admin/produk/export` dan mengimpor banyak layanan lewat `ImporCsvModal.jsx` + `app/admin/csv-actions.js`.

**Perbaikan:**
Menambahkan sanitasi prefix petik tunggal (`'`) pada sel CSV berawalan karakter formula (`=`, `+`, `-`, `@`, `\t`, `\r`) dan BOM UTF-8 (`\uFEFF`) pada ekspor CSV, fallback insert per baris saat batch insert impor CSV gagal, rate limit 3 ulasan/15 menit per IP (K-12), serta `revalidatePath` ke `/admin/ulasan` dan `/produk/[id]` saat moderasi.

### US-14 & US-50: Generator Deskripsi AI Admin & Asisten AI Tanya Jawab Produk

**Prompt:** **[SENDIRI]**
Bangun `POST /api/ai/deskripsi` (terproteksi sesi admin + rate limit) memakai `GEMINI_API_KEY` dan model `gemini-2.5-flash` lalu hubungkan ke tombol "Buat Deskripsi AI" di `FormProduk.jsx` dengan aturan output ringkas tanpa em-dash (US-14). Bangun `POST /api/ai/asisten` (dilindungi rate limit) yang mengambil konteks katalog layanan aktif dan status mesin dari Supabase agar jawaban akurat, lalu pasang widget `AsistenAI.jsx` di halaman publik (US-50).

**Hasil:**
Admin dapat menghasilkan deskripsi paket layanan otomatis lewat tombol "Buat Deskripsi AI" di `FormProduk.jsx` yang memanggil `POST /api/ai/deskripsi`, dan pengunjung dapat berkonsultasi mengenai estimasi berat cucian, tarif paket, serta status mesin lewat widget `AsistenAI.jsx` (`app/layout.jsx`) yang terhubung ke `POST /api/ai/asisten` dengan data aktual dari `produk`, `machines`, dan `pengaturan_toko`.

**Perbaikan:**
Mengekstrak pemanggilan Gemini API (`gemini-2.5-flash`) ke helper server-only `lib/gemini.js` (header `x-goog-api-key`, timeout 15 detik, dan sanitasi otomatis karakter em-dash/en-dash via `sanitasiTeksAi()`), mengubah textarea `deskripsi` di `FormProduk.jsx` menjadi controlled state dengan `formRef`, menyembunyikan `AsistenAI.jsx` pada rute `/admin/*`, me-render respons AI sebagai teks biasa tanpa `dangerouslySetInnerHTML`, serta mengembalikan pesan ramah jika `GEMINI_API_KEY` belum diset atau kuota penuh (429).

### Komponen Kontrol UI Kustom (`CustomSelect` & `SwitchToggle`)

**Prompt:** **[SENDIRI]**
Ganti elemen `<select>` dan checkbox bawaan browser pada form admin maupun filter publik agar selaras dengan sistem desain Laundro (sudut kontinyu, target sentuh minimal 44px, navigasi keyboard, dan dukungan mode gelap).

**Hasil:**
Tersedia komponen `components/CustomSelect.jsx` (dropdown listbox dengan hidden input untuk Server Action dan tombol Escape/outside-click) dan `components/SwitchToggle.jsx` (sakelar toggle `role="switch"` dengan `aria-checked`) yang dipakai di `FormProduk.jsx`, `KatalogInteraktif.jsx`, `MachineSlotPicker.jsx`, `FormPengaturan.jsx`, dan `KelolaAkun.jsx`.

**Perbaikan:**
Menambahkan dukungan mode controlled dan uncontrolled pada `CustomSelect.jsx` agar kompatibel baik dengan form Server Action (`defaultValue`) maupun filter interaktif berbasis state (`value` + `onChange`).