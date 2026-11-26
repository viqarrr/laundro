"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import CustomSelect from "@/components/CustomSelect";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { formatRupiah } from "@/lib/format";
import {
  batalkanBookingAction,
  konfirmasiDpAction,
  kontrolSiklusAction,
  perpanjangTimerAction,
  pindahAtauGeserBlokAction,
  quickWalkInAction,
  toggleMaintenanceMesinAction,
} from "@/app/admin/jadwal-actions";

function toMinutes(timeStr) {
  const [h = "0", m = "0"] = String(timeStr || "00:00").split(":");
  return Number(h) * 60 + Number(m);
}

function toTimeStr(mins) {
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getBlockStyle(blockStatus) {
  if (blockStatus === "LOCKED_TEMP") {
    return "border-harga bg-harga-latar text-harga animate-pulse";
  }
  if (blockStatus === "BOOKED") {
    return "border-utama bg-utama-lembut text-utama";
  }
  if (blockStatus === "RUNNING") {
    return "border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300";
  }
  return "border-sukses bg-sukses-latar text-sukses";
}

function formatSisaTimer(lockExpiresAt, nowMs) {
  if (!lockExpiresAt) return "";
  const diffSec = Math.max(0, Math.floor((new Date(lockExpiresAt).getTime() - nowMs) / 1000));
  const m = String(Math.floor(diffSec / 60)).padStart(2, "0");
  const s = String(diffSec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function MachineTimelineGrid({
  machines = [],
  blocks = [],
  bookings = [],
  daftarLayanan = [],
  pengaturan,
  selectedDate,
  todayStr,
  tomorrowStr,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [pesanError, setPesanError] = useState("");
  const [pesanSukses, setPesanSukses] = useState("");

  // Modal Quick Walk-in
  const [walkInTarget, setWalkInTarget] = useState(null);
  const [walkInProductId, setWalkInProductId] = useState(
    daftarLayanan[0] ? String(daftarLayanan[0].id) : ""
  );
  const [walkInName, setWalkInName] = useState("Pelanggan Walk-in");
  const [walkInPhone, setWalkInPhone] = useState("628000000000");

  // Modal Pindah / Geser Blok
  const [moveTargetBlock, setMoveTargetBlock] = useState(null);
  const [moveMachineId, setMoveMachineId] = useState("");
  const [moveStartTime, setMoveStartTime] = useState("");
  const [moveDate, setMoveDate] = useState(selectedDate);

  // Tick timer per detik untuk sisa waktu lock
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-refresh polling 15 detik
  useEffect(() => {
    if (!autoRefresh) return;
    const poller = setInterval(() => {
      router.refresh();
    }, 15000);
    return () => clearInterval(poller);
  }, [autoRefresh, router]);

  const timeColumns = useMemo(() => {
    const openMin = toMinutes(pengaturan?.jam_buka || "07:00");
    const closeMin = toMinutes(pengaturan?.jam_tutup || "22:00");
    const cols = [];
    for (let m = openMin; m < closeMin; m += 15) {
      cols.push({
        label: toTimeStr(m),
        startMin: m,
        endMin: m + 15,
      });
    }
    return cols;
  }, [pengaturan?.jam_buka, pengaturan?.jam_tutup]);

  const bookingMap = useMemo(() => new Map(bookings.map((b) => [b.id, b])), [bookings]);

  function jalankanAksi(fn, successMsg = "") {
    setPesanError("");
    setPesanSukses("");
    startTransition(async () => {
      const res = await fn();
      if (!res?.ok) {
        setPesanError(res?.error || "Gagal menjalankan aksi.");
        return;
      }
      if (successMsg) setPesanSukses(successMsg);
      router.refresh();
    });
  }

  function handleDateNavigate(nextDate) {
    router.push(`/admin/jadwal?tanggal=${encodeURIComponent(nextDate)}`);
  }

  function openWalkInModal(machine, slotLabel) {
    if (machine.status === "MAINTENANCE") return;
    setWalkInTarget({ machine, slotLabel });
    const compatible = daftarLayanan.find((p) =>
      machine.type === "WASHER" ? p.requires_washer : p.requires_dryer
    );
    if (compatible) {
      setWalkInProductId(String(compatible.id));
    }
  }

  function submitQuickWalkIn(event) {
    event.preventDefault();
    if (!walkInTarget) return;
    const target = walkInTarget;
    setWalkInTarget(null);
    jalankanAksi(
      () =>
        quickWalkInAction({
          machineId: target.machine.id,
          blockDate: selectedDate,
          startTime: target.slotLabel,
          productId: walkInProductId,
          customerName: walkInName,
          customerPhone: walkInPhone,
        }),
      "Walk-in berhasil dikunci dan mesin dijalankan."
    );
  }

  function openMoveModal(block) {
    setMoveTargetBlock(block);
    setMoveMachineId(String(block.machine_id));
    setMoveStartTime(String(block.start_time || "").slice(0, 5));
    setMoveDate(block.block_date || selectedDate);
  }

  function submitMoveBlock(event) {
    event.preventDefault();
    if (!moveTargetBlock) return;
    const blk = moveTargetBlock;
    setMoveTargetBlock(null);
    jalankanAksi(
      () =>
        pindahAtauGeserBlokAction({
          blockId: blk.id,
          targetMachineId: moveMachineId,
          targetStartTime: moveStartTime,
          targetDate: moveDate,
        }),
      "Blok jadwal berhasil dipindahkan."
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar Tanggal, Polling & Legenda */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-garis bg-permukaan p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleDateNavigate(todayStr)}
            className={`min-h-[38px] cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedDate === todayStr
                ? "bg-utama text-white"
                : "border border-garis bg-latar text-teks hover:border-utama"
            }`}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => handleDateNavigate(tomorrowStr)}
            className={`min-h-[38px] cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedDate === tomorrowStr
                ? "bg-utama text-white"
                : "border border-garis bg-latar text-teks hover:border-utama"
            }`}
          >
            Besok
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateNavigate(e.target.value)}
            aria-label="Pilih tanggal jadwal"
            className="numeric min-h-[38px] rounded-[10px] border border-garis-tegas bg-latar px-3 py-1 text-xs font-semibold text-teks"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAutoRefresh((prev) => !prev)}
            className={`inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
              autoRefresh
                ? "border-sukses/40 bg-sukses-latar text-sukses"
                : "border-garis bg-latar text-teks-lembut"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                autoRefresh ? "bg-sukses animate-pulse" : "bg-garis-tegas"
              }`}
            />
            <span>Auto-refresh 15 dtk: {autoRefresh ? "Aktif" : "Mati"}</span>
          </button>

          <Tombol
            type="button"
            varian="garis"
            onClick={() => router.refresh()}
            className="min-h-[38px] px-4 py-1.5 text-xs"
          >
            Segarkan
          </Tombol>
        </div>
      </div>

      {/* Legenda Status */}
      <div className="flex flex-wrap items-center gap-3 px-1 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5 text-teks-lembut">
          <span className="h-3 w-3 rounded border border-garis bg-latar" /> Tersedia (Klik untuk
          Walk-in)
        </span>
        <span className="inline-flex items-center gap-1.5 text-harga">
          <span className="h-3 w-3 rounded border border-harga bg-harga-latar" /> Menunggu DP
        </span>
        <span className="inline-flex items-center gap-1.5 text-utama">
          <span className="h-3 w-3 rounded border border-utama bg-utama-lembut" /> Terkonfirmasi
        </span>
        <span className="inline-flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
          <span className="h-3 w-3 rounded border border-purple-500 bg-purple-500/20" /> Berjalan
        </span>
        <span className="inline-flex items-center gap-1.5 text-sukses">
          <span className="h-3 w-3 rounded border border-sukses bg-sukses-latar" /> Selesai
        </span>
        <span className="inline-flex items-center gap-1.5 text-teks-lembut">
          <span className="h-3 w-3 rounded bg-garis-tegas/50" /> Maintenance
        </span>
      </div>

      {pesanError ? (
        <p
          role="alert"
          className="rounded-[14px] border border-bahaya/30 bg-bahaya-latar px-4 py-3 text-sm font-medium text-bahaya"
        >
          {pesanError}
        </p>
      ) : null}

      {pesanSukses ? (
        <p
          role="status"
          className="rounded-[14px] border border-sukses/30 bg-sukses-latar px-4 py-3 text-sm font-medium text-sukses"
        >
          {pesanSukses}
        </p>
      ) : null}

      {/* Interactive Machine Timeline Grid (Sumbu Y: Mesin, Sumbu X: Slot 15 menit) */}
      <div className="overflow-x-auto rounded-[20px] border border-garis bg-latar">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-permukaan text-teks-lembut">
            <tr>
              <th className="sticky left-0 z-20 min-w-[210px] border-b border-r border-garis bg-permukaan px-4 py-3 font-semibold">
                Unit Mesin
              </th>
              {timeColumns.map((col) => (
                <th
                  key={col.label}
                  className="numeric min-w-[54px] border-b border-r border-garis px-1.5 py-3 text-center font-medium"
                >
                  {col.label.endsWith(":00") || col.label.endsWith(":30") ? col.label : ""}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {machines.map((machine) => {
              const isMaint = machine.status === "MAINTENANCE";
              const machineBlocks = blocks.filter((b) => b.machine_id === machine.id);

              return (
                <tr key={machine.id} className="border-t border-garis">
                  {/* Sumbu Y: Info Unit & Sakelar Maintenance */}
                  <td className="sticky left-0 z-10 border-r border-garis bg-latar px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-teks">
                          {machine.machine_code}
                        </p>
                        <p className="truncate text-xs font-medium text-teks-lembut">
                          {machine.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          jalankanAksi(
                            () =>
                              toggleMaintenanceMesinAction(
                                machine.id,
                                isMaint ? "ACTIVE" : "MAINTENANCE"
                              ),
                            `${machine.machine_code} diubah ke ${
                              isMaint ? "ACTIVE" : "MAINTENANCE"
                            }.`
                          )
                        }
                        className={`shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          isMaint
                            ? "bg-bahaya-latar text-bahaya"
                            : "bg-sukses-latar text-sukses hover:opacity-80"
                        }`}
                      >
                        {isMaint ? "Maintenance" : "Aktif"}
                      </button>
                    </div>
                  </td>

                  {/* Sumbu X: Sel 15 menit */}
                  {timeColumns.map((col) => {
                    if (isMaint) {
                      return (
                        <td
                          key={col.label}
                          title={`${machine.machine_code} Maintenance`}
                          className="h-12 border-r border-garis bg-garis-tegas/35"
                        />
                      );
                    }

                    const coveringBlock = machineBlocks.find((b) => {
                      const bStart = toMinutes(String(b.start_time || "").slice(0, 5));
                      const bEnd = toMinutes(String(b.end_time || "").slice(0, 5));
                      return bStart < col.endMin && bEnd > col.startMin;
                    });

                    if (coveringBlock) {
                      const bStart = toMinutes(String(coveringBlock.start_time || "").slice(0, 5));
                      const isFirstCell = bStart >= col.startMin && bStart < col.endMin;
                      const booking = bookingMap.get(coveringBlock.booking_id);
                      const timerText =
                        coveringBlock.block_status === "LOCKED_TEMP"
                          ? formatSisaTimer(booking?.lock_expires_at, nowMs)
                          : "";

                      return (
                        <td
                          key={col.label}
                          onClick={() => openMoveModal(coveringBlock)}
                          title={`${booking?.booking_code || ""} - ${
                            booking?.customer_name || ""
                          } (${String(coveringBlock.start_time).slice(0, 5)}-${String(
                            coveringBlock.end_time
                          ).slice(0, 5)}) - Klik untuk Pindah/Geser`}
                          className={`h-12 cursor-pointer border-r border-garis px-1 text-center align-middle transition-opacity hover:opacity-85 ${getBlockStyle(
                            coveringBlock.block_status
                          )}`}
                        >
                          {isFirstCell ? (
                            <span className="block truncate font-mono text-[10px] font-bold">
                              {booking?.booking_code?.slice(-3) || "BLK"}
                              {timerText ? ` (${timerText})` : ""}
                            </span>
                          ) : null}
                        </td>
                      );
                    }

                    return (
                      <td
                        key={col.label}
                        onClick={() => openWalkInModal(machine, col.label)}
                        title={`Kosong: ${machine.machine_code} jam ${col.label} - Klik untuk Walk-in`}
                        className="h-12 cursor-pointer border-r border-garis bg-latar transition-colors hover:bg-utama-lembut"
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Daftar Antrean Hari Ini & Aksi Cepat */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-teks">
          Daftar Antrean Tanggal {selectedDate} ({bookings.length})
        </h2>

        {bookings.length === 0 ? (
          <div className="rounded-[20px] border border-garis bg-permukaan p-6 text-center text-sm text-teks-lembut">
            Belum ada pesanan online atau walk-in pada tanggal ini. Klik sel kosong di papan jadwal
            untuk membuat Quick Walk-in.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {bookings.map((b) => {
              const bookingBlocks = blocks.filter((blk) => blk.booking_id === b.id);
              const firstBlock = bookingBlocks[0];
              const isLate =
                b.booking_status === "CONFIRMED" &&
                firstBlock &&
                selectedDate === todayStr &&
                toMinutes(String(firstBlock.start_time).slice(0, 5)) + 15 <
                  (nowMs ? new Date(nowMs).getHours() * 60 + new Date(nowMs).getMinutes() : 0);

              const waSelesaiText = `Halo ${b.customer_name}, siklus laundry Anda (${b.booking_code}) di ${
                pengaturan?.nama_gerai || "Laundro"
              } telah selesai. Silakan diambil di area mesin/kasir.`;
              const waSelesaiUrl = `https://wa.me/${b.customer_phone}?text=${encodeURIComponent(
                waSelesaiText
              )}`;

              return (
                <article
                  key={b.id}
                  className="flex flex-col justify-between gap-3 rounded-[18px] border border-garis bg-latar p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-utama">
                          {b.booking_code}
                        </span>
                        <span className="rounded-full bg-permukaan px-2 py-0.5 text-[11px] font-semibold text-teks-lembut">
                          {b.source}
                        </span>
                        {isLate ? (
                          <span className="rounded-full bg-bahaya-latar px-2 py-0.5 text-[11px] font-semibold text-bahaya">
                            Terlambat
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-teks">
                        {b.customer_name} ·{" "}
                        <span className="numeric font-normal text-teks-lembut">
                          {b.customer_phone}
                        </span>
                      </p>
                      <p className="numeric text-xs text-teks-lembut">
                        DP {formatRupiah(b.dp_amount)} · Total{" "}
                        {formatRupiah(b.total_estimated_price)} · Est. {b.estimated_weight_kg} kg
                      </p>
                    </div>

                    <span className="numeric rounded-full bg-utama-lembut px-2.5 py-1 text-xs font-semibold text-utama">
                      {b.booking_status}
                      {b.booking_status === "PENDING_LOCK" && b.lock_expires_at
                        ? ` (${formatSisaTimer(b.lock_expires_at, nowMs)})`
                        : ""}
                    </span>
                  </div>

                  {/* Daftar blok mesin */}
                  <div className="flex flex-wrap gap-1.5">
                    {bookingBlocks.map((blk) => {
                      const m = machines.find((item) => item.id === blk.machine_id);
                      return (
                        <button
                          key={blk.id}
                          type="button"
                          onClick={() => openMoveModal(blk)}
                          className="numeric cursor-pointer rounded-full border border-garis bg-permukaan px-2.5 py-1 text-xs font-semibold text-teks hover:border-utama"
                        >
                          {m?.machine_code || blk.stage}: {String(blk.start_time).slice(0, 5)}-
                          {String(blk.end_time).slice(0, 5)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-garis pt-3">
                    {b.booking_status === "PENDING_LOCK" ? (
                      <>
                        <Tombol
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            jalankanAksi(() => konfirmasiDpAction(b.id), "DP dikonfirmasi.")
                          }
                          className="min-h-[34px] px-3 py-1 text-xs"
                        >
                          Konfirmasi DP
                        </Tombol>
                        <Tombol
                          type="button"
                          varian="garis"
                          disabled={isPending}
                          onClick={() =>
                            jalankanAksi(
                              () => perpanjangTimerAction(b.id),
                              "Timer diperpanjang +10 menit."
                            )
                          }
                          className="min-h-[34px] px-3 py-1 text-xs"
                        >
                          +10 Menit
                        </Tombol>
                      </>
                    ) : null}

                    {b.booking_status === "CONFIRMED" ? (
                      <Tombol
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          jalankanAksi(() => kontrolSiklusAction(b.id, "MULAI"), "Mesin dimulai.")
                        }
                        className="min-h-[34px] px-3 py-1 text-xs"
                      >
                        Mulai Mesin
                      </Tombol>
                    ) : null}

                    {b.booking_status === "IN_PROGRESS" ? (
                      <Tombol
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          jalankanAksi(
                            () => kontrolSiklusAction(b.id, "SELESAI"),
                            "Siklus ditandai selesai."
                          )
                        }
                        className="min-h-[34px] px-3 py-1 text-xs"
                      >
                        Selesai Siklus
                      </Tombol>
                    ) : null}

                    {firstBlock ? (
                      <Tombol
                        type="button"
                        varian="garis"
                        onClick={() => openMoveModal(firstBlock)}
                        className="min-h-[34px] px-3 py-1 text-xs"
                      >
                        Pindah / Geser
                      </Tombol>
                    ) : null}

                    {b.source === "ONLINE" &&
                    ["IN_PROGRESS", "COMPLETED"].includes(b.booking_status) ? (
                      <a
                        href={waSelesaiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[34px] items-center rounded-full bg-sukses-latar px-3 py-1 text-xs font-semibold text-sukses hover:opacity-85"
                      >
                        Kirim WA Selesai
                      </a>
                    ) : null}

                    {["PENDING_LOCK", "CONFIRMED"].includes(b.booking_status) ? (
                      <Tombol
                        type="button"
                        varian="bahaya"
                        disabled={isPending}
                        onClick={() =>
                          jalankanAksi(() => batalkanBookingAction(b.id), "Booking dibatalkan.")
                        }
                        className="min-h-[34px] px-3 py-1 text-xs"
                      >
                        Batalkan
                      </Tombol>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Quick Walk-in 2-Klik */}
      {walkInTarget ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <form
            onSubmit={submitQuickWalkIn}
            className="flex w-full max-w-md flex-col gap-4 rounded-[20px] border border-garis bg-latar p-6"
          >
            <div>
              <span className="rounded-full bg-utama-lembut px-2.5 py-0.5 text-xs font-semibold text-utama">
                Quick Walk-in
              </span>
              <h3 className="mt-2 text-lg font-semibold text-teks">
                {walkInTarget.machine.name} · Jam {walkInTarget.slotLabel}
              </h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-teks">Paket Layanan</span>
              <CustomSelect
                options={daftarLayanan.map((p) => ({
                  value: String(p.id),
                  label: `${p.nama} (${formatRupiah(p.harga)})`,
                }))}
                value={walkInProductId}
                onChange={setWalkInProductId}
                ariaLabel="Pilih paket walk-in"
              />
            </div>

            <Input
              label="Nama pelanggan"
              name="walkin_name"
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
            />
            <Input
              label="Nomor WA (opsional)"
              name="walkin_phone"
              value={walkInPhone}
              onChange={(e) => setWalkInPhone(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Tombol type="button" varian="garis" onClick={() => setWalkInTarget(null)}>
                Batal
              </Tombol>
              <Tombol type="submit" disabled={isPending}>
                Kunci &amp; Mulai
              </Tombol>
            </div>
          </form>
        </div>
      ) : null}

      {/* Modal Pindah Unit Mesin / Geser Jadwal */}
      {moveTargetBlock ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <form
            onSubmit={submitMoveBlock}
            className="flex w-full max-w-md flex-col gap-4 rounded-[20px] border border-garis bg-latar p-6"
          >
            <div>
              <span className="rounded-full bg-utama-lembut px-2.5 py-0.5 text-xs font-semibold text-utama">
                Reassign / Geser Blok
              </span>
              <h3 className="mt-2 text-lg font-semibold text-teks">
                Pindah Mesin atau Geser Jam ({moveTargetBlock.stage})
              </h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-teks">Unit Mesin Tujuan</span>
              <CustomSelect
                options={machines
                  .filter((m) =>
                    moveTargetBlock.stage === "WASHING" ? m.type === "WASHER" : m.type === "DRYER"
                  )
                  .map((m) => ({
                    value: String(m.id),
                    label: `${m.machine_code} - ${m.name} (${m.status})`,
                  }))}
                value={moveMachineId}
                onChange={setMoveMachineId}
                ariaLabel="Pilih mesin tujuan"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Tanggal"
                type="date"
                value={moveDate}
                onChange={(e) => setMoveDate(e.target.value)}
                required
              />
              <Input
                label="Jam mulai (HH:MM)"
                type="time"
                value={moveStartTime}
                onChange={(e) => setMoveStartTime(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Tombol type="button" varian="garis" onClick={() => setMoveTargetBlock(null)}>
                Batal
              </Tombol>
              <Tombol type="submit" disabled={isPending}>
                Simpan Perubahan
              </Tombol>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
