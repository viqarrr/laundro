import crypto from "node:crypto";

/**
 * Mengembalikan tanggal (YYYY-MM-DD) dan jam (HH:MM) saat ini di zona waktu Asia/Jakarta.
 */
export function getJakartaNow(dateObj = new Date()) {
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const dateStr = dateFormatter.format(dateObj);
  let timeStr = timeFormatter.format(dateObj);
  if (timeStr.startsWith("24:")) {
    timeStr = `00:${timeStr.slice(3)}`;
  }

  return {
    dateStr,
    timeStr,
    minutesFromMidnight: timeStrToMinutes(timeStr),
  };
}

export function getJakartaDateOffset(daysOffset = 0) {
  const target = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
  return getJakartaNow(target).dateStr;
}

export function timeStrToMinutes(timeStr) {
  const [hStr = "0", mStr = "0"] = String(timeStr || "00:00").split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function minutesToTimeStr(totalMinutes, withSeconds = false) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const hh = String(Math.floor(clamped / 60)).padStart(2, "0");
  const mm = String(clamped % 60).padStart(2, "0");
  return withSeconds ? `${hh}:${mm}:00` : `${hh}:${mm}`;
}

export function formatShortTime(timeStr) {
  return String(timeStr || "").slice(0, 5);
}

export function addMinutesToTimeStr(timeStr, minutesToAdd, withSeconds = true) {
  const baseMins = timeStrToMinutes(timeStr);
  const nextMins = baseMins + Number(minutesToAdd || 0);
  if (nextMins > 23 * 60 + 59) {
    return null;
  }
  return minutesToTimeStr(nextMins, withSeconds);
}

