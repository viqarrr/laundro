-- Seed data awal Coin Laundry (Laundro) - US-EXTRA-01
-- Jalankan setelah docs/schema.sql dan docs/schema-laundry.sql.
-- Aman dijalankan ulang (idempoten).

-- ============================================================================
-- 1. KATEGORI LAYANAN (4 KATEGORI)
-- ============================================================================
insert into public.kategori (nama, slug, deskripsi, urutan)
values
  ('Cuci + Kering', 'cuci-kering', 'Paket lengkap pencucian dan pengeringan dalam satu jadwal terhubung.', 1),
  ('Cuci Saja', 'cuci-saja', 'Penggunaan mesin cuci koin mandiri sesuai kapasitas tabung.', 2),
  ('Kering Saja', 'kering-saja', 'Pengeringan cepat anti-lembap untuk cucian setengah kering atau basah.', 3),
  ('Add-on & Jasa', 'add-on', 'Tambahan deterjen, pewangi, serta jasa drop-off dan lipat rapi.', 4)
on conflict (slug) do nothing;

-- ============================================================================
-- 2. PAKET LAYANAN COIN LAUNDRY PADA TABEL PRODUK (7 PAKET)
-- ============================================================================
insert into public.produk (
  nama,
  harga,
  harga_coret,
  badge,
  deskripsi,
  foto_url,
  galeri_foto,
  kategori,
  requires_washer,
  requires_dryer,
  max_capacity_kg,
  cycle_duration_minutes,
  stok,
  aktif,
  urutan,
  varian
)
select * from (values
  (
    'Paket Cuci + Kering Express',
    25000,
    30000,
    'Terlaris',
    'Layanan lengkap cuci dan kering dengan jadwal terhubung otomatis antara washer dan dryer. Cucian bersih, kering merata, dan siap pakai dalam sekitar 80 menit.',
    '/images/hero-machines.jpg',
    '["/images/hero-machines.jpg", "/images/dark-drum.jpg", "/images/coin-tokens.jpg"]'::jsonb,
    'Cuci + Kering',
    true,
    true,
    7,
    80,
    12,
    true,
    1,
    '[
      {"nama_ukuran": "Tabung Standar 7 kg", "kapasitas_kg": 7, "harga": 25000, "durasi_menit": 80},
      {"nama_ukuran": "Tabung Jumbo 10 kg", "kapasitas_kg": 10, "harga": 35000, "durasi_menit": 85}
    ]'::jsonb
  ),
  (
    'Paket Cuci + Kering Jumbo',
    35000,
    null::integer,
    'Kapasitas Besar',
    'Dirancang untuk sprei, bed cover tipis, atau cucian mingguan hingga 10 kg. Menggunakan tabung berkapasitas besar agar sirkulasi air dan udara tetap optimal.',
    '/images/dark-drum.jpg',
    '["/images/dark-drum.jpg", "/images/hero-machines.jpg"]'::jsonb,
    'Cuci + Kering',
    true,
    true,
    10,
    85,
    8,
    true,
    2,
    '[
      {"nama_ukuran": "Tabung Jumbo 10 kg", "kapasitas_kg": 10, "harga": 35000, "durasi_menit": 85},
      {"nama_ukuran": "2x Tabung Standar (14 kg)", "kapasitas_kg": 14, "harga": 48000, "durasi_menit": 85}
    ]'::jsonb
  ),
  (
    'Cuci Koin Saja (Washer)',
    15000,
    null::integer,
    null,
    'Siklus pencucian mandiri berdurasi 35 menit dengan bilasan higienis dan putaran peras tinggi. Cocok untuk pelanggan yang ingin menjemur sendiri di rumah.',
    '/images/dark-drum.jpg',
    '["/images/dark-drum.jpg", "/images/coin-tokens.jpg"]'::jsonb,
    'Cuci Saja',
    true,
    false,
    7,
    35,
    10,
    true,
    3,
    '[
      {"nama_ukuran": "Tabung Standar 7 kg", "kapasitas_kg": 7, "harga": 15000, "durasi_menit": 35},
      {"nama_ukuran": "Tabung Jumbo 10 kg", "kapasitas_kg": 10, "harga": 22000, "durasi_menit": 35}
    ]'::jsonb
  ),
  (
    'Kering Koin Saja (Dryer)',
    15000,
    null::integer,
    null,
    'Pengeringan panas terkontrol selama 45 menit untuk pakaian basah atau lembap saat musim hujan. Menjaga serat kain tetap lembut tanpa bau apek.',
    '/images/hero-machines.jpg',
    '["/images/hero-machines.jpg", "/images/dark-drum.jpg"]'::jsonb,
    'Kering Saja',
    false,
    true,
    7,
    45,
    10,
    true,
    4,
    '[
      {"nama_ukuran": "Tabung Standar 7 kg", "kapasitas_kg": 7, "harga": 15000, "durasi_menit": 45},
      {"nama_ukuran": "Tabung Jumbo 10 kg", "kapasitas_kg": 10, "harga": 20000, "durasi_menit": 45}
    ]'::jsonb
  ),
  (
    'Paket Hemat Jam Sepi (Cuci + Kering)',
    20000,
    25000,
    'Promo Jam Sepi',
    'Tarif khusus cuci dan kering untuk pemesanan slot di luar jam sibuk. Mendapat prioritas alokasi washer ke dryer dengan kualitas siklus yang sama.',
    '/images/coin-tokens.jpg',
    '["/images/coin-tokens.jpg", "/images/hero-machines.jpg"]'::jsonb,
    'Cuci + Kering',
    true,
    true,
    7,
    80,
    8,
    true,
    5,
    '[
      {"nama_ukuran": "Tabung Standar 7 kg", "kapasitas_kg": 7, "harga": 20000, "durasi_menit": 80},
      {"nama_ukuran": "Tabung Jumbo 10 kg", "kapasitas_kg": 10, "harga": 29000, "durasi_menit": 85}
    ]'::jsonb
  ),
  (
    'Jasa Drop-off Lipat Rapi',
    35000,
    null::integer,
    'Terima Beres',
    'Titipkan cucian Anda kepada penjaga gerai. Termasuk proses cuci, pengeringan penuh, pelipatan rapi, dan pengemasan plastik pelindung siap ambil.',
    '/images/hero-machines.jpg',
    '["/images/hero-machines.jpg", "/images/coin-tokens.jpg"]'::jsonb,
    'Add-on & Jasa',
    true,
    true,
    7,
    90,
    10,
    true,
    6,
    '[
      {"nama_ukuran": "Tabung Standar 7 kg", "kapasitas_kg": 7, "harga": 35000, "durasi_menit": 90},
      {"nama_ukuran": "Tabung Jumbo 10 kg", "kapasitas_kg": 10, "harga": 48000, "durasi_menit": 95}
    ]'::jsonb
  ),
  (
    'Add-on Deterjen & Pewangi Premium',
    5000,
    null::integer,
    null,
    'Paket takaran pas deterjen cair konsentrat rendah busa dan pelembut anti-bakteri untuk satu siklus pencucian di mesin komersial.',
    '/images/coin-tokens.jpg',
    '["/images/coin-tokens.jpg"]'::jsonb,
    'Add-on & Jasa',
    false,
    false,
    7,
    5,
    50,
    true,
    7,
    '[]'::jsonb
  )
) as seed_produk (
  nama,
  harga,
  harga_coret,
  badge,
  deskripsi,
  foto_url,
  galeri_foto,
  kategori,
  requires_washer,
  requires_dryer,
  max_capacity_kg,
  cycle_duration_minutes,
  stok,
  aktif,
  urutan,
  varian
)
where not exists (
  select 1 from public.produk p where p.nama = seed_produk.nama
);

