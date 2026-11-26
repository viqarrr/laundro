# User Story - Laundro (Sistem Manajemen Antrean & Reservasi Coin Laundry)

Setiap user story diberi nomor. Pakai nomor ini di prompt ("kerjakan US-07") dan di pesan commit (`US-07: list paket layanan dari database`).

Aturan Arsitektur Wajib:
- Entitas `produk` pada tabel database dan rute bawaan (`/`, `/produk/[id]`, `/admin/*`) dipetakan sebagai **Paket Layanan & Add-on Coin Laundry** (Cuci Saja, Kering Saja, Cuci + Kering, Add-on Deterjen/Pewangi, Drop-off).
- Semua rute dan tabel baru (mesin, antrean, blok waktu, kategori, ulasan, pengaturan, log) wajib bersifat *additive* tanpa menghapus kolom atau rute bawaan boilerplate.

---

## Wajib (Gerbang Kelulusan)

### US-01 Katalog dari database

Sebagai pengunjung, saya ingin melihat semua paket layanan laundry dalam satu halaman, supaya saya tahu layanan dan tarif yang tersedia.

Kriteria Penerimaan:
- Halaman `/` menampilkan semua paket layanan aktif dari tabel `produk` di Supabase, bukan dari `lib/data-contoh.js`.
- Data diambil di sisi server (Server Component).
- Setiap kartu menampilkan foto layanan, kategori (Cuci Saja / Kering Saja / Cuci + Kering / Add-on), nama paket, durasi/kapasitas singkat, dan harga dalam format Rupiah.
- Jika belum ada layanan, halaman menampilkan pesan kosong yang jelas.

### US-02 Detail produk

Sebagai pengunjung, saya ingin melihat detail satu paket layanan, supaya saya yakin dengan kapasitas, durasi mesin, dan tarifnya sebelum memesan.

Kriteria Penerimaan:
- Halaman `/produk/[id]` menampilkan foto, kategori, nama paket, harga, spesifikasi kapasitas/durasi siklus, dan deskripsi dari database.
- ID layanan yang tidak ditemukan menampilkan halaman 404 / "tidak ditemukan".

### US-03 Pesan via WhatsApp

Sebagai pengunjung, saya ingin menekan satu tombol untuk memesan atau mengonfirmasi DP lewat WhatsApp, supaya saya tidak perlu mengetik ulang detail layanan.

Kriteria Penerimaan:
- Tombol "Pesan via WhatsApp" membuka tautan WhatsApp ke nomor gerai dari `lib/toko.js` (atau tabel pengaturan toko saat US-43 aktif).
- Pesan terisi otomatis menggunakan `encodeURIComponent` berisi nama paket dan harga.
- Berfungsi di peramban HP dan desktop.

### US-04 Login admin

Sebagai admin/penjaga outlet, saya ingin masuk dengan email dan password, supaya hanya pengelola yang bisa mengatur layanan dan antrean mesin.

Kriteria Penerimaan:
- Login memakai Supabase Auth dan diproses di sisi server (Server Action).
- Login berhasil mengarah ke `/admin`; login gagal menampilkan pesan error yang jelas tanpa detail teknis internal.
- Tombol "Keluar" mengakhiri sesi di server dan mengarahkan kembali ke `/admin/login`.

### US-05 Ganti password

Sebagai admin, saya ingin mengganti password, supaya password bawaan tidak bisa dipakai orang lain.

Kriteria Penerimaan:
- Form di `/admin/password` mengganti password akun admin yang sedang login.
- Password baru minimal 8 karakter dan wajib cocok dengan konfirmasi password.
- Menampilkan pesan berhasil atau pesan error validasi yang jelas.

### US-06 Proteksi halaman admin

Sebagai admin, saya ingin seluruh halaman admin tertutup bagi pengunjung umum, supaya data gerai aman.

Kriteria Penerimaan:
- Membuka `/admin` dan seluruh sub-rutenya tanpa sesi login aktif otomatis dialihkan ke `/admin/login` melalui middleware/proxy dan pengecekan server.
- Setiap Server Action dan API Route mutasi data wajib memverifikasi sesi login di server sebelum mengeksekusi query.

---

## Bonus (US-07 s/d US-50)

### US-07 List Produk

Sebagai admin, saya ingin daftar paket layanan di `/admin` mengambil data langsung dari database.