export function hitungNominalDP(totalHarga, pengaturan) {
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
 * Melepaskan kunci slot sementara (PENDING_LOCK) yang sudah melewati lock_expires_at.
 */
export async function releaseExpiredLocks(supabase) {
  try {
    const nowIso = new Date().toISOString();
    const { data: expiredBookings, error } = await supabase
      .from("bookings")
      .select("id")
      .eq("booking_status", "PENDING_LOCK")
      .lt("lock_expires_at", nowIso);

    if (error || !expiredBookings || expiredBookings.length === 0) {
      return 0;
    }

    const expiredIds = expiredBookings.map((b) => b.id);

    await supabase
      .from("machine_time_blocks")
      .delete()
      .in("booking_id", expiredIds)
      .eq("block_status", "LOCKED_TEMP");

    await supabase
      .from("bookings")
      .update({ booking_status: "EXPIRED" })
      .in("id", expiredIds)
      .eq("booking_status", "PENDING_LOCK");

    return expiredIds.length;
  } catch {
    return 0;
  }
}

/**
 * Validasi anti-overlap di tabel machine_time_blocks (start_time < endTime AND end_time > startTime).
 */
export async function cekBentrokSlot(
  supabase,
  machineId,
  blockDate,
  startTime,
  endTime,
  excludeBookingId = null
) {
  let query = supabase
    .from("machine_time_blocks")
    .select("id, booking_id, start_time, end_time, block_status")
    .eq("machine_id", Number(machineId))
    .eq("block_date", blockDate)
    .in("block_status", ["LOCKED_TEMP", "BOOKED", "RUNNING"])
    .lt("start_time", endTime)
    .gt("end_time", startTime);

  if (excludeBookingId !== null && excludeBookingId !== undefined) {
    query = query.neq("booking_id", Number(excludeBookingId));
  }

  const { data, error } = await query;
  if (error) {
    return { bentrok: true, blocks: [], error: true };
  }

  return {
    bentrok: Array.isArray(data) && data.length > 0,
    blocks: data || [],
    error: false,
  };
}

/**
 * Mencari kombinasi unit Washer dan/atau Dryer kosong secara otomatis dan berurutan.
 */
export async function cariSlotOtomatis({
  supabase,
  machines = [],
  blockDate,
  startTime,
  requiresWasher,
  requiresDryer,
  bufferMinutes = 5,
  minCapacityKg = 0,
  source = "ONLINE",
  preferredWasherId = null,
  preferredDryerId = null,
}) {
  const startTimeSec = `${formatShortTime(startTime)}:00`;
  const activeMachines = machines
    .filter((m) => {
      if (m.status !== "ACTIVE") return false;
      if (source === "ONLINE" && m.booking_mode === "WALK_IN_ONLY") return false;
      return true;
    })
    .sort((a, b) => {
      const aFit = a.max_capacity_kg >= minCapacityKg ? 0 : 1;
      const bFit = b.max_capacity_kg >= minCapacityKg ? 0 : 1;
      if (aFit !== bFit) return aFit - bFit;
      return String(a.machine_code).localeCompare(String(b.machine_code));
    });

  let selectedWasher = null;
  let washerStart = startTimeSec;
  let washerEnd = null;
  let nextStageStart = startTimeSec;

  if (requiresWasher) {
    const washers = activeMachines.filter((m) => m.type === "WASHER");
    const orderedWashers = preferredWasherId
      ? washers.filter((w) => w.id === Number(preferredWasherId))
      : washers;

    for (const w of orderedWashers) {
      const durasiTotal = Number(w.cycle_duration_minutes || 35) + Number(bufferMinutes || 0);
      const candidateEnd = addMinutesToTimeStr(startTimeSec, durasiTotal, true);
      if (!candidateEnd) continue;

      const { bentrok, error } = await cekBentrokSlot(
        supabase,
        w.id,
        blockDate,
        startTimeSec,
        candidateEnd
      );
      if (!error && !bentrok) {
        selectedWasher = w;
        washerEnd = candidateEnd;
        nextStageStart = candidateEnd;
        break;
      }
    }

    if (!selectedWasher) {
      return {
        ok: false,
        error: "Tidak ada unit Washer yang kosong pada jam tersebut. Silakan pilih jam lain.",
      };
    }
  }

  let selectedDryer = null;
  let dryerStart = nextStageStart;
  let dryerEnd = null;

  if (requiresDryer) {
    const dryers = activeMachines.filter((m) => m.type === "DRYER");
    const orderedDryers = preferredDryerId
      ? dryers.filter((d) => d.id === Number(preferredDryerId))
      : dryers;

    for (const d of orderedDryers) {
      const durasiTotal = Number(d.cycle_duration_minutes || 45) + Number(bufferMinutes || 0);
      const candidateEnd = addMinutesToTimeStr(dryerStart, durasiTotal, true);
      if (!candidateEnd) continue;

      const { bentrok, error } = await cekBentrokSlot(
        supabase,
        d.id,
        blockDate,
        dryerStart,
        candidateEnd
      );
      if (!error && !bentrok) {
        selectedDryer = d;
        dryerEnd = candidateEnd;
        break;
      }
    }

    if (!selectedDryer) {
      return {
        ok: false,
        error:
          "Tidak ada unit Dryer yang kosong untuk waktu lanjutan tersebut. Silakan pilih jam lain.",
      };
    }
  }

  return {
    ok: true,
    washer: selectedWasher,
    dryer: selectedDryer,
    washerStart: selectedWasher ? washerStart : null,
    washerEnd: selectedWasher ? washerEnd : null,
    dryerStart: selectedDryer ? dryerStart : null,
    dryerEnd: selectedDryer ? dryerEnd : null,
  };
}

/**
 * Menghasilkan kode booking unik dengan format LND-YYMMDD-XXX.
 */
export async function generateBookingCode(supabase) {
  const { dateStr } = getJakartaNow();
  const yymmdd = dateStr.replace(/-/g, "").slice(2);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const suffix = String(crypto.randomInt(1, 999)).padStart(3, "0");
    const code = `LND-${yymmdd}-${suffix}`;
    const { data } = await supabase
      .from("bookings")
      .select("id")
      .eq("booking_code", code)
      .maybeSingle();

    if (!data) {
      return code;
    }
  }

  const fallback = crypto.randomBytes(2).toString("hex").toUpperCase().slice(0, 3);
  return `LND-${yymmdd}-${fallback}`;
}
