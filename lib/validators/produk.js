const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

function parseIntegerField(raw, { required = false, min = null, max = null, defaultValue = null, label }) {
  const str = String(raw ?? "").trim();

  if (!str) {
    if (required) {
      return { error: `${label} wajib diisi.` };
    }
    return { value: defaultValue };
  }

  if (!/^-?\d+$/.test(str)) {
    return { error: `${label} harus berupa bilangan bulat.` };
  }

  const num = Number(str);
  if (!Number.isSafeInteger(num)) {
    return { error: `${label} di luar rentang angka yang valid.` };
  }
  if (min !== null && num < min) {
    return { error: `${label} minimal ${min}.` };
  }
  if (max !== null && num > max) {
    return { error: `${label} maksimal ${max}.` };
  }

  return { value: num };
}

function isValidFotoUrl(value) {
  if (!value) return true;

  if (value.startsWith("/")) {
    // Tolak protocol-relative (//) atau path traversal (..)
    if (value.startsWith("//") || value.includes("..")) {
      return false;
    }
    return /^\/[a-zA-Z0-9/_.-]+$/.test(value);
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Validasi input form produk/paket layanan di sisi server (US-34).
 * Mengembalikan { valid, data, errors }.
 */
export function validasiInputProduk(formData) {
  const errors = {};

  const nama = String(formData.get("nama") || "").trim();
  if (nama.length < 2 || nama.length > 120) {
    errors.nama = "Nama paket wajib diisi (2 hingga 120 karakter).";
  }

  const kategori = String(formData.get("kategori") || "").trim();
  if (kategori.length < 2 || kategori.length > 60) {
    errors.kategori = "Kategori wajib diisi (2 hingga 60 karakter).";
  }

  const hargaParsed = parseIntegerField(formData.get("harga"), {
    required: true,
    min: 0,
    max: 100000000,
    label: "Harga",
  });
  if (hargaParsed.error) {
    errors.harga = hargaParsed.error;
  }

  const hargaCoretParsed = parseIntegerField(formData.get("harga_coret"), {
    required: false,
    min: 0,
    max: 100000000,
    defaultValue: null,
    label: "Harga coret",
  });
  if (hargaCoretParsed.error) {
    errors.harga_coret = hargaCoretParsed.error;
  } else if (
    hargaCoretParsed.value !== null &&
    hargaParsed.value !== undefined &&
    hargaCoretParsed.value <= hargaParsed.value
  ) {
    errors.harga_coret = "Harga coret harus lebih besar dari harga aktif.";
  }

  const deskripsi = String(formData.get("deskripsi") || "").trim();
  if (deskripsi.length < 5 || deskripsi.length > 2000) {
    errors.deskripsi = "Deskripsi wajib diisi (5 hingga 2000 karakter).";
  }

  const capacityParsed = parseIntegerField(formData.get("max_capacity_kg"), {
    required: true,
    min: 1,
    max: 200,
    label: "Kapasitas maksimal (kg)",
  });
  if (capacityParsed.error) {
    errors.max_capacity_kg = capacityParsed.error;
  }

  const durationParsed = parseIntegerField(formData.get("cycle_duration_minutes"), {
    required: true,
    min: 1,
    max: 1440,
    label: "Durasi siklus (menit)",
  });
  if (durationParsed.error) {
    errors.cycle_duration_minutes = durationParsed.error;
  }

  const stokParsed = parseIntegerField(formData.get("stok"), {
    required: false,
    min: 0,
    max: 100000,
    defaultValue: 10,
    label: "Stok",
  });
  if (stokParsed.error) {
    errors.stok = stokParsed.error;
  }

  const urutanParsed = parseIntegerField(formData.get("urutan"), {
    required: false,
    min: -9999,
    max: 99999,
    defaultValue: 0,
    label: "Urutan",
  });
  if (urutanParsed.error) {
    errors.urutan = urutanParsed.error;
  }

  const badgeRaw = String(formData.get("badge") || "").trim();
  if (badgeRaw.length > 40) {
    errors.badge = "Badge maksimal 40 karakter.";
  }

  const fotoUrlRaw = String(formData.get("foto_url") || "").trim();
  if (fotoUrlRaw && !isValidFotoUrl(fotoUrlRaw)) {
    errors.foto_url = "URL foto harus berupa URL http/https valid atau path lokal seperti /images/hero-machines.jpg.";
  }

  const aktif = formData.get("aktif") === "on" || formData.get("aktif") === "true";
  const requires_washer =
    formData.get("requires_washer") === "on" || formData.get("requires_washer") === "true";
  const requires_dryer =
    formData.get("requires_dryer") === "on" || formData.get("requires_dryer") === "true";

  // Validasi galeri_foto JSONB (US-18)
  let galeri_foto = [];
  const galeriRaw = String(formData.get("galeri_foto_json") || "").trim();
  if (galeriRaw) {
    try {
      const parsedGaleri = JSON.parse(galeriRaw);
      if (!Array.isArray(parsedGaleri)) {
        errors.galeri_foto = "Format galeri foto tidak valid.";
      } else {
        const cleaned = parsedGaleri
          .map((item) => String(item || "").trim())
          .filter(Boolean)
          .slice(0, 10);
        const invalidItem = cleaned.find((url) => !isValidFotoUrl(url));
        if (invalidItem) {
          errors.galeri_foto = "Semua URL foto galeri harus URL http/https valid atau path /images/...";
        } else {
          galeri_foto = Array.from(new Set(cleaned));
        }
      }
    } catch {
      errors.galeri_foto = "Data galeri foto tidak dapat dibaca.";
    }
  }

  // Validasi varian ukuran JSONB (US-48)
  let varian = [];
  const varianRaw = String(formData.get("varian_json") || "").trim();
  if (varianRaw) {
    try {
      const parsedVarian = JSON.parse(varianRaw);
      if (!Array.isArray(parsedVarian)) {
        errors.varian = "Format daftar varian tidak valid.";
      } else {
        const normalizedVarian = [];
        for (const row of parsedVarian.slice(0, 10)) {
          const namaUkuran = String(row?.nama_ukuran || "").trim();
          const kapasitasKg = Number(row?.kapasitas_kg);
          const hargaVar = Number(row?.harga);
          const durasiMenit = Number(row?.durasi_menit || durationParsed.value || 40);

          if (!namaUkuran && !row?.kapasitas_kg && !row?.harga) {
            continue;
          }

          if (
            namaUkuran.length < 2 ||
            namaUkuran.length > 60 ||
            !Number.isInteger(kapasitasKg) ||
            kapasitasKg <= 0 ||
            !Number.isInteger(hargaVar) ||
            hargaVar < 0 ||
            !Number.isInteger(durasiMenit) ||
            durasiMenit <= 0
          ) {
            errors.varian =
              "Setiap varian wajib memiliki nama ukuran, kapasitas kg (> 0), harga (>= 0), dan durasi menit (> 0).";
            break;
          }

          normalizedVarian.push({
            nama_ukuran: namaUkuran,
            kapasitas_kg: kapasitasKg,
            harga: hargaVar,
            durasi_menit: durasiMenit,
          });
        }
        varian = normalizedVarian;
      }
    } catch {
      errors.varian = "Data varian ukuran tidak dapat dibaca.";
    }
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    data: {
      nama,
      kategori,
      harga: hargaParsed.value ?? 0,
      harga_coret: hargaCoretParsed.value,
      deskripsi,
      max_capacity_kg: capacityParsed.value ?? 7,
      cycle_duration_minutes: durationParsed.value ?? 40,
      stok: stokParsed.value ?? 10,
      urutan: urutanParsed.value ?? 0,
      badge: badgeRaw || null,
      foto_url: fotoUrlRaw || null,
      aktif,
      requires_washer,
      requires_dryer,
      galeri_foto,
      varian,
    },
  };
}

function cekMagicBytesGambar(bytes, mimeType) {
  if (bytes.length < 12) return false;

  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }

  if (mimeType === "image/webp") {
    const riff =
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const webp =
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    return riff && webp;
  }

  return false;
}

/**
 * Validasi file foto yang diunggah admin di sisi server (US-29).
 * Mengizinkan JPG, PNG, WebP dengan ukuran maksimal 2 MB.
 */
export async function validasiFileFotoProduk(file) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    return { valid: true, hasFile: false, buffer: null, ext: null, contentType: null };
  }

  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    return {
      valid: false,
      hasFile: true,
      error: "Format foto harus JPG, PNG, atau WebP.",
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      hasFile: true,
      error: "Ukuran foto maksimal 2 MB.",
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (!cekMagicBytesGambar(bytes, file.type)) {
    return {
      valid: false,
      hasFile: true,
      error: "Isi file tidak sesuai dengan format gambar JPG, PNG, atau WebP.",
    };
  }

  const extMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  return {
    valid: true,
    hasFile: true,
    buffer: Buffer.from(arrayBuffer),
    ext: extMap[file.type],
    contentType: file.type,
  };
}
