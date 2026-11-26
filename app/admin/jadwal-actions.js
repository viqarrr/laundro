"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/session";
import { catatLogAdmin } from "@/lib/admin-log";
import { getPengaturanToko, normalisasiNomorWa } from "@/lib/pengaturan";
import {
  addMinutesToTimeStr,
  cariSlotOtomatis,
  cekBentrokSlot,
  formatShortTime,
  generateBookingCode,
  releaseExpiredLocks,
} from "@/lib/laundry-scheduler";

function revalidateJadwalPaths() {
  revalidatePath("/admin/jadwal");
  revalidatePath("/admin");
  revalidatePath("/antrean");
  revalidatePath("/");
}

export async function konfirmasiDpAction(bookingId) {
  let session;
  try {
    session = await requireAdmin({ mode: "throw" });
  } catch {
    return { ok: false, error: "Sesi admin tidak valid." };
  }

  if (!/^\d+$/.test(String(bookingId))) {
    return { ok: false, error: "ID booking tidak valid." };
  }
  const id = Number(bookingId);

  try {
    const { data: booking } = await session.supabase
      .from("bookings")
      .select("id, booking_code, booking_status")
      .eq("id", id)
      .maybeSingle();

    if (!booking) {
      return { ok: false, error: "Data booking tidak ditemukan." };
    }

    const { error: errBooking } = await session.supabase
      .from("bookings")
      .update({
        booking_status: "CONFIRMED",
        payment_status: "DP_PAID",
      })
      .eq("id", id);

    if (errBooking) {
      return { ok: false, error: "Gagal mengonfirmasi DP booking." };
    }

    await session.supabase
      .from("machine_time_blocks")
      .update({ block_status: "BOOKED" })
      .eq("booking_id", id);

    await catatLogAdmin({
      supabase: session.supabase,
      adminEmail: session.user.email,
      aksi: "KONFIRMASI_DP",
      entitas: "bookings",
      entitasId: booking.booking_code || id,
      detail: { booking_id: id },
    });

    revalidateJadwalPaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat mengonfirmasi DP." };
  }
}

export async function perpanjangTimerAction(bookingId) {
  let session;
  try {
    session = await requireAdmin({ mode: "throw" });
  } catch {
    return { ok: false, error: "Sesi admin tidak valid." };
  }

  if (!/^\d+$/.test(String(bookingId))) {
    return { ok: false, error: "ID booking tidak valid." };
  }
  const id = Number(bookingId);

  try {
    const { data: booking } = await session.supabase
      .from("bookings")
      .select("id, booking_code, booking_status, lock_expires_at")
      .eq("id", id)
      .maybeSingle();

    if (!booking || booking.booking_status !== "PENDING_LOCK") {
      return { ok: false, error: "Timer hanya dapat diperpanjang untuk antrean PENDING_LOCK." };
    }

    const baseTime = booking.lock_expires_at
      ? Math.max(Date.now(), new Date(booking.lock_expires_at).getTime())
      : Date.now();
    const nextExpires = new Date(baseTime + 10 * 60 * 1000).toISOString();

    const { error } = await session.supabase
      .from("bookings")
      .update({ lock_expires_at: nextExpires })
      .eq("id", id);

    if (error) {
      return { ok: false, error: "Gagal memperpanjang timer kunci slot." };
    }

    await catatLogAdmin({
      supabase: session.supabase,
      adminEmail: session.user.email,
      aksi: "PERPANJANG_TIMER",
      entitas: "bookings",
      entitasId: booking.booking_code || id,
      detail: { tambahan_menit: 10 },
    });

    revalidateJadwalPaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat memperpanjang timer." };
  }
}

export async function kontrolSiklusAction(bookingId, aksi) {
  let session;
  try {
    session = await requireAdmin({ mode: "throw" });
  } catch {
    return { ok: false, error: "Sesi admin tidak valid." };
  }

  if (!/^\d+$/.test(String(bookingId)) || (aksi !== "MULAI" && aksi !== "SELESAI")) {
    return { ok: false, error: "Permintaan kontrol siklus tidak valid." };
  }
  const id = Number(bookingId);

  try {
    const nextBookingStatus = aksi === "MULAI" ? "IN_PROGRESS" : "COMPLETED";
    const nextBlockStatus = aksi === "MULAI" ? "RUNNING" : "DONE";
    const extraUpdate = aksi === "SELESAI" ? { payment_status: "PAID" } : {};

    const { error: errBooking } = await session.supabase
      .from("bookings")
      .update({ booking_status: nextBookingStatus, ...extraUpdate })
      .eq("id", id);

    if (errBooking) {
      return { ok: false, error: "Gagal memperbarui status siklus booking." };
    }

    await session.supabase
      .from("machine_time_blocks")
      .update({ block_status: nextBlockStatus })
      .eq("booking_id", id);

    await catatLogAdmin({
      supabase: session.supabase,
      adminEmail: session.user.email,
      aksi: aksi === "MULAI" ? "MULAI_MESIN" : "SELESAI_SIKLUS",
      entitas: "bookings",
      entitasId: id,
    });

    revalidateJadwalPaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat memperbarui status siklus." };
  }
}

