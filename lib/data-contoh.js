// DATA CONTOH: hanya untuk tampilan awal sebelum terhubung ke database.
// Nama kolom sama dengan tabel "produk" di docs/schema.sql dan docs/schema-laundry.sql.
// Setelah US-01 selesai, halaman tidak lagi memakai file ini.

export const produkContoh = [
  {
    id: 1,
    nama: "Paket Cuci + Kering Express",
    harga: 25000,
    harga_coret: 30000,
    badge: "Terlaris",
    deskripsi:
      "Layanan lengkap cuci dan kering dengan jadwal terhubung otomatis antara washer dan dryer. Selesai sekitar 80 menit.",
    foto_url: "/images/hero-machines.jpg",
    kategori: "Cuci + Kering",
    requires_washer: true,
    requires_dryer: true,
    max_capacity_kg: 7,
    cycle_duration_minutes: 80,
    stok: 12,
    aktif: true,
    urutan: 1,
    varian: [
      { nama_ukuran: "Tabung Standar 7 kg", kapasitas_kg: 7, harga: 25000, durasi_menit: 80 },
      { nama_ukuran: "Tabung Jumbo 10 kg", kapasitas_kg: 10, harga: 35000, durasi_menit: 85 },
    ],
  },
  {
    id: 2,
    nama: "Paket Cuci + Kering Jumbo",
    harga: 35000,
    harga_coret: null,
    badge: "Kapasitas Besar",
    deskripsi:
      "Dirancang untuk sprei, bed cover tipis, atau cucian mingguan hingga 10 kg menggunakan tabung berkapasitas besar.",
    foto_url: "/images/dark-drum.jpg",
    kategori: "Cuci + Kering",
    requires_washer: true,
    requires_dryer: true,
    max_capacity_kg: 10,
    cycle_duration_minutes: 85,
    stok: 8,
    aktif: true,
    urutan: 2,
    varian: [
      { nama_ukuran: "Tabung Jumbo 10 kg", kapasitas_kg: 10, harga: 35000, durasi_menit: 85 },
      { nama_ukuran: "2x Tabung Standar (14 kg)", kapasitas_kg: 14, harga: 48000, durasi_menit: 85 },
    ],
  },
  {
    id: 3,
    nama: "Cuci Koin Saja (Washer)",
    harga: 15000,
    harga_coret: null,
    badge: null,
    deskripsi:
      "Siklus pencucian mandiri berdurasi 35 menit dengan bilasan higienis dan putaran peras tinggi.",
    foto_url: "/images/dark-drum.jpg",
    kategori: "Cuci Saja",
    requires_washer: true,
    requires_dryer: false,
    max_capacity_kg: 7,
    cycle_duration_minutes: 35,
    stok: 10,
    aktif: true,
    urutan: 3,
    varian: [
      { nama_ukuran: "Tabung Standar 7 kg", kapasitas_kg: 7, harga: 15000, durasi_menit: 35 },
      { nama_ukuran: "Tabung Jumbo 10 kg", kapasitas_kg: 10, harga: 22000, durasi_menit: 35 },
    ],
  },
  {
    id: 4,
    nama: "Kering Koin Saja (Dryer)",
    harga: 15000,
    harga_coret: null,
    badge: null,
    deskripsi:
      "Pengeringan panas terkontrol selama 45 menit agar pakaian kering merata dan bebas bau apek.",
    foto_url: "/images/hero-machines.jpg",
    kategori: "Kering Saja",
    requires_washer: false,
    requires_dryer: true,
    max_capacity_kg: 7,
    cycle_duration_minutes: 45,
    stok: 10,
    aktif: true,
    urutan: 4,
    varian: [
      { nama_ukuran: "Tabung Standar 7 kg", kapasitas_kg: 7, harga: 15000, durasi_menit: 45 },
      { nama_ukuran: "Tabung Jumbo 10 kg", kapasitas_kg: 10, harga: 20000, durasi_menit: 45 },
    ],
  },
  {
    id: 5,
    nama: "Jasa Drop-off Lipat Rapi",
    harga: 35000,
    harga_coret: null,
    badge: "Terima Beres",
    deskripsi:
      "Titipkan cucian Anda kepada penjaga gerai. Termasuk cuci, pengeringan penuh, lipat rapi, dan kemasan plastik pelindung.",
    foto_url: "/images/hero-machines.jpg",
    kategori: "Add-on & Jasa",
    requires_washer: true,
    requires_dryer: true,
    max_capacity_kg: 7,
    cycle_duration_minutes: 90,
    stok: 10,
    aktif: true,
    urutan: 5,
    varian: [
      { nama_ukuran: "Tabung Standar 7 kg", kapasitas_kg: 7, harga: 35000, durasi_menit: 90 },
      { nama_ukuran: "Tabung Jumbo 10 kg", kapasitas_kg: 10, harga: 48000, durasi_menit: 95 },
    ],
  },
  {
    id: 6,
    nama: "Add-on Deterjen & Pewangi Premium",
    harga: 5000,
    harga_coret: null,
    badge: null,
    deskripsi:
      "Takaran pas deterjen cair konsentrat rendah busa dan pelembut anti-bakteri untuk satu siklus mesin.",
    foto_url: "/images/coin-tokens.jpg",
    kategori: "Add-on & Jasa",
    requires_washer: false,
    requires_dryer: false,
    max_capacity_kg: 7,
    cycle_duration_minutes: 5,
    stok: 50,
    aktif: true,
    urutan: 6,
    varian: [],
  },
];

export function cariProdukContoh(id) {
  return produkContoh.find((produk) => String(produk.id) === String(id));
}