Kriteria Penerimaan:
- Halaman `/admin` me-render daftar layanan melalui `TabelProduk.jsx` dari tabel `produk` Supabase.
- Menampilkan thumbnail foto, nama paket, kategori, status ketersediaan/aktif, harga Rupiah, dan tombol aksi kelola (Ubah/Hapus).

### US-08 Tambah produk

Sebagai admin, saya ingin menambah paket layanan laundry baru dari halaman admin.

Kriteria Penerimaan:
- Form di `/admin/produk/baru` menyediakan input nama paket, kategori, harga, deskripsi, URL foto, kapasitas maksimal (kg), durasi siklus (menit), serta opsi kebutuhan Washer/Dryer.
- Menyimpan entri baru ke tabel `produk` di Supabase lalu otomatis kembali ke `/admin`.
- Aksi terlindungi verifikasi sesi login admin di server.

### US-09 Ubah produk

Sebagai admin, saya ingin mengubah data paket layanan yang sudah ada.

Kriteria Penerimaan:
- Form di `/admin/produk/[id]/ubah` otomatis terisi data lama paket berdasarkan ID.
- Menyimpan perubahan ke database dan langsung memperbarui katalog publik (`revalidatePath`).
- Aksi terlindungi verifikasi sesi login admin di server.

### US-10 Hapus produk

Sebagai admin, saya ingin menghapus paket layanan yang sudah tidak ditawarkan.

Kriteria Penerimaan:
- Tombol "Hapus" pada `TabelProduk.jsx` menampilkan dialog konfirmasi sebelum penghapusan.
- Menghapus baris paket dari database dan memperbarui tampilan tabel tanpa reload manual.
- Aksi terlindungi verifikasi sesi login admin di server.

### US-11 Filter kategori atau pencarian

Sebagai pengunjung, saya ingin menyaring layanan berdasarkan kategori atau mencari nama paket.

Kriteria Penerimaan:
- Halaman `/` menyediakan input pencarian teks dan filter chip kategori (Semua, Cuci + Kering, Cuci Saja, Kering Saja, Add-on).
- Daftar kartu layanan tersaring secara instan dan sinkron dengan URL query parameter (`?q=...&kategori=...`).

### US-12 Pilih jumlah atau varian

Sebagai pengunjung, saya ingin memilih estimasi berat cucian, jumlah tabung/item, dan varian layanan sebelum memesan, dan pilihan tersebut ikut tertulis di pesan WhatsApp.

Kriteria Penerimaan:
- Halaman `/produk/[id]` menyediakan input kalkulator estimasi berat (kg) yang otomatis menghitung kebutuhan jumlah tabung (`Math.ceil(berat / max_capacity_kg)`), serta pilihan varian (mis. Reguler 7kg / Jumbo 10kg, +Deterjen, +Pewangi).
- Menampilkan disclaimer penyesuaian berat aktual di timbangan digital gerai.
- Tombol WhatsApp merangkai pesan otomatis dengan format:
  > "Halo Laundro, saya ingin reservasi [Nama Paket] ([Varian]) sebanyak [Jumlah] tabung/unit (est. [Berat] kg) seharga total [Total Harga]. Mohon info konfirmasi DP."

### US-13 PWA

Sebagai pengunjung, saya ingin memasang aplikasi web Laundro di layar utama HP agar cepat mengecek antrean mesin.

Kriteria Penerimaan:
- File `public/manifest.json` lengkap (name, short_name, start_url, display: standalone, theme_color, background_color, icons 192 & 512) terdaftar di `app/layout.jsx`.
- Menggunakan ikon dari `public/icons/icon-192.png` dan `public/icons/icon-512.png`.
- Terdaftar service worker ringan (`public/sw.js`) atau konfigurasi PWA yang valid sehingga prompt instalasi aktif di browser mobile.

### US-14 Deskripsi produk dibuat AI

Sebagai admin, saya ingin membuat deskripsi paket layanan secara otomatis dengan AI (Gemini API) berdasarkan nama paket, kategori, dan kapasitas mesin.

Kriteria Penerimaan:
- Tersedia tombol "Buat Deskripsi AI" di samping field deskripsi pada `FormProduk.jsx`.
- Mengirim payload nama paket dan kategori ke `POST /api/ai/deskripsi` yang terlindungi sesi admin dan memanggil Gemini API.
- Hasil deskripsi ringkas, informatif, dan tanpa karakter em-dash otomatis mengisi field deskripsi.

### US-15 Urutkan produk

Sebagai pengunjung, saya ingin mengurutkan daftar layanan berdasarkan harga atau urutan terbaru.

