import { createSupabasePublicClient } from "@/lib/supabase/server";
import { toko } from "@/lib/toko";

export function normalisasiNomorWa(nomor) {
  const digits = String(nomor || "").replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  return digits || "6281234567890";
}

export function hitungDpDariPengaturan(totalHarga, pengaturan) {
  const total = Math.max(0, Number(totalHarga || 0));
  if (total === 0) return 0;

  if (pengaturan?.dp_type === "PERCENTAGE") {
    const persen = Math.min(100, Math.max(0, Number(pengaturan.dp_value ?? 50)));
    return Math.round((total * persen) / 100);
  }

  const fixed = Math.max(0, Number(pengaturan?.dp_value ?? 15000));
  return Math.min(total, fixed);
}

/**
 * Mengambil baris singleton pengaturan_toko dari Supabase dengan fallback aman ke lib/toko.js.
 */
export async function getPengaturanToko() {
  const defaults = {
    id: 1,
    nama_gerai: toko.nama,
    alamat: toko.alamat,
    nomor_wa: toko.nomorWhatsApp,
    jam_buka: "07:00",
    jam_tutup: "22:00",
    jam_operasional_label: toko.jamBuka,
    buffer_minutes: 5,
    dp_type: "FIXED",
    dp_value: 15000,
    info_rekening: "BCA 1234567890 a.n. Laundro Coin / QRIS Gerai Laundro",
    banner_aktif: false,
    banner_judul: "",
    banner_subjudul: "",
    banner_cta: "Cek Antrean Mesin",
    banner_link: "/antrean",
  };

  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("pengaturan_toko")
      .select(
        "id, nama_gerai, alamat, nomor_wa, jam_buka, jam_tutup, buffer_minutes, dp_type, dp_value, info_rekening, banner_aktif, banner_judul, banner_subjudul, banner_cta, banner_link, updated_at"
      )
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return defaults;
    }

    const jamBuka = data.jam_buka || defaults.jam_buka;
    const jamTutup = data.jam_tutup || defaults.jam_tutup;

    return {
      ...defaults,
      ...data,
      nama_gerai: data.nama_gerai || defaults.nama_gerai,
      alamat: data.alamat || defaults.alamat,
      nomor_wa: data.nomor_wa || defaults.nomor_wa,
      jam_buka: jamBuka,
      jam_tutup: jamTutup,
      jam_operasional_label: `Setiap hari, ${jamBuka} - ${jamTutup} WIB`,
    };
  } catch {
    return defaults;
  }
}
