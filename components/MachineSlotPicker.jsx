"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import CustomSelect from "@/components/CustomSelect";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { buatReservasiAction } from "@/app/antrean/actions";
import { formatRupiah } from "@/lib/format";
import { catatKlikWa } from "@/lib/wa-tracking";

function toMinutes(timeStr) {
  const [h = "0", m = "0"] = String(timeStr || "00:00").split(":");
  return Number(h) * 60 + Number(m);
}

function toTimeStr(mins) {
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function hitungDpClient(totalHarga, pengaturan) {
  if (totalHarga <= 0) return 0;
  if (pengaturan?.dp_type === "PERCENTAGE") {
    const p = Math.min(100, Math.max(0, Number(pengaturan.dp_value ?? 50)));
    return Math.round((totalHarga * p) / 100);
  }
  return Math.min(totalHarga, Math.max(0, Number(pengaturan?.dp_value ?? 15000)));
}

function cekMesinKosong(machine, date, startStr, durationPlusBuffer, blocks) {
  if (machine.status !== "ACTIVE" || machine.booking_mode === "WALK_IN_ONLY") return false;
  const reqStart = toMinutes(startStr);
  const reqEnd = reqStart + durationPlusBuffer;
  if (reqEnd > 23 * 60 + 59) return false;

  return !blocks.some((b) => {
    if (b.machine_id !== machine.id || b.block_date !== date) return false;
    if (!["LOCKED_TEMP", "BOOKED", "RUNNING"].includes(b.block_status)) return false;
    const bStart = toMinutes(String(b.start_time || "").slice(0, 5));
    const bEnd = toMinutes(String(b.end_time || "").slice(0, 5));
    return bStart < reqEnd && bEnd > reqStart;
  });
}

export default function MachineSlotPicker({
  daftarLayanan = [],
  machines = [],
  blocks = [],
  pengaturan,
  todayStr,
  tomorrowStr,
  currentTimeStr,
}) {
  const layananMesin = useMemo(
    () => daftarLayanan.filter((p) => p.requires_washer || p.requires_dryer),
    [daftarLayanan]
  );

  const [state, formAction, isPending] = useActionState(buatReservasiAction, null);

  const [selectedProductId, setSelectedProductId] = useState(
    layananMesin[0] ? String(layananMesin[0].id) : ""
  );
  const [beratKg, setBeratKg] = useState(7);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Bangkitkan daftar slot per 30 menit sesuai jam operasional
  const timeSlots = useMemo(() => {
    const openMin = toMinutes(pengaturan?.jam_buka || "07:00");
    const closeMin = toMinutes(pengaturan?.jam_tutup || "22:00");
    const nowMin = toMinutes(currentTimeStr);
    const list = [];

    for (let m = openMin; m <= closeMin - 60; m += 30) {
      if (selectedDate === todayStr && m < nowMin) {
        continue;
      }
      list.push(toTimeStr(m));
    }
    return list;
  }, [pengaturan?.jam_buka, pengaturan?.jam_tutup, selectedDate, todayStr, currentTimeStr]);

  const [selectedTime, setSelectedTime] = useState(timeSlots[0] || "09:00");
  const [washerChoice, setWasherChoice] = useState("AUTO");
  const [dryerChoice, setDryerChoice] = useState("AUTO");
  const [sisaDetik, setSisaDetik] = useState(0);

  useEffect(() => {
    if (timeSlots.length > 0 && !timeSlots.includes(selectedTime)) {
      setSelectedTime(timeSlots[0]);
    }
  }, [timeSlots, selectedTime]);

  useEffect(() => {
    if (!state?.ok || !state.booking?.lock_expires_at) return;

    const updateTimer = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(state.booking.lock_expires_at).getTime() - Date.now()) / 1000)
      );
      setSisaDetik(diff);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [state]);

  const selectedProduct = layananMesin.find((p) => String(p.id) === selectedProductId) || null;
  const bufferMinutes = Number(pengaturan?.buffer_minutes ?? 5);

  const washerOptions = useMemo(() => {
    const base = [{ value: "AUTO", label: "Pilih Otomatis Washer Kosong" }];
    const items = machines
      .filter((m) => m.type === "WASHER")
      .map((m) => {
        const dur = Number(m.cycle_duration_minutes || 35) + bufferMinutes;
        const bebas = cekMesinKosong(m, selectedDate, selectedTime, dur, blocks);
        return {
          value: String(m.id),
          label: `${m.name} (${bebas ? "Kosong" : "Terpakai / Maintenance"})`,
        };
      });
    return [...base, ...items];
  }, [machines, selectedDate, selectedTime, bufferMinutes, blocks]);

  const dryerOptions = useMemo(() => {
    const base = [{ value: "AUTO", label: "Pilih Otomatis Dryer Kosong" }];
    const startOffset = selectedProduct?.requires_washer ? 35 + bufferMinutes : 0;
    const dryerStartStr = toTimeStr(toMinutes(selectedTime) + startOffset);

    const items = machines
      .filter((m) => m.type === "DRYER")
      .map((m) => {
        const dur = Number(m.cycle_duration_minutes || 45) + bufferMinutes;
        const bebas = cekMesinKosong(m, selectedDate, dryerStartStr, dur, blocks);
        return {
          value: String(m.id),
          label: `${m.name} (${bebas ? "Kosong" : "Terpakai / Maintenance"})`,
        };
      });
    return [...base, ...items];
  }, [machines, selectedDate, selectedTime, bufferMinutes, blocks, selectedProduct]);

  const capKg = Number(selectedProduct?.max_capacity_kg || 7);
  const jumlahTabung = Math.max(1, Math.ceil(Math.max(1, Number(beratKg || 1)) / capKg));
  const estimasiTotal = Number(selectedProduct?.harga || 0) * jumlahTabung;
  const estimasiDp = hitungDpClient(estimasiTotal, pengaturan);

  // Panel Konfirmasi DP setelah submit sukses
  if (state?.ok && state.booking) {
    const b = state.booking;
    const menit = String(Math.floor(sisaDetik / 60)).padStart(2, "0");
    const detik = String(sisaDetik % 60).padStart(2, "0");
    const jadwalMesin = [b.washer_label, b.dryer_label].filter(Boolean).join(" & ");

    const pesanDpWa = [
      `Halo Admin ${b.nama_gerai}, saya ingin konfirmasi DP pesanan Laundry:`,
      `Kode Booking: ${b.booking_code}`,
      `Nama: ${b.customer_name}`,
      `Jadwal & Mesin: ${b.block_date}, ${jadwalMesin}`,
      `Layanan: ${b.service_name} (Est. ${b.estimated_weight_kg} kg)`,
      `Nominal DP: ${formatRupiah(b.dp_amount)}`,
      `Berikut saya lampirkan bukti transfernya.`,
    ].join("\n");

    const waUrl = `https://wa.me/${b.nomor_wa_gerai}?text=${encodeURIComponent(pesanDpWa)}`;

    return (
      <section className="rounded-[20px] border border-utama/30 bg-latar p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-garis pb-5">
          <div>
            <span className="inline-flex rounded-full bg-harga-latar px-3 py-1 text-xs font-semibold text-harga">
              Menunggu Konfirmasi DP (TTL 15 Menit)
            </span>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-teks">
              Slot Mesin Terkunci Sementara
            </h2>
            <p className="mt-1 text-sm text-teks-lembut">
              Segera kirim bukti transfer DP lewat WhatsApp sebelum batas waktu habis.
            </p>
          </div>

          <div className="rounded-[16px] border border-garis bg-permukaan px-4 py-3 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-teks-lembut">
              Sisa Waktu Kunci
            </p>
            <p className="numeric font-mono text-2xl font-bold text-bahaya">
              {menit}:{detik}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[16px] border border-garis bg-permukaan p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.03em] text-teks-lembut">
              Kode Booking Anda
            </p>
            <p className="numeric font-mono mt-1 text-2xl font-bold text-utama">
              {b.booking_code}
            </p>
            <p className="mt-2 text-xs text-teks-lembut">
              Simpan kode ini untuk cek status antrean dan verifikasi saat tiba di gerai.
            </p>
          </div>

          <div className="rounded-[16px] border border-garis bg-permukaan p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.03em] text-teks-lembut">
              Tujuan Transfer DP
            </p>
            <p className="numeric mt-1 text-lg font-bold text-teks">
              {formatRupiah(b.dp_amount)}
            </p>
            <p className="mt-1 text-xs font-medium text-teks-lembut">
              {b.info_rekening || "Hubungi admin via WhatsApp untuk info rekening."}
            </p>
          </div>
        </div>

        <ul className="mt-5 divide-y divide-garis rounded-[16px] border border-garis bg-latar text-sm">
          <li className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-teks-lembut">Pemesan</span>
            <span className="font-semibold text-teks">{b.customer_name}</span>
          </li>
          <li className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-teks-lembut">Layanan &amp; Berat</span>
            <span className="numeric font-semibold text-teks">
              {b.service_name} (Est. {b.estimated_weight_kg} kg)
            </span>
          </li>
          <li className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-teks-lembut">Tanggal</span>
            <span className="numeric font-semibold text-teks">{b.block_date}</span>
          </li>
          {b.washer_label ? (
            <li className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-teks-lembut">Unit Washer</span>
              <span className="numeric font-semibold text-teks">{b.washer_label}</span>
            </li>
          ) : null}
          {b.dryer_label ? (
            <li className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-teks-lembut">Unit Dryer</span>
              <span className="numeric font-semibold text-teks">{b.dryer_label}</span>
            </li>
          ) : null}
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              catatKlikWa({ produkId: Number(selectedProductId) || null, sumber: "booking-dp" })
            }
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-utama px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-utama-gelap sm:flex-none"
          >
            Kirim Bukti DP via WhatsApp
          </a>
          <Tombol href="/antrean" varian="garis" onClick={() => window.location.reload()}>
            Buat Reservasi Lain
          </Tombol>
        </div>
      </section>
    );
  }

  const errors = state?.errors || {};

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-[20px] border border-garis bg-latar p-6 sm:p-8"
    >
      <div>
        <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-teks">
          Pesan Slot Antrean Mesin
        </h2>
        <p className="mt-1 text-sm text-teks-lembut">
          Pilih layanan, jam kedatangan, dan unit mesin. Sistem mengunci slot selama 15 menit saat
          Anda mengirim bukti DP.
        </p>
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-[14px] border border-bahaya/30 bg-bahaya-latar px-4 py-3 text-sm font-medium text-bahaya"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1.5fr_0.8fr]">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-teks">Paket Layanan</span>
          <CustomSelect
            name="service_product_id"
            options={layananMesin.map((p) => ({
              value: String(p.id),
              label: `${p.nama} (${formatRupiah(p.harga)})`,
            }))}
            value={selectedProductId}
            onChange={setSelectedProductId}
            ariaLabel="Pilih paket layanan"
          />
          {errors.service_product_id ? (
            <p className="text-xs font-medium text-bahaya">{errors.service_product_id}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <Input
            label="Estimasi berat (kg)"
            name="estimated_weight_kg"
            type="number"
            min="1"
            max="100"
            value={beratKg}
            onChange={(e) => setBeratKg(e.target.value)}
            required
          />
          {errors.estimated_weight_kg ? (
            <p className="text-xs font-medium text-bahaya">{errors.estimated_weight_kg}</p>
          ) : null}
        </div>
      </div>

      {/* Tanggal & Jam */}
      <div className="flex flex-col gap-3 rounded-[16px] border border-garis bg-permukaan p-4">
        <input type="hidden" name="block_date" value={selectedDate} />
        <input type="hidden" name="start_time" value={selectedTime} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] font-semibold text-teks">Tanggal &amp; Jam Mulai</span>
          <div className="inline-flex rounded-[10px] bg-garis/40 p-1">
            {[
              { value: todayStr, label: "Hari Ini" },
              { value: tomorrowStr, label: "Besok" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedDate(opt.value)}
                className={`min-h-[34px] cursor-pointer rounded-[8px] px-3.5 text-xs font-semibold transition-colors ${
                  selectedDate === opt.value
                    ? "bg-latar text-teks shadow-xs"
                    : "text-teks-lembut hover:text-teks"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {timeSlots.length === 0 ? (
          <p className="text-xs font-medium text-bahaya">
            Jam operasional hari ini sudah mendekati tutup. Silakan pilih tanggal Besok.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedTime(slot)}
                className={`numeric min-h-[38px] cursor-pointer rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                  selectedTime === slot
                    ? "bg-utama text-white"
                    : "border border-garis bg-latar text-teks hover:border-utama"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pilihan Unit Mesin */}
      <div className="grid gap-4 sm:grid-cols-2">
        {selectedProduct?.requires_washer ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-teks">Unit Mesin Cuci (Washer)</span>
            <CustomSelect
              name="washer_machine_id"
              options={washerOptions}
              value={washerChoice}
              onChange={setWasherChoice}
              ariaLabel="Pilih unit washer"
            />
          </div>
        ) : (
          <input type="hidden" name="washer_machine_id" value="AUTO" />
        )}

        {selectedProduct?.requires_dryer ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-teks">Unit Pengering (Dryer)</span>
            <CustomSelect
              name="dryer_machine_id"
              options={dryerOptions}
              value={dryerChoice}
              onChange={setDryerChoice}
              ariaLabel="Pilih unit dryer"
            />
          </div>
        ) : (
          <input type="hidden" name="dryer_machine_id" value="AUTO" />
        )}
      </div>

      {/* Data Pemesan */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Input
            label="Nama lengkap"
            name="customer_name"
            placeholder="Contoh: Budi Santoso"
            required
          />
          {errors.customer_name ? (
            <p className="text-xs font-medium text-bahaya">{errors.customer_name}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <Input
            label="Nomor WhatsApp aktif"
            name="customer_phone"
            placeholder="081234567890"
            required
          />
          {errors.customer_phone ? (
            <p className="text-xs font-medium text-bahaya">{errors.customer_phone}</p>
          ) : null}
        </div>
      </div>

      <Input
        label="Catatan tambahan (opsional)"
        name="notes"
        placeholder="Mis. pisahkan pakaian putih, titip deterjen di kasir"
      />

      {/* Ringkasan Biaya & Submit */}
      <div className="flex flex-col gap-3 rounded-[16px] border border-garis bg-permukaan p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="numeric text-sm font-semibold text-teks">
            Estimasi {jumlahTabung} tabung · Total {formatRupiah(estimasiTotal)}
          </p>
          <p className="numeric text-xs text-teks-lembut">
            Nominal DP yang perlu dikonfirmasi:{" "}
            <span className="font-semibold text-utama">{formatRupiah(estimasiDp)}</span>
          </p>
        </div>

        <Tombol type="submit" disabled={isPending || timeSlots.length === 0}>
          {isPending ? "Mengunci Slot..." : "Pesan Antrean"}
        </Tombol>
      </div>
    </form>
  );
}