Kriteria Penerimaan:
- Tersedia dropdown pengurutan di halaman `/` (Urutan Bawaan, Harga Termurah, Harga Termahal, Terbaru, Nama A-Z).
- Pengurutan bekerja selaras dengan filter kategori dan pencarian (US-11).

### US-16 Paginasi atau muat lebih banyak

Sebagai pengunjung, saya ingin menavigasi daftar layanan per halaman atau lewat tombol "Muat Lebih Banyak" agar halaman tetap ringan.

Kriteria Penerimaan:
- Halaman `/` membatasi tampilan awal (mis. 6 atau 8 kartu per halaman) dengan kontrol paginasi nomor halaman atau tombol "Muat Lebih Banyak".
- State halaman tersimpan di query parameter atau state klien yang reset otomatis saat filter/pencarian berubah.

### US-17 Produk terkait di halaman detail

Sebagai pengunjung, saya ingin melihat paket layanan atau add-on terkait di halaman detail, seperti deterjen, pewangi, atau paket pengeringan.

Kriteria Penerimaan:
- Bagian bawah `/produk/[id]` menampilkan maksimal 4 layanan terkait (kategori sama atau kategori Add-on, mengecualikan ID yang sedang dibuka).
- Klik kartu langsung membuka halaman detail layanan tersebut.

### US-18 Galeri beberapa foto produk

Sebagai pengunjung, saya ingin melihat beberapa foto mesin dan hasil layanan pada halaman detail.

Kriteria Penerimaan:
- Mendukung lebih dari satu URL gambar per produk (kolom `galeri_foto JSONB` atau array text pada tabel `produk`).
- Halaman `/produk/[id]` menampilkan gambar utama dan deretan thumbnail yang bisa diklik untuk mengganti gambar utama secara halus.
- Form admin memungkinkan tambah/hapus lebih dari satu foto.

### US-19 Status stok

Sebagai pengunjung, saya ingin melihat ketersediaan mesin/stok layanan secara jelas pada kartu dan halaman detail.

Kriteria Penerimaan:
- Setiap produk memiliki indikator status stok/ketersediaan (`Tersedia`, `Mesin Terbatas`, `Penuh / Habis`) yang terhubung dengan jumlah unit mesin aktif atau kolom `stok`.
- Jika status habis/penuh, badge penanda tampil jelas dan tombol pemesanan dinonaktifkan atau menampilkan opsi jadwal berikutnya.

### US-20 Harga coret dan badge

Sebagai pengunjung, saya ingin melihat harga promo (harga coret) dan label penanda seperti "Terlaris" atau "Promo Jam Sepi".

Kriteria Penerimaan:
- Tabel `produk` memiliki kolom opsional `harga_coret` dan `badge` (mis. "Promo", "Populer", "Express").
- Jika `harga_coret > harga`, kartu dan halaman detail menampilkan harga lama dicoret di samping harga aktif beserta persentase hematnya.
- Badge tampil bersih dan proporsional tanpa merusak tata letak kartu.

### US-21 Keranjang, pesan semua via WhatsApp

Sebagai pengunjung, saya ingin mengumpulkan beberapa layanan sekaligus (mis. 2x Cuci + Kering + 2x Deterjen + 1x Pewangi) lalu memesannya dalam satu pesan WhatsApp.

Kriteria Penerimaan:
- Tersedia tombol "Tambah ke Keranjang" di katalog/detail dan drawer/halaman keranjang yang tersimpan di `localStorage`.
- Pengguna bisa mengubah jumlah item, menghapus item, dan melihat subtotal + estimasi DP.
- Tombol "Pesan Semua via WhatsApp" menggabungkan seluruh isi keranjang, subtotal, dan estimasi DP ke dalam satu pesan WhatsApp terstruktur.

### US-22 Halaman Tentang dan kontak toko

Sebagai pengunjung, saya ingin membaca profil gerai coin laundry, alamat, jam operasional, aturan DP/keterlambatan, serta kontak resmi.

Kriteria Penerimaan:
- Tersedia rute `/tentang` yang dapat diakses dari Header dan Footer.
- Menampilkan informasi gerai, jam operasional, aturan batas toleransi keterlambatan (15 menit), info rekening DP, peta/tautan lokasi, dan tombol langsung ke WhatsApp.

### US-23 Bagikan atau salin link produk

Sebagai pengunjung, saya ingin membagikan atau menyalin tautan paket layanan ke teman/keluarga dengan sekali klik.

