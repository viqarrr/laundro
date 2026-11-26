"use server";

import { revalidatePath } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getPengaturanToko, normalisasiNomorWa } from "@/lib/pengaturan";
import {
  cariSlotOtomatis,
  formatShortTime,
  generateBookingCode,
  getJakartaDateOffset,
  getJakartaNow,
  hitungNominalDP,
  releaseExpiredLocks,
  timeStrToMinutes,
} from "@/lib/laundry-scheduler";

export async function buatReservasiAction(_prevState, formData) {
  try {
    const clientIp = await getClientIp();
    const ipLimit = checkRateLimit({
      key: `booking-ip:${clientIp}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
      consume: true,
    });

    if (!ipLimit.allowed) {
      return {
        ok: false,
        error: `Terlalu banyak permintaan reservasi. Silakan tunggu ${ipLimit.retryAfterMinutes} menit sebelum mencoba lagi.`,
      };
    }

    const serviceProductIdRaw = String(formData.get("service_product_id") || "").trim();
    const blockDate = String(formData.get("block_date") || "").trim();
    const startTimeRaw = String(formData.get("start_time") || "").trim();
    const beratRaw = String(formData.get("estimated_weight_kg") || "").trim();
    const washerSelect = String(formData.get("washer_machine_id") || "AUTO").trim();
    const dryerSelect = String(formData.get("dryer_machine_id") || "AUTO").trim();
    const customerName = String(formData.get("customer_name") || "").trim();
    const customerPhoneRaw = String(formData.get("customer_phone") || "").trim();
    const notes = String(formData.get("notes") || "").trim().slice(0, 300);

    const errors = {};
    if (!/^\d+$/.test(serviceProductIdRaw)) {
      errors.service_product_id = "Pilih paket layanan terlebih dahulu.";
    }

    const beratKg = Number(beratRaw);
    if (!Number.isFinite(beratKg) || beratKg <= 0 || beratKg > 100) {
      errors.estimated_weight_kg = "Estimasi berat harus antara 1 hingga 100 kg.";
    }

    const todayStr = getJakartaDateOffset(0);
    const maxDateStr = getJakartaDateOffset(7);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(blockDate) || blockDate < todayStr || blockDate > maxDateStr) {
      errors.block_date = "Tanggal reservasi harus antara hari ini hingga 7 hari ke depan.";
    }

    if (!/^\d{2}:\d{2}$/.test(startTimeRaw)) {
      errors.start_time = "Pilih jam kedatangan yang valid.";
    }

    if (customerName.length < 2 || customerName.length > 80) {
      errors.customer_name = "Nama pemesan wajib diisi (2 hingga 80 karakter).";
    }

    const customerPhone = normalisasiNomorWa(customerPhoneRaw);
    if (!customerPhoneRaw || !/^\d{9,16}$/.test(customerPhone)) {
      errors.customer_phone = "Nomor WhatsApp aktif wajib diisi (9 hingga 16 digit).";
    }

    if (Object.keys(errors).length > 0) {
      return {
        ok: false,
        error: "Periksa kembali data reservasi Anda.",
        errors,
      };
    }

    const supabase = createSupabasePublicClient();
    await releaseExpiredLocks(supabase);

    // K-12: Maksimal 2 booking PENDING_LOCK aktif per nomor WhatsApp
    const nowIso = new Date().toISOString();
    const { count: activeLockCount } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("customer_phone", customerPhone)
      .eq("booking_status", "PENDING_LOCK")
      .gt("lock_expires_at", nowIso);

    if ((activeLockCount ?? 0) >= 2) {
      return {
        ok: false,
        error:
          "Nomor WhatsApp ini masih memiliki 2 pesanan menunggu konfirmasi DP. Selesaikan pembayaran atau tunggu kunci slot 15 menit berakhir.",
      };
    }

    const [produkRes, machinesRes, pengaturan] = await Promise.all([
      supabase
        .from("produk")
        .select(
          "id, nama, harga, max_capacity_kg, cycle_duration_minutes, requires_washer, requires_dryer, stok, aktif"
        )
        .eq("id", Number(serviceProductIdRaw))
        .eq("aktif", true)
        .maybeSingle(),
      supabase
        .from("machines")
        .select("id, machine_code, name, type, max_capacity_kg, cycle_duration_minutes, booking_mode, status"),
      getPengaturanToko(),
    ]);

    const produk = produkRes.data;
    if (produkRes.error || !produk) {
      return { ok: false, error: "Paket layanan tidak ditemukan atau sedang nonaktif." };
    }

    if (!produk.requires_washer && !produk.requires_dryer) {
      return {
        ok: false,
        error: "Paket ini adalah add-on tanpa pemakaian mesin. Silakan pesan langsung via keranjang.",
      };
    }

    // Validasi jam operasional
    const jamBukaMin = timeStrToMinutes(pengaturan.jam_buka || "07:00");
    const jamTutupMin = timeStrToMinutes(pengaturan.jam_tutup || "22:00");
    const chosenMin = timeStrToMinutes(startTimeRaw);
    const nowJakarta = getJakartaNow();

    if (chosenMin < jamBukaMin || chosenMin >= jamTutupMin) {
      return {
        ok: false,
        error: `Jam kedatangan harus dalam jam operasional gerai (${pengaturan.jam_buka} - ${pengaturan.jam_tutup}).`,
      };
    }

    if (blockDate === todayStr && chosenMin < nowJakarta.minutesFromMidnight - 5) {
      return {
        ok: false,
        error: "Jam kedatangan yang dipilih sudah terlewat. Silakan pilih slot waktu berikutnya.",
      };
    }

    const slotResult = await cariSlotOtomatis({
      supabase,
      machines: machinesRes.data || [],
      blockDate,
      startTime: startTimeRaw,
      requiresWasher: Boolean(produk.requires_washer),
      requiresDryer: Boolean(produk.requires_dryer),
      bufferMinutes: Number(pengaturan.buffer_minutes ?? 5),
      minCapacityKg: beratKg,
      source: "ONLINE",
      preferredWasherId: washerSelect !== "AUTO" ? Number(washerSelect) : null,
      preferredDryerId: dryerSelect !== "AUTO" ? Number(dryerSelect) : null,
    });

    if (!slotResult.ok) {
      return { ok: false, error: slotResult.error };
    }

    const unitCap =
      slotResult.washer?.max_capacity_kg ||
      slotResult.dryer?.max_capacity_kg ||
      produk.max_capacity_kg ||
      7;
    const jumlahTabung = Math.max(1, Math.ceil(beratKg / unitCap));
    const totalEstimatedPrice = Number(produk.harga || 0) * jumlahTabung;
    const dpAmount = hitungNominalDP(totalEstimatedPrice, pengaturan);
    const lockExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const bookingCode = await generateBookingCode(supabase);

    const { data: bookingRow, error: insertBookingErr } = await supabase
      .from("bookings")
      .insert({
        booking_code: bookingCode,
        service_product_id: produk.id,
        source: "ONLINE",
        customer_name: customerName,
        customer_phone: customerPhone,
        estimated_weight_kg: beratKg,
        total_estimated_price: totalEstimatedPrice,
        dp_amount: dpAmount,
        payment_status: "PENDING_DP",
        booking_status: "PENDING_LOCK",
        lock_expires_at: lockExpiresAt,
        notes: notes || null,
      })
      .select("id, booking_code, lock_expires_at")
      .single();

    if (insertBookingErr || !bookingRow) {
      return { ok: false, error: "Gagal membuat reservasi antrean. Silakan coba lagi." };
    }

    const blocksToInsert = [];
    if (slotResult.washer) {
      blocksToInsert.push({
        booking_id: bookingRow.id,
        machine_id: slotResult.washer.id,
        block_date: blockDate,
        start_time: slotResult.washerStart,
        end_time: slotResult.washerEnd,
        stage: "WASHING",
        block_status: "LOCKED_TEMP",
      });
    }
    if (slotResult.dryer) {
      blocksToInsert.push({
        booking_id: bookingRow.id,
        machine_id: slotResult.dryer.id,
        block_date: blockDate,
        start_time: slotResult.dryerStart,
        end_time: slotResult.dryerEnd,
        stage: "DRYING",
        block_status: "LOCKED_TEMP",
      });
    }

    const { error: insertBlocksErr } = await supabase
      .from("machine_time_blocks")
      .insert(blocksToInsert);

    if (insertBlocksErr) {
      await supabase.from("bookings").delete().eq("id", bookingRow.id);
      return { ok: false, error: "Gagal mengunci blok waktu mesin. Silakan pilih ulang slot." };
    }

    revalidatePath("/antrean");
    revalidatePath("/admin/jadwal");
    revalidatePath("/admin");

    return {
      ok: true,
      booking: {
        booking_code: bookingRow.booking_code,
        customer_name: customerName,
        customer_phone: customerPhone,
        service_name: produk.nama,
        estimated_weight_kg: beratKg,
        jumlah_tabung: jumlahTabung,
        total_estimated_price: totalEstimatedPrice,
        dp_amount: dpAmount,
        lock_expires_at: bookingRow.lock_expires_at,
        block_date: blockDate,
        washer_label: slotResult.washer
          ? `${slotResult.washer.name} (${formatShortTime(slotResult.washerStart)}-${formatShortTime(slotResult.washerEnd)})`
          : null,
        dryer_label: slotResult.dryer
          ? `${slotResult.dryer.name} (${formatShortTime(slotResult.dryerStart)}-${formatShortTime(slotResult.dryerEnd)})`
          : null,
        nama_gerai: pengaturan.nama_gerai,
        nomor_wa_gerai: normalisasiNomorWa(pengaturan.nomor_wa),
        info_rekening: pengaturan.info_rekening,
      },
    };
  } catch {
    return { ok: false, error: "Terjadi gangguan saat memproses reservasi antrean." };
  }
}

export async function cekStatusBookingAction(_prevState, formData) {
  const keywordRaw = String(formData.get("keyword") || "").trim();
  if (!keywordRaw) {
    return { ok: false, error: "Masukkan Kode Booking atau Nomor WhatsApp terlebih dahulu." };
  }

  try {
    const supabase = createSupabasePublicClient();
    await releaseExpiredLocks(supabase);

    const upperCode = keywordRaw.toUpperCase();
    const isCodeSearch = upperCode.startsWith("LND-");

    let query = supabase
      .from("bookings")
      .select(
        "id, booking_code, customer_name, estimated_weight_kg, total_estimated_price, dp_amount, payment_status, booking_status, lock_expires_at, created_at, produk(nama), machine_time_blocks(block_date, start_time, end_time, stage, block_status, machines(machine_code, name))"
      )
      .order("created_at", { ascending: false })
      .limit(5);

    if (isCodeSearch) {
      query = query.eq("booking_code", upperCode);
    } else {
      const normalizedPhone = normalisasiNomorWa(keywordRaw);
      if (!/^\d{8,16}$/.test(normalizedPhone)) {
        return {
          ok: false,
          error: "Masukkan Kode Booking (mis. LND-261126-001) atau Nomor WhatsApp yang valid.",
        };
      }
      query = query.eq("customer_phone", normalizedPhone);
    }

    const { data, error } = await query;
    if (error) {
      return { ok: false, error: "Gagal mencari status antrean." };
    }

    return {
      ok: true,
      results: data || [],
      searched: keywordRaw,
    };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat mengecek status antrean." };
  }
}
