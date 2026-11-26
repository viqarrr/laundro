-- Skema database additive Coin Laundry (Laundro) - US-EXTRA-01
-- Cara pakai: Jalankan docs/schema.sql terlebih dahulu, lalu tempel seluruh isi file ini di Supabase SQL Editor > Run.
-- 100% additive dan idempoten (aman dijalankan berulang kali).

-- ============================================================================
-- 1. PERLUASAN TABEL PRODUK (ADDITIVE)
-- ============================================================================
alter table public.produk
  add column if not exists requires_washer boolean default false,
  add column if not exists requires_dryer boolean default false,
  add column if not exists max_capacity_kg integer default 7,
  add column if not exists cycle_duration_minutes integer default 40,
  add column if not exists stok integer default 10,
  add column if not exists aktif boolean default true,
  add column if not exists harga_coret integer,
  add column if not exists badge text,
  add column if not exists urutan integer default 0,
  add column if not exists galeri_foto jsonb default '[]'::jsonb,
  add column if not exists varian jsonb default '[]'::jsonb;

-- ============================================================================
-- 2. TABEL KATEGORI (US-31, US-49)
-- ============================================================================
create table if not exists public.kategori (
  id bigint generated always as identity primary key,
  nama text not null,
  slug text not null unique,
  deskripsi text,
  urutan integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.kategori enable row level security;

drop policy if exists "publik_baca_kategori" on public.kategori;
drop policy if exists "admin_kelola_kategori" on public.kategori;

create policy "publik_baca_kategori" on public.kategori
  for select to anon, authenticated using (true);

create policy "admin_kelola_kategori" on public.kategori
  for all to authenticated using (true) with check (true);

-- ============================================================================
-- 3. TABEL PENGATURAN TOKO (SINGLETON - US-42, US-43)
-- ============================================================================
create table if not exists public.pengaturan_toko (
  id integer primary key default 1 check (id = 1),
  nama_gerai text not null default 'Laundro',
  alamat text,
  nomor_wa text not null default '6281234567890',
  jam_buka text not null default '07:00',
  jam_tutup text not null default '22:00',
  buffer_minutes integer not null default 5 check (buffer_minutes >= 0),
  dp_type text not null default 'FIXED' check (dp_type in ('FIXED', 'PERCENTAGE')),
  dp_value integer not null default 15000 check (dp_value >= 0),
  info_rekening text,
  banner_aktif boolean not null default false,
  banner_judul text,
  banner_subjudul text,
  banner_cta text,
  banner_link text,
  updated_at timestamptz not null default now()
);

alter table public.pengaturan_toko enable row level security;

drop policy if exists "publik_baca_pengaturan_toko" on public.pengaturan_toko;
drop policy if exists "admin_kelola_pengaturan_toko" on public.pengaturan_toko;

create policy "publik_baca_pengaturan_toko" on public.pengaturan_toko
  for select to anon, authenticated using (true);

create policy "admin_kelola_pengaturan_toko" on public.pengaturan_toko
  for all to authenticated using (true) with check (true);

-- ============================================================================
-- 4. TABEL MACHINES (INVENTARIS UNIT MESIN - US-EXTRA-03)
-- ============================================================================
create table if not exists public.machines (
  id bigint generated always as identity primary key,
  machine_code text not null unique,
  name text not null,
  type text not null check (type in ('WASHER', 'DRYER')),
  max_capacity_kg integer not null default 7 check (max_capacity_kg > 0),
  cycle_duration_minutes integer not null default 35 check (cycle_duration_minutes > 0),
  booking_mode text not null default 'ALL' check (booking_mode in ('ALL', 'WALK_IN_ONLY')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'MAINTENANCE')),
  created_at timestamptz not null default now()
);

alter table public.machines enable row level security;

drop policy if exists "publik_baca_machines" on public.machines;
drop policy if exists "admin_kelola_machines" on public.machines;

create policy "publik_baca_machines" on public.machines
  for select to anon, authenticated using (true);

create policy "admin_kelola_machines" on public.machines
  for all to authenticated using (true) with check (true);