Kriteria Penerimaan:
- Halaman `/produk/[id]` memiliki tombol "Bagikan" yang memakai `navigator.share` jika didukung browser, dengan fallback "Salin Tautan" ke clipboard.
- Menampilkan umpan balik visual ("Tautan disalin") selama 2-3 detik setelah diklik.

### US-24 Favorit tersimpan di browser

Sebagai pengunjung, saya ingin menandai paket layanan favorit agar mudah dipesan ulang di kunjungan berikutnya.

Kriteria Penerimaan:
- Tersedia tombol ikon simpan/favorit pada kartu dan halaman detail yang disimpan di `localStorage`.
- Tersedia filter atau tab "Favorit" agar pengunjung bisa melihat daftar layanan yang sudah disimpan beserta jumlah badge-nya di header.

### US-25 Mode gelap

Sebagai pengunjung, saya ingin mengganti tema tampilan antara terang dan gelap agar nyaman dilihat malam hari.

Kriteria Penerimaan:
- Tersedia tombol toggle tema (Light/Dark) di Header yang menyimpan preferensi di `localStorage` dan menghormati `prefers-color-scheme`.
- Seluruh halaman publik dan admin beradaptasi kontrasnya dengan rapi tanpa flash putih ekstrem saat muat ulang.

### US-26 Metadata SEO dan Open Graph

Sebagai pemilik gerai, saya ingin setiap halaman memiliki judul, deskripsi, dan preview Open Graph yang rapi saat dibagikan ke WhatsApp/media sosial.

Kriteria Penerimaan:
- `app/layout.jsx` mendefinisikan `metadataBase`, `title` template, `description`, dan `openGraph` default.
- `app/produk/[id]/page.jsx` mengimplementasikan `generateMetadata` dinamis yang mengisi judul, deskripsi, dan gambar Open Graph sesuai layanan yang dibuka.

### US-27 sitemap.xml dan robots.txt

Sebagai pemilik gerai, saya ingin mesin pencari dapat mengindeks halaman layanan secara otomatis namun mengecualikan area admin.

Kriteria Penerimaan:
- Tersedia `app/sitemap.js` yang menghasilkan daftar URL dinamis (`/`, `/tentang`, `/antrean`, seluruh `/produk/[id]`, dan `/kategori/[slug]`).
- Tersedia `app/robots.js` yang mengizinkan crawl halaman publik dan menetapkan `disallow: ['/admin', '/api']` serta merujuk URL sitemap.

### US-28 Halaman 404 dan loading kustom

Sebagai pengunjung, saya ingin melihat tampilan loading skeleton yang halus saat data dimuat dan halaman 404 yang membantu jika URL salah.

Kriteria Penerimaan:
- Tersedia `app/loading.jsx`, `app/produk/[id]/loading.jsx`, dan `app/admin/loading.jsx` berupa skeleton UI sesuai tema.
- `app/not-found.jsx` tampil konsisten dengan desain Laundro dan menyediakan tombol kembali ke beranda.

### US-29 Upload foto ke Supabase Storage

Sebagai admin, saya ingin mengunggah foto layanan langsung dari perangkat tanpa harus menempel URL eksternal.

Kriteria Penerimaan:
- `FormProduk.jsx` menyediakan input file upload gambar (mendukung JPG/PNG/WebP, validasi ukuran maks 2 MB dan tipe MIME di server).
- File diunggah ke bucket publik Supabase Storage (mis. `produk-images`) dan URL publiknya otomatis tersimpan di tabel `produk`.
- Tetap mendukung fallback input URL jika admin ingin memakai aset lokal.

### US-30 Dashboard ringkasan admin

Sebagai admin, saya ingin melihat ringkasan operasional toko saat membuka `/admin`.

Kriteria Penerimaan:
- Bagian atas `/admin` menampilkan kartu metrik utama dari database: total layanan aktif, total unit mesin (Aktif vs Maintenance), total antrean hari ini / menunggu konfirmasi DP, dan total klik WhatsApp.
- Data diambil di server dan selalu terbarui setelah mutasi.

### US-31 Kelola kategori

Sebagai admin, saya ingin menambah, mengubah, dan menghapus kategori layanan secara dinamis.

Kriteria Penerimaan:
- Tersedia tabel `kategori` (`id`, `nama`, `slug`, `deskripsi`, `urutan`) dan halaman `/admin/kategori` yang terhubung di `NavAdmin.jsx`.
- Admin dapat CRUD kategori dengan validasi slug unik di server.
- Dropdown kategori pada `FormProduk.jsx` dan filter di halaman `/` membaca daftar kategori dari database.