-- ============================================================================
-- 3. UNIT MESIN COIN LAUNDRY (8 UNIT: W-01..W-04 & D-01..D-04)
-- ============================================================================
insert into public.machines (
  machine_code,
  name,
  type,
  max_capacity_kg,
  cycle_duration_minutes,
  booking_mode,
  status
)
values
  ('W-01', 'Washer 01 (Standar 7kg)', 'WASHER', 7, 35, 'ALL', 'ACTIVE'),
  ('W-02', 'Washer 02 (Standar 7kg)', 'WASHER', 7, 35, 'ALL', 'ACTIVE'),
  ('W-03', 'Washer 03 (Jumbo 10kg)', 'WASHER', 10, 35, 'ALL', 'ACTIVE'),
  ('W-04', 'Washer 04 (Jumbo 10kg)', 'WASHER', 10, 35, 'ALL', 'ACTIVE'),
  ('D-01', 'Dryer 01 (Standar 7kg)', 'DRYER', 7, 45, 'ALL', 'ACTIVE'),
  ('D-02', 'Dryer 02 (Standar 7kg)', 'DRYER', 7, 45, 'ALL', 'ACTIVE'),
  ('D-03', 'Dryer 03 (Jumbo 10kg)', 'DRYER', 10, 45, 'ALL', 'ACTIVE'),
  ('D-04', 'Dryer 04 (Jumbo 10kg)', 'DRYER', 10, 45, 'ALL', 'ACTIVE')
on conflict (machine_code) do nothing;

-- ============================================================================
-- 4. PENGATURAN TOKO DEFAULT (SINGLETON ROW)
-- ============================================================================
insert into public.pengaturan_toko (
  id,
  nama_gerai,
  alamat,
  nomor_wa,
  jam_buka,
  jam_tutup,
  buffer_minutes,
  dp_type,
  dp_value,
  info_rekening,
  banner_aktif,
  banner_judul,
  banner_subjudul,
  banner_cta,
  banner_link
)
values (
  1,
  'Laundro',
  'Jl. Kemang Raya No. 28, Jakarta Selatan',
  '6281234567890',
  '07:00',
  '22:00',
  5,
  'FIXED',
  15000,
  'BCA 1234567890 a.n. Laundro Coin / QRIS Gerai Laundro',
  true,
  'Promo Jam Sepi: Cuci + Kering Rp20.000',
  'Berlaku Senin sampai Kamis pukul 09.00 - 15.00 WIB untuk tabung standar 7 kg.',
  'Cek Antrean Mesin',
  '/antrean'
)
on conflict (id) do nothing;