export async function batalkanBookingAction(bookingId) {
  let session;
  try {
    session = await requireAdmin({ mode: "throw" });
  } catch {
    return { ok: false, error: "Sesi admin tidak valid." };
  }

  if (!/^\d+$/.test(String(bookingId))) {
    return { ok: false, error: "ID booking tidak valid." };
  }
  const id = Number(bookingId);

  try {
    await session.supabase.from("machine_time_blocks").delete().eq("booking_id", id);
    const { error } = await session.supabase
      .from("bookings")
      .update({ booking_status: "CANCELLED" })
      .eq("id", id);

    if (error) {
      return { ok: false, error: "Gagal membatalkan booking." };
    }

    await catatLogAdmin({
      supabase: session.supabase,
      adminEmail: session.user.email,
      aksi: "BATALKAN_BOOKING",
      entitas: "bookings",
      entitasId: id,
    });

    revalidateJadwalPaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat membatalkan booking." };
  }
}

export async function quickWalkInAction({
  machineId,
  blockDate,
  startTime,
  productId,
  customerName = "Pelanggan Walk-in",
  customerPhone = "628000000000",
}) {
  let session;
  try {
    session = await requireAdmin({ mode: "throw" });
  } catch {
    return { ok: false, error: "Sesi admin tidak valid." };
  }

  if (!/^\d+$/.test(String(machineId)) || !/^\d+$/.test(String(productId))) {
    return { ok: false, error: "Unit mesin dan paket layanan wajib dipilih." };
  }

  try {
    await releaseExpiredLocks(session.supabase);

    const [machineRes, allMachinesRes, produkRes, pengaturan] = await Promise.all([
      session.supabase
        .from("machines")
        .select("id, machine_code, name, type, max_capacity_kg, cycle_duration_minutes, status")
        .eq("id", Number(machineId))
        .maybeSingle(),
      session.supabase
        .from("machines")
        .select("id, machine_code, name, type, max_capacity_kg, cycle_duration_minutes, booking_mode, status"),
      session.supabase
        .from("produk")
        .select("id, nama, harga, requires_washer, requires_dryer")
        .eq("id", Number(productId))
        .maybeSingle(),
      getPengaturanToko(),
    ]);

    const selectedMachine = machineRes.data;
    const produk = produkRes.data;
    if (!selectedMachine || selectedMachine.status !== "ACTIVE") {
      return { ok: false, error: "Mesin tidak aktif atau sedang maintenance." };
    }
    if (!produk) {
      return { ok: false, error: "Paket layanan tidak ditemukan." };
    }

    const bufferMinutes = Number(pengaturan.buffer_minutes ?? 5);
    const requiresWasher =
      selectedMachine.type === "WASHER" ? true : Boolean(produk.requires_washer);
    const requiresDryer =
      selectedMachine.type === "DRYER" ? true : Boolean(produk.requires_dryer);

    const slotResult = await cariSlotOtomatis({
      supabase: session.supabase,
      machines: allMachinesRes.data || [],
      blockDate,
      startTime,
      requiresWasher: selectedMachine.type === "WASHER" ? true : false,
      requiresDryer: selectedMachine.type === "DRYER" ? true : requiresDryer,
      bufferMinutes,
      source: "WALK_IN",
      preferredWasherId: selectedMachine.type === "WASHER" ? selectedMachine.id : null,
      preferredDryerId: selectedMachine.type === "DRYER" ? selectedMachine.id : null,
    });

    if (!slotResult.ok) {
      return { ok: false, error: slotResult.error };
    }

    const cleanName = String(customerName || "Pelanggan Walk-in").trim().slice(0, 80) || "Pelanggan Walk-in";
    const cleanPhone = normalisasiNomorWa(customerPhone || "628000000000");
    const bookingCode = await generateBookingCode(session.supabase);

    const { data: bookingRow, error: bookingErr } = await session.supabase
      .from("bookings")
      .insert({
        booking_code: bookingCode,
        service_product_id: produk.id,
        source: "WALK_IN",
        customer_name: cleanName,
        customer_phone: cleanPhone,
        estimated_weight_kg: selectedMachine.max_capacity_kg || 7,
        total_estimated_price: produk.harga || 0,
        total_final_price: produk.harga || 0,
        dp_amount: produk.harga || 0,
        payment_status: "PAID",
        booking_status: "IN_PROGRESS",
        created_by: session.user.email,
      })
      .select("id, booking_code")
      .single();

    if (bookingErr || !bookingRow) {
      return { ok: false, error: "Gagal mencatat pesanan walk-in." };
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
        block_status: "RUNNING",
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
        block_status: "RUNNING",
      });
    }

    const { error: blockErr } = await session.supabase
      .from("machine_time_blocks")
      .insert(blocksToInsert);

    if (blockErr) {
      await session.supabase.from("bookings").delete().eq("id", bookingRow.id);
      return { ok: false, error: "Gagal mengunci blok waktu mesin untuk walk-in." };
    }

    await catatLogAdmin({
      supabase: session.supabase,
      adminEmail: session.user.email,
      aksi: "QUICK_WALK_IN",
      entitas: "bookings",
      entitasId: bookingRow.booking_code,
      detail: {
        machine: selectedMachine.machine_code,
        jam: formatShortTime(startTime),
        layanan: produk.nama,
        requires_washer: requiresWasher,
      },
    });

    revalidateJadwalPaths();
    return { ok: true, bookingCode: bookingRow.booking_code };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat menyimpan quick walk-in." };
  }
}