### US-32 Aktif atau nonaktifkan produk

Sebagai admin, saya ingin menyembunyikan paket layanan sementara tanpa menghapus datanya.

Kriteria Penerimaan:
- Tabel `produk` memiliki kolom `aktif BOOLEAN DEFAULT true`.
- Tersedia toggle cepat Aktif/Nonaktif di `TabelProduk.jsx` dan checkbox di `FormProduk.jsx`.
- Halaman katalog publik `/` dan `/produk/[id]` hanya menampilkan layanan dengan `aktif = true`.

### US-33 Cari dan paginasi di list admin

Sebagai admin, saya ingin mencari dan menavigasi daftar layanan di halaman `/admin` dengan cepat.

Kriteria Penerimaan:
- Halaman `/admin` menyediakan kolom pencarian nama/kategori, filter status (Semua/Aktif/Nonaktif), dan paginasi per halaman (mis. 10 baris).
- Parameter pencarian dan halaman bekerja via query string server-side agar cepat dan bisa di-bookmark.

### US-34 Validasi form admin di server

Sebagai admin, saya ingin semua input form divalidasi ketat di sisi server agar data database tidak rusak atau corrupt.

Kriteria Penerimaan:
- Setiap Server Action (tambah/ubah produk, kategori, pengaturan, mesin, jadwal) memvalidasi tipe data, panjang teks, angka positif (harga >= 0, kapasitas > 0), dan format URL/email di server.
- Mengembalikan pesan error spesifik per field ke UI form jika validasi gagal.

### US-35 Ekspor produk ke CSV

Sebagai admin, saya ingin mengekspor seluruh daftar layanan ke file CSV untuk cadangan data atau laporan.

Kriteria Penerimaan:
- Tersedia tombol "Ekspor CSV" di `/admin` yang memanggil route handler terproteksi sesi admin (`GET /api/admin/produk/export`).
- Mengunduh file `.csv` valid (UTF-8 dengan escaping koma/kutip yang benar dan proteksi CSV injection) berisi seluruh kolom layanan utama.

### US-36 Terakhir dilihat

Sebagai pengunjung, saya ingin melihat daftar paket layanan yang baru saja saya buka agar mudah membandingkan.

Kriteria Penerimaan:
- Setiap kunjungan ke `/produk/[id]` menyimpan ID/ringkasan produk ke `localStorage` (maksimal 6 item terbaru, tanpa duplikat).
- Menampilkan section "Terakhir Dilihat" di halaman `/` atau bagian bawah `/produk/[id]` jika riwayat tidak kosong.

### US-37 Bandingkan 2 produk

Sebagai pengunjung, saya ingin membandingkan 2 paket layanan secara berdampingan (harga, kapasitas kg, durasi siklus, cakupan Washer/Dryer).

Kriteria Penerimaan:
- Pengunjung dapat memilih hingga 2 layanan untuk dibandingkan lewat tombol "Bandingkan" pada kartu.
- Tersedia halaman `/bandingkan` (atau modal komparasi penuh) yang menampilkan tabel perbandingan atribut kedua layanan secara berdampingan lengkap dengan tombol pesan masing-masing.

### US-38 Ulasan dan rating

Sebagai pengunjung, saya ingin membaca dan menulis ulasan serta rating bintang (1-5) untuk layanan yang pernah saya gunakan.

Kriteria Penerimaan:
- Tersedia tabel `ulasan` (`id`, `produk_id`, `nama`, `rating`, `komentar`, `status`, `created_at`).
- Halaman `/produk/[id]` menampilkan rata-rata rating, daftar ulasan yang sudah disetujui (`approved`), dan form kirim ulasan (nama, rating 1-5, komentar).
- Ulasan baru masuk dengan status `pending` (menunggu moderasi) dan dilindungi validasi server + rate limit (K-12).

### US-39 Moderasi ulasan di admin

Sebagai admin, saya ingin menyetujui atau menolak/menghapus ulasan pengunjung sebelum tampil di publik.

Kriteria Penerimaan:
- Tersedia halaman `/admin/ulasan` yang menampilkan daftar ulasan beserta filter status (`pending`, `approved`, `rejected`).
- Admin dapat menekan tombol "Setujui", "Tolak", atau "Hapus" yang langsung memperbarui visibilitas ulasan di halaman publik.

### US-40 Catat klik pesan WhatsApp

