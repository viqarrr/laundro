import { NextResponse } from "next/server";
import { formatRupiah } from "@/lib/format";
import { callGeminiFlash } from "@/lib/gemini";
import { getPengaturanToko } from "@/lib/pengaturan";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createSupabasePublicClient } from "@/lib/supabase/server";

const MAX_PERTANYAAN_CHARS = 300;

async function ambilKonteksGerai() {
  const [pengaturan, supabase] = await Promise.all([
    getPengaturanToko(),
    Promise.resolve(createSupabasePublicClient()),
  ]);

  const [produkRes, mesinRes] = await Promise.all([
    supabase
      .from("produk")
      .select(
        "id, nama, kategori, harga, harga_coret, badge, max_capacity_kg, cycle_duration_minutes, requires_washer, requires_dryer, stok, varian, deskripsi"
      )
      .eq("aktif", true)
      .order("urutan", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("machines")
      .select("id, machine_code, name, type, max_capacity_kg, cycle_duration_minutes, status, booking_mode")
      .order("type", { ascending: true })
      .order("machine_code", { ascending: true }),
  ]);

  const produkList = produkRes.error ? [] : produkRes.data || [];
  const mesinList = mesinRes.error ? [] : mesinRes.data || [];

  const washerAktif = mesinList.filter((m) => m.type === "WASHER" && m.status === "ACTIVE").length;
  const washerTotal = mesinList.filter((m) => m.type === "WASHER").length;
  const dryerAktif = mesinList.filter((m) => m.type === "DRYER" && m.status === "ACTIVE").length;
  const dryerTotal = mesinList.filter((m) => m.type === "DRYER").length;

  const ringkasanProduk =
    produkList.length > 0
      ? produkList
          .map((p) => {
            const tipeMesin = [
              p.requires_washer ? "Washer" : null,
              p.requires_dryer ? "Dryer" : null,
            ]
              .filter(Boolean)
              .join(" + ") || "Add-on / Non-mesin";
            const infoStok = Number(p.stok ?? 10) <= 0 ? "Habis/Penuh" : `Stok ${p.stok ?? 10}`;
            const infoPromo =
              p.harga_coret && p.harga_coret > p.harga
                ? ` (harga coret ${formatRupiah(p.harga_coret)})`
                : "";
            const infoVarian =
              Array.isArray(p.varian) && p.varian.length > 0
                ? ` | Varian: ${p.varian
                    .map(
                      (v) =>
                        `${v.nama_ukuran} (${v.kapasitas_kg} kg, ${formatRupiah(v.harga)}, ${v.durasi_menit} mnt)`
                    )
                    .join("; ")}`
                : "";

            return `- ${p.nama} [${p.kategori || "Layanan"}]: ${formatRupiah(p.harga)}${infoPromo}, maks ${p.max_capacity_kg || 7} kg/tabung, durasi ${p.cycle_duration_minutes || 40} menit, mesin: ${tipeMesin}, ${infoStok}${infoVarian}.`;
          })
          .join("\n")
      : "Belum ada data paket layanan aktif.";

  const ringkasanMesin =
    mesinList.length > 0
      ? [
          `Mesin Cuci (Washer): ${washerAktif} aktif dari ${washerTotal} unit.`,
          `Mesin Pengering (Dryer): ${dryerAktif} aktif dari ${dryerTotal} unit.`,
          ...mesinList.map(
            (m) =>
              `- ${m.name} (${m.machine_code}, ${m.type}, maks ${m.max_capacity_kg} kg, ${m.cycle_duration_minutes} menit, mode ${m.booking_mode}): status ${m.status}`
          ),
        ].join("\n")
      : "Data unit mesin belum tersedia.";

  const dpInfo =
    pengaturan.dp_type === "PERCENTAGE"
      ? `${pengaturan.dp_value}% dari total estimasi`
      : formatRupiah(pengaturan.dp_value);

  return {
    namaGerai: pengaturan.nama_gerai,
    jamOperasional: pengaturan.jam_operasional_label || `${pengaturan.jam_buka} - ${pengaturan.jam_tutup} WIB`,
    alamat: pengaturan.alamat,
    dpInfo,
    bufferMinutes: pengaturan.buffer_minutes ?? 5,
    ringkasanProduk,
    ringkasanMesin,
  };
}

export async function POST(request) {
  try {
    const clientIp = await getClientIp();
    const rate = checkRateLimit({
      key: `ai-asisten-ip:${clientIp}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
      consume: true,
    });

    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Batas pertanyaan tercapai (maks 10 pertanyaan per 10 menit). Silakan tunggu ${rate.retryAfterMinutes} menit lagi.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
    }

    const pertanyaan = String(body.pertanyaan || "").trim();
    if (pertanyaan.length < 2) {
      return NextResponse.json(
        { error: "Tulis pertanyaan Anda terlebih dahulu (minimal 2 karakter)." },
        { status: 400 }
      );
    }

    if (pertanyaan.length > MAX_PERTANYAAN_CHARS) {
      return NextResponse.json(
        { error: `Pertanyaan maksimal ${MAX_PERTANYAAN_CHARS} karakter.` },
        { status: 400 }
      );
    }

    const konteks = await ambilKonteksGerai();

    const systemInstruction = [
      `Kamu adalah Asisten Layanan pelanggan untuk gerai coin laundry "${konteks.namaGerai}".`,
      "Tugasmu membantu pengunjung memilih paket layanan, menghitung perkiraan jumlah tabung berdasarkan berat cucian, dan memberi informasi ketersediaan mesin.",
      "",
      "Aturan ketat:",
      "1. Jawab HANYA berdasarkan DATA GERAI di bawah ini. Jangan pernah mengarang harga, nama paket, atau status mesin yang tidak tercantum.",
      "2. Jika pengunjung menyebut berat cucian (misal 9 kg) dan kapasitas tabung paket 7 kg, jelaskan kebutuhan jumlah tabung dengan rumus pembulatan ke atas (contoh: 9 kg / 7 kg = 2 tabung) beserta total biayanya, atau rekomendasikan varian Jumbo/Extra jika tersedia di data paket.",
      "3. Sampaikan juga bahwa berat aktual akan dikonfirmasi di timbangan digital gerai saat kedatangan.",
      "4. Gunakan bahasa Indonesia yang ramah, ringkas (maksimal 5 kalimat), jelas, dan berbasis fakta.",
      "5. Dilarang memakai karakter em-dash atau en-dash, dilarang memakai HTML, dan hindari emoji berlebihan.",
      "6. Jika pertanyaan di luar topik laundry atau data tidak tersedia, arahkan pengunjung dengan sopan untuk menghubungi gerai lewat tombol WhatsApp atau mengecek halaman /antrean.",
      "",
      "DATA GERAI:",
      `Nama Gerai: ${konteks.namaGerai}`,
      `Jam Operasional: ${konteks.jamOperasional}`,
      `Alamat: ${konteks.alamat}`,
      `Aturan DP: ${konteks.dpInfo}`,
      `Buffer perpindahan Washer ke Dryer: ${konteks.bufferMinutes} menit`,
      "",
      "DAFTAR PAKET LAYANAN AKTIF:",
      konteks.ringkasanProduk,
      "",
      "STATUS INVENTARIS MESIN:",
      konteks.ringkasanMesin,
    ].join("\n");

    const prompt = `Pertanyaan pengunjung:\n"${pertanyaan}"`;

    const result = await callGeminiFlash({
      systemInstruction,
      prompt,
      temperature: 0.3,
      maxOutputTokens: 450,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ jawaban: result.text });
  } catch {
    return NextResponse.json(
      { error: "Terjadi gangguan saat memproses pertanyaan Anda. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