-- ============================================================================
-- 5. TABEL BOOKINGS (RESERVASI ANTREAN & WALK-IN - US-EXTRA-03)
-- ============================================================================
create table if not exists public.bookings (
  id bigint generated always as identity primary key,
  booking_code text not null unique,
  service_product_id bigint references public.produk(id) on delete set null,
  source text not null default 'ONLINE' check (source in ('ONLINE', 'WALK_IN')),
  customer_name text not null,
  customer_phone text not null,
  estimated_weight_kg numeric(6,2) not null default 7 check (estimated_weight_kg > 0),
  actual_weight_kg numeric(6,2) check (actual_weight_kg is null or actual_weight_kg > 0),
  total_estimated_price integer not null default 0 check (total_estimated_price >= 0),
  total_final_price integer check (total_final_price is null or total_final_price >= 0),
  dp_amount integer not null default 0 check (dp_amount >= 0),
  payment_status text not null default 'UNPAID' check (payment_status in ('UNPAID', 'PENDING_DP', 'DP_PAID', 'PAID', 'REFUNDED')),
  booking_status text not null default 'PENDING_LOCK' check (booking_status in ('PENDING_LOCK', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED')),
  lock_expires_at timestamptz,
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_bookings_status_created
  on public.bookings (booking_status, created_at desc);

alter table public.bookings enable row level security;

drop policy if exists "publik_buat_booking_terbatas" on public.bookings;
drop policy if exists "admin_kelola_bookings" on public.bookings;

create policy "publik_buat_booking_terbatas" on public.bookings
  for insert to anon
  with check (source = 'ONLINE' and booking_status = 'PENDING_LOCK');

create policy "admin_kelola_bookings" on public.bookings
  for all to authenticated using (true) with check (true);

-- ============================================================================
-- 6. TABEL MACHINE TIME BLOCKS (ANTI-OVERLAP JADWAL MESIN - US-EXTRA-03)
-- ============================================================================
create table if not exists public.machine_time_blocks (
  id bigint generated always as identity primary key,
  booking_id bigint not null references public.bookings(id) on delete cascade,
  machine_id bigint not null references public.machines(id) on delete restrict,
  block_date date not null,
  start_time time not null,
  end_time time not null,
  stage text not null check (stage in ('WASHING', 'DRYING')),
  block_status text not null default 'LOCKED_TEMP' check (block_status in ('LOCKED_TEMP', 'BOOKED', 'RUNNING', 'DONE')),
  check (end_time > start_time)
);

create index if not exists idx_machine_time_blocks_overlap
  on public.machine_time_blocks (machine_id, block_date, start_time, end_time);

alter table public.machine_time_blocks enable row level security;

drop policy if exists "publik_baca_machine_time_blocks" on public.machine_time_blocks;
drop policy if exists "publik_buat_machine_time_blocks_terbatas" on public.machine_time_blocks;
drop policy if exists "admin_kelola_machine_time_blocks" on public.machine_time_blocks;

create policy "publik_baca_machine_time_blocks" on public.machine_time_blocks
  for select to anon, authenticated using (true);

create policy "publik_buat_machine_time_blocks_terbatas" on public.machine_time_blocks
  for insert to anon
  with check (block_status = 'LOCKED_TEMP');

create policy "admin_kelola_machine_time_blocks" on public.machine_time_blocks
  for all to authenticated using (true) with check (true);

-- ============================================================================
-- 7. TABEL ULASAN (RATING & MODERASI - US-38, US-39)
-- ============================================================================
create table if not exists public.ulasan (
  id bigint generated always as identity primary key,
  produk_id bigint not null references public.produk(id) on delete cascade,
  nama text not null,
  rating integer not null check (rating between 1 and 5),
  komentar text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_ulasan_produk_status
  on public.ulasan (produk_id, status, created_at desc);

alter table public.ulasan enable row level security;

drop policy if exists "publik_baca_ulasan_approved" on public.ulasan;
drop policy if exists "publik_kirim_ulasan_pending" on public.ulasan;
drop policy if exists "admin_kelola_ulasan" on public.ulasan;

create policy "publik_baca_ulasan_approved" on public.ulasan
  for select to anon
  using (status = 'approved');

create policy "publik_kirim_ulasan_pending" on public.ulasan
  for insert to anon
  with check (status = 'pending' and rating between 1 and 5);

create policy "admin_kelola_ulasan" on public.ulasan
  for all to authenticated using (true) with check (true);

-- ============================================================================
-- 8. TABEL WA CLICKS (ANALITIK KLIK WHATSAPP - US-40, US-41)
-- ============================================================================
create table if not exists public.wa_clicks (
  id bigint generated always as identity primary key,
  produk_id bigint references public.produk(id) on delete set null,
  sumber text not null default 'katalog',
  created_at timestamptz not null default now()
);

create index if not exists idx_wa_clicks_produk_created
  on public.wa_clicks (produk_id, created_at desc);

alter table public.wa_clicks enable row level security;

drop policy if exists "publik_catat_wa_click" on public.wa_clicks;
drop policy if exists "admin_kelola_wa_clicks" on public.wa_clicks;

create policy "publik_catat_wa_click" on public.wa_clicks
  for insert to anon
  with check (char_length(coalesce(sumber, '')) > 0);

create policy "admin_kelola_wa_clicks" on public.wa_clicks
  for all to authenticated using (true) with check (true);

-- ============================================================================
-- 9. TABEL ADMIN PROFILES (MANAJEMEN PERAN ADMIN - US-44)
-- ============================================================================
create table if not exists public.admin_profiles (
  user_id uuid primary key,
  email text not null unique,
  nama text not null,
  role text not null default 'STAFF' check (role in ('SUPERADMIN', 'STAFF')),
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;

drop policy if exists "admin_kelola_admin_profiles" on public.admin_profiles;

create policy "admin_kelola_admin_profiles" on public.admin_profiles
  for all to authenticated using (true) with check (true);

-- ============================================================================
-- 10. TABEL ADMIN LOGS (AUDIT AKTIVITAS ADMIN - US-45)
-- ============================================================================
create table if not exists public.admin_logs (
  id bigint generated always as identity primary key,
  admin_email text not null,
  aksi text not null,
  entitas text not null,
  entitas_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_logs_created
  on public.admin_logs (created_at desc);

alter table public.admin_logs enable row level security;

drop policy if exists "admin_kelola_admin_logs" on public.admin_logs;

create policy "admin_kelola_admin_logs" on public.admin_logs
  for all to authenticated using (true) with check (true);