Sebagai pemilik gerai, saya ingin sistem mencatat setiap kali pengunjung menekan tombol pesan WhatsApp agar saya tahu minat pelanggan.

Kriteria Penerimaan:
- Tersedia tabel `wa_clicks` (`id`, `produk_id`, `sumber`, `created_at`).
- Saat tombol WhatsApp ditekan, klien mengirim event non-blocking (`navigator.sendBeacon` / `fetch`) ke endpoint `POST /api/analytics/wa-click` sebelum/bersamaan membuka tautan WA.
- Tidak menghambat pengguna membuka WhatsApp meskipun request analitik gagal.

### US-41 Produk terlaris di dashboard

Sebagai pemilik gerai, saya ingin melihat peringkat layanan paling diminati di dashboard admin.

Kriteria Penerimaan:
- Dashboard `/admin` menampilkan widget "Layanan Terpopuler / Terlaris" berdasarkan agregasi jumlah klik WhatsApp (`wa_clicks`) dan/atau jumlah reservasi (`bookings`) terbanyak.
- Menampilkan nama layanan, total interaksi/order, dan bar proporsi visual sederhana.

### US-42 Banner promo di beranda

Sebagai admin, saya ingin menampilkan banner pengumuman atau promo jam sepi di beranda tanpa mengedit kode.

Kriteria Penerimaan:
- Admin dapat mengatur judul promo, subjudul, teks CTA, tautan, dan sakelar aktif/nonaktif banner dari halaman admin (terintegrasi di `/admin/pengaturan` atau tab Banner).
- Jika aktif, banner tampil di bagian atas beranda `/` secara proporsional; jika nonaktif, banner tidak dirender.

### US-43 Pengaturan toko dari admin

Sebagai pemilik usaha (Superadmin), saya ingin mengatur nama gerai, nomor WhatsApp, jam operasional, buffer time mesin, aturan DP, dan info rekening transfer dari dashboard.

Kriteria Penerimaan:
- Tersedia tabel `pengaturan_toko` (singleton row) dan halaman `/admin/pengaturan`.
- Mencakup field: nama gerai, alamat, nomor WA, jam buka/tutup, `buffer_minutes`, tipe & nominal DP (`FIXED` / `PERCENTAGE`), serta info rekening/e-wallet DP.
- Perubahan langsung berdampak pada Header, Footer, Halaman Tentang, tombol WhatsApp, dan kalkulator DP tanpa perlu redeploy.

### US-44 Kelola akun admin

Sebagai pemilik usaha (Superadmin), saya ingin mengelola daftar akun admin/penjaga outlet beserta perannya (`SUPERADMIN` dan `STAFF`).

Kriteria Penerimaan:
- Tersedia tabel `admin_profiles` (`user_id`, `email`, `nama`, `role`, `aktif`, `created_at`) dan halaman `/admin/akun`.
- Superadmin dapat menambah akun penjaga outlet baru, mengubah role (`SUPERADMIN` / `STAFF`), atau menonaktifkan akun (tidak bisa menonaktifkan/menghapus dirinya sendiri).
- Akses ke `/admin/akun` dan `/admin/pengaturan` dibatasi khusus untuk role `SUPERADMIN`.

### US-45 Log aktivitas admin

Sebagai pemilik usaha, saya ingin melihat riwayat aktivitas operasional admin (CRUD layanan, pindah mesin, ubah status maintenance, konfirmasi DP, ubah pengaturan).

Kriteria Penerimaan:
- Tersedia tabel `admin_logs` (`id`, `admin_email`, `aksi`, `entitas`, `entitas_id`, `detail`, `created_at`) dan halaman `/admin/log`.
- Setiap mutasi penting di Server Action otomatis menulis catatan log melalui helper `catatLogAdmin()`.
- Halaman `/admin/log` menampilkan tabel riwayat terbaru beserta filter jenis aksi dan paginasi.

### US-46 Impor produk dari CSV

Sebagai admin, saya ingin mengunggah file CSV untuk menambah banyak paket layanan sekaligus.

Kriteria Penerimaan:
- Tersedia fitur unggah file `.csv` di `/admin` (dengan tautan unduh template CSV contoh).
- Server mem-parsing dan memvalidasi tiap baris sebelum menyimpan ke tabel `produk`.
- Menampilkan ringkasan hasil impor (jumlah baris berhasil masuk dan daftar nomor baris yang gagal beserta alasannya).

### US-47 Atur urutan tampil produk

