import NavAdmin from "@/components/NavAdmin";
import MachineTimelineGrid from "@/components/MachineTimelineGrid";
import { getPengaturanToko } from "@/lib/pengaturan";
import { requireAdmin } from "@/lib/supabase/session";
import {
  getJakartaDateOffset,
  getJakartaNow,
  releaseExpiredLocks,
} from "@/lib/laundry-scheduler";

export const dynamic = "force-dynamic";

export default async function HalamanJadwalAdmin({ searchParams }) {
  const { supabase } = await requireAdmin();
  await releaseExpiredLocks(supabase);

  const sp = await searchParams;
  const nowJakarta = getJakartaNow();
  const todayStr = nowJakarta.dateStr;
  const tomorrowStr = getJakartaDateOffset(1);
  const selectedDateRaw = String(sp?.tanggal || "").trim();
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(selectedDateRaw) ? selectedDateRaw : todayStr;

  const [machinesRes, blocksRes, produkRes, pengaturan] = await Promise.all([
    supabase
      .from("machines")
      .select(
        "id, machine_code, name, type, max_capacity_kg, cycle_duration_minutes, booking_mode, status"
      )
      .order("type", { ascending: false })
      .order("machine_code", { ascending: true }),
    supabase
      .from("machine_time_blocks")
      .select("id, booking_id, machine_id, block_date, start_time, end_time, stage, block_status")
      .eq("block_date", selectedDate)
      .order("start_time", { ascending: true }),
    supabase
      .from("produk")
      .select("id, nama, harga, requires_washer, requires_dryer, aktif, urutan")
      .eq("aktif", true)
      .order("urutan", { ascending: true }),
    getPengaturanToko(),
  ]);

  const blocks = blocksRes.data || [];
  const bookingIds = Array.from(new Set(blocks.map((b) => b.booking_id).filter(Boolean)));

  let bookings = [];
  if (bookingIds.length > 0) {
    const { data: bookingRows } = await supabase
      .from("bookings")
      .select(
        "id, booking_code, service_product_id, source, customer_name, customer_phone, estimated_weight_kg, total_estimated_price, dp_amount, payment_status, booking_status, lock_expires_at, notes, created_at"
      )
      .in("id", bookingIds)
      .order("created_at", { ascending: false });
    bookings = bookingRows || [];
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-teks">
          Papan Jadwal Mesin
        </h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Pantau blok waktu tiap unit Washer dan Dryer, konfirmasi DP online, input quick walk-in,
          pindah mesin, dan atur mode maintenance.
        </p>
      </div>

      <MachineTimelineGrid
        machines={machinesRes.data || []}
        blocks={blocks}
        bookings={bookings}
        daftarLayanan={(produkRes.data || []).filter((p) => p.requires_washer || p.requires_dryer)}
        pengaturan={pengaturan}
        selectedDate={selectedDate}
        todayStr={todayStr}
        tomorrowStr={tomorrowStr}
      />
    </div>
  );
}
