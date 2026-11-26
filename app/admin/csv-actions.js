"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/supabase/session";
import { catatLogAdmin } from "@/lib/admin-log";
import { validasiInputProduk } from "@/lib/validators/produk";

const MAX_CSV_BYTES = 2 * 1024 * 1024;
const MAX_CSV_ROWS = 200;

function parseCsvRows(text) {
  const cleanText = String(text || "").replace(/^\uFEFF/, "");
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i += 1) {
    const ch = cleanText[i];
    const next = cleanText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      currentRow.push(currentField);
      currentField = "";
    } else if (ch === "\r" && next === "\n") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      i += 1;
    } else if (ch === "\n" || ch === "\r") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
    } else {
      currentField += ch;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((r) => r.some((cell) => String(cell || "").trim() !== ""));
}

function toBooleanOnOff(raw, defaultBool = false) {
  const val = String(raw ?? "").trim().toLowerCase();
  if (!val) return defaultBool ? "on" : "false";
  return ["true", "1", "ya", "yes", "on", "aktif"].includes(val) ? "on" : "false";
}

export async function imporProdukCsvAction(_prevState, formData) {
  let session;
  try {
    session = await requireSuperAdmin({ mode: "throw" });
  } catch {
    return { ok: false, error: "Akses ditolak: fitur ini khusus untuk Superadmin." };
  }

  try {
    const file = formData.get("csv_file");
    if (!file || typeof file.text !== "function" || file.size === 0) {
      return { ok: false, error: "Pilih file .csv terlebih dahulu." };
    }

    if (file.size > MAX_CSV_BYTES) {
      return { ok: false, error: "Ukuran file CSV maksimal 2 MB." };
    }

    const fileName = String(file.name || "").toLowerCase();
    if (fileName && !fileName.endsWith(".csv")) {
      return { ok: false, error: "Format file harus berekstensi .csv." };
    }

    const rawText = await file.text();
    const parsedRows = parseCsvRows(rawText);

    if (parsedRows.length < 2) {
      return {
        ok: false,
        error: "File CSV harus memiliki baris header dan minimal 1 baris data.",
      };
    }

    const headers = parsedRows[0].map((h) => String(h || "").trim().toLowerCase());
    const requiredCols = ["nama", "kategori", "harga", "deskripsi"];
    const missingCols = requiredCols.filter((c) => !headers.includes(c));
    if (missingCols.length > 0) {
      return {
        ok: false,
        error: `Header CSV kurang kolom wajib: ${missingCols.join(", ")}.`,
      };
    }

    const dataRows = parsedRows.slice(1, 1 + MAX_CSV_ROWS);
    const validRecords = [];
    const gagalList = [];

    dataRows.forEach((cells, idx) => {
      const barisKe = idx + 2;
      const rowObj = {};
      headers.forEach((key, colIdx) => {
        rowObj[key] = cells[colIdx] ?? "";
      });

      const fd = new FormData();
      fd.set("nama", String(rowObj.nama || ""));
      fd.set("kategori", String(rowObj.kategori || ""));
      fd.set("harga", String(rowObj.harga || ""));
      fd.set("harga_coret", String(rowObj.harga_coret || ""));
      fd.set("badge", String(rowObj.badge || ""));
      fd.set("deskripsi", String(rowObj.deskripsi || ""));
      fd.set("max_capacity_kg", String(rowObj.max_capacity_kg || "7"));
      fd.set("cycle_duration_minutes", String(rowObj.cycle_duration_minutes || "40"));
      fd.set("stok", String(rowObj.stok || "10"));
      fd.set("urutan", String(rowObj.urutan || "0"));
      fd.set("foto_url", String(rowObj.foto_url || "/images/hero-machines.jpg"));
      fd.set("aktif", toBooleanOnOff(rowObj.aktif, true));
      fd.set("requires_washer", toBooleanOnOff(rowObj.requires_washer, false));
      fd.set("requires_dryer", toBooleanOnOff(rowObj.requires_dryer, false));

      const { valid, data, errors } = validasiInputProduk(fd);
      if (!valid) {
        gagalList.push({
          baris: barisKe,
          nama: String(rowObj.nama || "-"),
          alasan: Object.values(errors).join("; "),
        });
        return;
      }

      validRecords.push({ baris: barisKe, payload: { ...data, foto_url: data.foto_url || "/images/hero-machines.jpg" } });
    });

    let berhasilCount = 0;

    if (validRecords.length > 0) {
      const { error: batchError } = await session.supabase
        .from("produk")
        .insert(validRecords.map((r) => r.payload));

      if (!batchError) {
        berhasilCount = validRecords.length;
      } else {
        // Fallback per-baris agar baris valid lainnya tetap tersimpan
        for (const rec of validRecords) {
          const { error: singleErr } = await session.supabase.from("produk").insert(rec.payload);
          if (singleErr) {
            gagalList.push({
              baris: rec.baris,
              nama: rec.payload.nama,
              alasan: "Gagal menyimpan baris ke database.",
            });
          } else {
            berhasilCount += 1;
          }
        }
      }
    }

    await catatLogAdmin({
      supabase: session.supabase,
      adminEmail: session.user.email,
      aksi: "IMPOR_CSV_PRODUK",
      entitas: "produk",
      detail: { berhasil: berhasilCount, gagal: gagalList.length },
    });

    revalidatePath("/admin");
    revalidatePath("/");

    return {
      ok: true,
      berhasilCount,
      gagalList,
    };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat memproses file CSV." };
  }
}