Sebagai admin, saya ingin mengatur urutan tampil paket layanan di katalog publik agar paket unggulan muncul paling atas.

Kriteria Penerimaan:
- Tabel `produk` memiliki kolom `urutan INTEGER DEFAULT 0`.
- Di `TabelProduk.jsx`, admin dapat memindahkan urutan layanan ke atas/bawah atau mengisi angka prioritas urutan, lalu tersimpan ke database.
- Katalog `/` secara default mengurutkan layanan berdasarkan `urutan ASC, created_at DESC`.

### US-48 Varian harga per ukuran

Sebagai pengunjung, saya ingin memilih ukuran tabung mesin (mis. Tabung Standar 7 kg vs Tabung Jumbo 10 kg vs Extra 14 kg) dengan harga dan kapasitas yang berubah otomatis.

Kriteria Penerimaan:
- Mendukung data varian ukuran per produk (tabel `produk_varian` atau kolom terstruktur `varian JSONB` berisi `nama_ukuran`, `kapasitas_kg`, `harga`, `durasi_menit`).
- Di `/produk/[id]`, memilih ukuran langsung memperbarui tampilan harga, kapasitas kalkulator berat, dan detail yang masuk ke keranjang/WhatsApp.
- Form admin memungkinkan tambah/edit/hapus daftar varian ukuran per paket.

### US-49 Halaman per kategori

Sebagai pengunjung, saya ingin membuka URL khusus per kategori layanan (mis. `/kategori/cuci-kering`, `/kategori/add-on`) yang rapi dan SEO-friendly.

Kriteria Penerimaan:
- Tersedia rute dinamis `/kategori/[slug]` yang menampilkan nama kategori, deskripsi singkat, dan daftar layanan dalam kategori tersebut.
- Dilengkapi `generateMetadata` dinamis dan menampilkan 404 jika slug kategori tidak ditemukan.

### US-50 Asisten AI tanya jawab produk

Sebagai pengunjung, saya ingin bertanya kepada asisten AI (mis. "Cucian saya 9 kg enaknya pilih paket apa dan berapa biayanya?") untuk mendapat rekomendasi paket yang tepat.

Kriteria Penerimaan:
- Tersedia widget atau panel tanya jawab AI di halaman publik yang mengirim pertanyaan ke `POST /api/ai/asisten`.
- Backend mengambil ringkasan katalog layanan aktif & ketersediaan mesin dari Supabase sebagai konteks sistem Gemini API agar jawaban akurat sesuai data gerai (tidak mengarang harga).
- Dilindungi rate limit (K-12) dan sanitasi input; menampilkan pesan ramah jika kuota API habis.

---

## Keamanan Lanjutan (K-6 s/d K-13)

### K-6 Header keamanan di aplikasi live

Kriteria Penerimaan:
- `next.config.mjs` menetapkan header keamanan global pada semua rute: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, dan `Strict-Transport-Security`.

### K-7 Tanpa dangerouslySetInnerHTML atau eval berbahaya

Kriteria Penerimaan:
- Seluruh codebase bebas dari `dangerouslySetInnerHTML`, `eval()`, `new Function()`, dan injeksi `innerHTML` mentah.

### K-8 /admin tidak diindeks mesin pencari

Kriteria Penerimaan:
- `app/admin/layout.jsx` menetapkan metadata `robots: { index: false, follow: false }`.
- `app/robots.js` melarang crawling pada `/admin` dan `/api`, serta header `X-Robots-Tag: noindex, nofollow` dikirim untuk rute `/admin/*`.

### K-9 Error tidak membocorkan stack trace

Kriteria Penerimaan:
- Tersedia `app/error.jsx` dan `app/global-error.jsx` yang menampilkan pesan error ramah tanpa stack trace, query SQL, atau environment variable.
- Seluruh API Route dan Server Action membungkus blok `try/catch` dan hanya mengembalikan pesan generik ke klien.

### K-10 Dependensi tanpa kerentanan kritis

Kriteria Penerimaan:
- Versi `next` di `package.json` minimal `16.4.3` dan hasil `npm audit --omit=dev` bebas dari kerentanan tingkat `critical`.

### K-11 Content-Security-Policy ketat

Kriteria Penerimaan:
- `next.config.mjs` (atau `proxy.js`) mengirim header `Content-Security-Policy` yang membatasi `default-src 'self'`, mengizinkan domain Supabase dan font/aset resmi secara eksplisit, serta menetapkan `object-src 'none'` dan `frame-ancestors 'none'`.