export async function pindahAtauGeserBlokAction({
  blockId,
  targetMachineId,
  targetStartTime,
  targetDate,
}) {
  let session;
  try {
    session = await requireAdmin({ mode: "throw" });
  } catch {
    return { ok: false, error: "Sesi admin tidak valid." };
  }

  if (!/^\d+$/.test(String(blockId)) || !/^\d+$/.test(String(targetMachineId))) {
    return { ok: false, error: "Data blok atau mesin tujuan tidak valid." };
  }

  if (!/^\d{2}:\d{2}/.test(String(targetStartTime || ""))) {
    return { ok: false, error: "Format jam tujuan tidak valid." };
  }

  try {
    await releaseExpiredLocks(session.supabase);

    const [blockRes, targetMachineRes, pengaturan] = await Promise.all([
      session.supabase
        .from("machine_time_blocks")
        .select("id, booking_id, machine_id, block_date, start_time, end_time, stage")
        .eq("id", Number(blockId))
        .maybeSingle(),
      session.supabase
        .from("machines")
        .select("id, machine_code, name, type, cycle_duration_minutes, status")
        .eq("id", Number(targetMachineId))
        .maybeSingle(),
      getPengaturanToko(),
    ]);

    const currentBlock = blockRes.data;
    const targetMachine = targetMachineRes.data;
    if (!currentBlock) {
      return { ok: false, error: "Blok jadwal tidak ditemukan." };
    }
    if (!targetMachine || targetMachine.status !== "ACTIVE") {
      return { ok: false, error: "Mesin tujuan tidak aktif atau sedang maintenance." };
    }

    const expectedType = currentBlock.stage === "WASHING" ? "WASHER" : "DRYER";
    if (targetMachine.type !== expectedType) {
      return { ok: false, error: `Blok ${currentBlock.stage} harus dipindah ke mesin ${expectedType}.` };
    }

    const nextDate = targetDate || currentBlock.block_date;
    const nextStart = `${formatShortTime(targetStartTime)}:00`;
    const durasiTotal =
      Number(targetMachine.cycle_duration_minutes || 40) + Number(pengaturan.buffer_minutes ?? 5);
    const nextEnd = addMinutesToTimeStr(nextStart, durasiTotal, true);

    if (!nextEnd) {
      return { ok: false, error: "Jam tujuan melewati batas akhir hari." };
    }

    const { bentrok } = await cekBentrokSlot(
      session.supabase,
      targetMachine.id,
      nextDate,
      nextStart,
      nextEnd,
      currentBlock.booking_id
    );

    if (bentrok) {
      return {
        ok: false,
        error: `Slot pada ${targetMachine.name} jam ${formatShortTime(nextStart)}-${formatShortTime(nextEnd)} bentrok dengan jadwal lain.`,
      };
    }

    const { error } = await session.supabase
      .from("machine_time_blocks")
      .update({
        machine_id: targetMachine.id,
        block_date: nextDate,
        start_time: nextStart,
        end_time: nextEnd,
      })
      .eq("id", currentBlock.id);

    if (error) {
      return { ok: false, error: "Gagal memindahkan atau menggeser blok jadwal." };
    }

    await catatLogAdmin({
      supabase: session.supabase,
      adminEmail: session.user.email,
      aksi: "PINDAH_GESER_JADWAL",
      entitas: "machine_time_blocks",
      entitasId: currentBlock.id,
      detail: {
        mesin_tujuan: targetMachine.machine_code,
        tanggal: nextDate,
        jam: formatShortTime(nextStart),
      },
    });

    revalidateJadwalPaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat memindahkan blok jadwal." };
  }
}

export async function toggleMaintenanceMesinAction(machineId, nextStatus) {
  let session;
  try {
    session = await requireAdmin({ mode: "throw" });
  } catch {
    return { ok: false, error: "Sesi admin tidak valid." };
  }

  if (!/^\d+$/.test(String(machineId)) || (nextStatus !== "ACTIVE" && nextStatus !== "MAINTENANCE")) {
    return { ok: false, error: "Permintaan status mesin tidak valid." };
  }

  try {
    const { data: machine, error } = await session.supabase
      .from("machines")
      .update({ status: nextStatus })
      .eq("id", Number(machineId))
      .select("id, machine_code, name")
      .maybeSingle();

    if (error || !machine) {
      return { ok: false, error: "Gagal mengubah status mesin." };
    }

    await catatLogAdmin({
      supabase: session.supabase,
      adminEmail: session.user.email,
      aksi: "UBAH_STATUS_MESIN",
      entitas: "machines",
      entitasId: machine.machine_code,
      detail: { nama: machine.name, status: nextStatus },
    });

    revalidateJadwalPaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat mengubah status mesin." };
  }
}
