"use client";

import { useActionState } from "react";
import Tombol from "@/components/Tombol";
import { cekStatusBookingAction } from "@/app/antrean/actions";
import { formatRupiah } from "@/lib/format";

const STATUS_BADGE = {
  PENDING_LOCK: { label: "Menunggu DP", cls: "bg-harga-latar text-harga" },
  CONFIRMED: { label: "Terkonfirmasi", cls: "bg-utama-lembut text-utama" },
  IN_PROGRESS: { label: "Mesin Berjalan", cls: "bg-purple-500/15 text-purple-700" },
  COMPLETED: { label: "Selesai", cls: "bg-sukses-latar text-sukses" },
  CANCELLED: { label: "Dibatalkan", cls: "bg-bahaya-latar text-bahaya" },
  EXPIRED: { label: "Kedaluwarsa", cls: "bg-permukaan text-teks-lembut" },
};

export default function TrackingBooking() {
  const [state, formAction, isPending] = useActionState(cekStatusBookingAction, null);

  return (
    <section className="flex flex-col gap-4 rounded-[20px] border border-garis bg-latar p-6">
      <div>
        <h2 className="text-lg font-semibold text-teks">Cek Status Antrean</h2>
        <p className="mt-1 text-sm text-teks-lembut">
          Masukkan Kode Booking (contoh: LND-261126-001) atau Nomor WhatsApp Anda.
        </p>
      </div>

      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          name="keyword"
          placeholder="Kode Booking atau Nomor WhatsApp..."
          required
          className="min-h-[44px] min-w-[220px] flex-1 rounded-[12px] border border-garis-tegas bg-latar px-3.5 py-2 text-sm text-teks placeholder:text-teks-lembut focus:border-utama focus:outline-none"
        />
        <Tombol type="submit" disabled={isPending}>
          {isPending ? "Mencari..." : "Lacak Antrean"}
        </Tombol>
      </form>

      {state?.error ? (
        <p className="rounded-[12px] border border-bahaya/30 bg-bahaya-latar px-4 py-2.5 text-sm font-medium text-bahaya">
          {state.error}
        </p>
      ) : null}

      {state?.ok ? (
        state.results.length === 0 ? (
          <p className="rounded-[14px] border border-garis bg-permukaan p-4 text-sm text-teks-lembut">
            Tidak ditemukan data antrean untuk pencarian &ldquo;{state.searched}&rdquo;.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {state.results.map((b) => {
              const badge = STATUS_BADGE[b.booking_status] || STATUS_BADGE.PENDING_LOCK;
              const blocks = Array.isArray(b.machine_time_blocks) ? b.machine_time_blocks : [];
              return (
                <div
                  key={b.id}
                  className="flex flex-col gap-3 rounded-[16px] border border-garis bg-permukaan p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-base font-bold text-utama">
                        {b.booking_code}
                      </span>
                      <p className="text-xs text-teks-lembut">
                        {b.customer_name} · {b.produk?.nama || "Paket Laundry"} (Est.{" "}
                        {b.estimated_weight_kg} kg)
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  {blocks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {blocks.map((blk, idx) => (
                        <span
                          key={idx}
                          className="numeric rounded-full border border-garis bg-latar px-3 py-1 text-xs font-semibold text-teks"
                        >
                          {blk.machines?.name || blk.machines?.machine_code || blk.stage} ·{" "}
                          {blk.block_date} ({String(blk.start_time || "").slice(0, 5)}-
                          {String(blk.end_time || "").slice(0, 5)})
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <p className="numeric text-xs text-teks-lembut">
                    Estimasi Total: {formatRupiah(b.total_estimated_price)} · DP:{" "}
                    {formatRupiah(b.dp_amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )
      ) : null}
    </section>
  );
}