### K-12 Rate limit login atau form

Kriteria Penerimaan:
- Tersedia utilitas rate limiter di server (`lib/rate-limit.js`) yang membatasi percobaan login (`/admin/login`), pengiriman ulasan (US-38), pembuatan booking, dan endpoint AI (US-50) berdasarkan IP/identitas (mis. maks 5 kali login gagal per 15 menit, maks 2 booking `PENDING_LOCK` aktif per nomor WA/IP).
- Mengembalikan status HTTP `429` atau pesan tunggu yang jelas saat batas terlampaui.

### K-13 Tanpa console.log data sensitif

Kriteria Penerimaan:
- Tidak ada `console.log` di seluruh codebase yang mencetak password, token sesi, API key, service role key, nomor rekening sensitif, atau payload autentikasi mentah.

---

## Extra (Core BRD Coin Laundry & Design System)

### US-EXTRA-01 Migrasi Skema Database Additive (Coin Laundry & Bonus)

Sebagai sistem backend, saya ingin menambahkan kolom layanan laundry pada tabel `produk` serta tabel operasional coin laundry (`machines`, `bookings`, `machine_time_blocks`, `kategori`, `ulasan`, `wa_clicks`, `pengaturan_toko`, `admin_profiles`, `admin_logs`) tanpa menghapus struktur bawaan.

Kriteria Penerimaan:
- Seluruh perubahan dituangkan dalam file migrasi SQL *additive* (`docs/schema-laundry.sql` atau bagian bawah `docs/schema.sql`) yang idempoten (`IF NOT EXISTS`).
- Tabel `produk` tetap mempertahankan kolom bawaan dan hanya menambahkan kolom opsional dengan nilai default aman (`requires_washer`, `requires_dryer`, `max_capacity_kg`, `cycle_duration_minutes`, `stok`, `aktif`, `harga_coret`, `badge`, `urutan`, `galeri_foto`, `varian`).
- Tabel `machine_time_blocks` mendukung pengecekan anti-overlap per `machine_id` (`start_time < requested_end AND end_time > requested_start`).

### US-EXTRA-02 Sistem Desain Referensi (`test-agy`) & Anti-Slop Tokens

Sebagai pengunjung, saya ingin antarmuka Laundro mengadopsi identitas visual dari `_ref/test-agy/` secara presisi dalam arsitektur Tailwind/Next.js tanpa pola AI slop.

Kriteria Penerimaan:
- Palet warna, tipografi, radius, dan spacing diekstrak dari `_ref/test-agy/styles.css` ke `DESIGN.md` dan `app/globals.css` (mendukung mode terang & gelap US-25).
- Menggunakan aset fotografi asli dari `public/images/` (`hero-machines.jpg`, `dark-drum.jpg`, `coin-tokens.jpg`) dan menghapus seluruh file placeholder SVG UMKM lama (`batik.svg`, `tas.svg`, dll.).
- Bebas dari UI emoji berlebihan, bebas karakter em-dash pada teks antarmuka, dan bebas dari kartu ber-border generik.

### US-EXTRA-03 Operasional Coin Laundry: Live Mesin, Slot Picker TTL 15 Menit, & Papan Jadwal Admin

Sebagai pelanggan dan penjaga outlet, saya ingin memesan blok waktu per unit mesin (Washer -> Dryer) secara akurat dan mengelolanya lewat papan jadwal interaktif.

Kriteria Penerimaan:
- Halaman publik `/` dan `/antrean` menampilkan Live Status per unit mesin (`Washer 01..`, `Dryer 01..`) beserta fitur cek status Kode Booking (`LND-XXXX`).
- Pemesanan di `/produk/[id]` atau `/antrean` menyediakan Machine Slot Picker yang memetakan *linked slots* (Washer + buffer 5 menit -> Dryer), mengunci slot sementara (`PENDING_LOCK` TTL 15 menit) untuk mencegah *race condition*, lalu menghasilkan Kode Booking + pesan konfirmasi DP via WhatsApp.
- Halaman `/admin/jadwal` menampilkan Interactive Machine Timeline Grid (Sumbu Y: unit mesin, Sumbu X: blok waktu) lengkap dengan aksi: Konfirmasi DP, Perpanjang Timer +10 Menit, Quick Walk-in 2-klik, Pindah Unit Mesin (*Reassign*), Geser Jadwal, dan Sakelar Maintenance per mesin (semua tercatat di `admin_logs`).