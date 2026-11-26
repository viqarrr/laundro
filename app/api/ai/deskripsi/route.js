import { NextResponse } from "next/server";
import { callGeminiFlash } from "@/lib/gemini";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { ensureAdminProfile, getAdminSession } from "@/lib/supabase/session";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: "Akses ditolak. Silakan masuk sebagai admin terlebih dahulu." },
      { status: 401 }
    );
  }

  const profile = await ensureAdminProfile(session);
  if (!profile.aktif) {
    return NextResponse.json({ error: "Akun admin sedang dinonaktifkan." }, { status: 403 });
  }

  try {
    const clientIp = await getClientIp();
    const rate = checkRateLimit({
      key: `ai-deskripsi:${session.user.id}:${clientIp}`,
      limit: 20,
      windowMs: 10 * 60 * 1000,
      consume: true,
    });

    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Batas permintaan deskripsi AI tercapai. Silakan tunggu ${rate.retryAfterMinutes} menit lagi.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
    }

    const nama = String(body.nama || "").trim().slice(0, 120);
    if (nama.length < 2) {
      return NextResponse.json(
        { error: "Isi nama paket layanan terlebih dahulu (minimal 2 karakter)." },
        { status: 400 }
      );
    }

    const kategori = String(body.kategori || "Layanan Laundry").trim().slice(0, 60);
    const maxCapParsed = Number(body.max_capacity_kg);
    const maxCapacityKg =
      Number.isFinite(maxCapParsed) && maxCapParsed > 0 && maxCapParsed <= 200
        ? Math.round(maxCapParsed)
        : 7;

    const durasiParsed = Number(body.cycle_duration_minutes);
    const cycleDurationMinutes =
      Number.isFinite(durasiParsed) && durasiParsed > 0 && durasiParsed <= 1440
        ? Math.round(durasiParsed)
        : 40;

    const systemInstruction = [
      "Kamu adalah copywriter profesional untuk gerai coin laundry modern bernama Laundro.",
      "Tugasmu menulis deskripsi singkat layanan/add-on untuk halaman katalog.",
      "Aturan wajib:",
      "1. Gunakan bahasa Indonesia yang natural, jelas, ringkas, dan informatif.",
      "2. Tulis tepat 2 hingga 3 kalimat saja.",
      "3. Dilarang menggunakan karakter em-dash atau en-dash. Gunakan tanda hubung biasa (-) atau tanda baca standar.",
      "4. Jangan gunakan emoji, bullet list, atau format markdown (tanpa tanda bintang atau tagar).",
      "5. Jangan mengarang harga atau promo yang tidak diberikan.",
    ].join("\n");

    const prompt = [
      `Buatkan deskripsi singkat untuk paket layanan berikut:`,
      `- Nama paket: ${nama}`,
      `- Kategori: ${kategori}`,
      `- Kapasitas maksimal per tabung: ${maxCapacityKg} kg`,
      `- Perkiraan durasi siklus: ${cycleDurationMinutes} menit`,
    ].join("\n");

    const result = await callGeminiFlash({
      systemInstruction,
      prompt,
      temperature: 0.45,
      maxOutputTokens: 280,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ deskripsi: result.text });
  } catch {
    return NextResponse.json(
      { error: "Terjadi gangguan saat membuat deskripsi layanan." },
      { status: 500 }
    );
  }
}
