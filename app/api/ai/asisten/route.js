import { NextResponse } from "next/server";
import { formatRupiah } from "@/lib/format";
import { callGeminiFlash } from "@/lib/gemini";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createSupabasePublicClient } from "@/lib/supabase/server";

const MAX_PERTANYAAN_CHARS = 300;

async function ambilKonteksProduk() {
  const supabase = createSupabasePublicClient();

  const { data: produkList, error } = await supabase
    .from("produk")
    .select(
      "id, nama, kategori, harga, harga_coret, badge, max_capacity_kg, cycle_duration_minutes, requires_washer, requires_dryer, stok, varian, deskripsi"
    )
    .eq("aktif", true)
    .order("urutan", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !produkList || produkList.length === 0) {
    return "Belum ada data paket layanan aktif.";
  }

  return produkList
    .map((p) => {
      const tipeMesin =
        [p.requires_washer ? "Washer" : null, p.requires_dryer ? "Dryer" : null]
          .filter(Boolean)
          .join(" + ") || "Add-on / Non-mesin";
      const infoStok = Number(p.stok ?? 10) <= 0 ? "Habis/Penuh" : `Tersedia (${p.stok ?? 10})`;
      const infoPromo =
        p.harga_coret && p.harga_coret > p.harga
          ? ` (harga normal ${formatRupiah(p.harga_coret)})`
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
      const infoDeskripsi = p.deskripsi ? ` | Deskripsi: ${p.deskripsi}` : "";

      return `- ${p.nama} [${p.kategori || "Layanan"}]: ${formatRupiah(p.harga)}${infoPromo}, maks ${p.max_capacity_kg || 7} kg/tabung, durasi ${p.cycle_duration_minutes || 40} menit, cakupan: ${tipeMesin}, status: ${infoStok}${infoVarian}${infoDeskripsi}`;
    })
    .join("\n");
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

    const ringkasanProduk = await ambilKonteksProduk();

    const systemInstruction = [
      "Kamu adalah Asisten Layanan pelanggan untuk gerai coin laundry Laundro.",
      "Tugasmu membantu pengunjung memilih paket layanan dan menghitung perkiraan jumlah tabung serta total biaya berdasarkan data katalog produk.",
      "",
      "Aturan ketat:",
      "1. Jawab HANYA berdasarkan DAFTAR PRODUK AKTIF di bawah ini. Jangan pernah mengarang harga, nama paket, atau spesifikasi yang tidak tercantum.",
      "2. Jika pengunjung menyebut berat cucian (misal 9 kg) dan kapasitas tabung paket 7 kg, hitung kebutuhan jumlah tabung dengan pembulatan ke atas (contoh: 9 kg / 7 kg = 2 tabung) beserta total biayanya, atau rekomendasikan varian ukuran yang sesuai jika tersedia di data produk.",
      "3. Gunakan bahasa Indonesia yang ramah, ringkas (maksimal 5 kalimat), jelas, dan akurat.",
      "4. Dilarang memakai karakter em-dash atau en-dash, dilarang memakai HTML, dan hindari emoji berlebihan.",
      "5. Jika pertanyaan di luar katalog produk atau data tidak tersedia, sampaikan dengan jujur dan arahkan pengunjung memilih dari paket yang tersedia.",
      "",
      "DAFTAR PRODUK AKTIF:",
      ringkasanProduk,
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
