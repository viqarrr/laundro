import LiveMesinStatus from "@/components/LiveMesinStatus";
import MachineSlotPicker from "@/components/MachineSlotPicker";
import TrackingBooking from "@/components/TrackingBooking";
import { getPengaturanToko } from "@/lib/pengaturan";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import {
  getJakartaDateOffset,
  getJakartaNow,
  releaseExpiredLocks,
} from "@/lib/laundry-scheduler";

export const dynamic = "force-dynamic";

export default async function HalamanAntrean() {
  const supabase = createSupabasePublicClient();
  await releaseExpiredLocks(supabase);

  const nowJakarta = getJakartaNow();
  const todayStr = nowJakarta.dateStr;
  const tomorrowStr = getJakartaDateOffset(1);

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
      .select("id, machine_id, block_date, start_time, end_time, stage, block_status")
      .in("block_date", [todayStr, tomorrowStr])
      .in("block_status", ["LOCKED_TEMP", "BOOKED", "RUNNING"]),
    supabase
      .from("produk")
      .select("id, nama, harga, max_capacity_kg, cycle_duration_minutes, requires_washer, requires_dryer, aktif, urutan")
      .eq("aktif", true)
      .order("urutan", { ascending: true }),
    getPengaturanToko(),
  ]);

  const machines = machinesRes.data || [];
  const allBlocks = blocksRes.data || [];
  const blocksToday = allBlocks.filter((b) => b.block_date === todayStr);
  const daftarLayanan = produkRes.data || [];

  return (
    <div className="flex flex-col gap-10 py-10 sm:py-12">
      <header className="border-b border-garis pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.04em] text-utama">
          Antrean &amp; Reservasi Slot Mesin
        </p>
        <h1 className="mt-2 text-[clamp(28px,3.5vw,40px)] font-semibold leading-tight tracking-[-0.02em] text-teks">
          Jadwal Mesin {pengaturan.nama_gerai}
        </h1>
        <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-teks-lembut">
          Pantau unit Washer dan Dryer yang kosong secara langsung, pesan jadwal kedatangan Anda,
          dan kunci slot selama 15 menit untuk konfirmasi DP lewat WhatsApp.
        </p>
      </header>

      <LiveMesinStatus
        machines={machines}
        blocksToday={blocksToday}
        currentTimeStr={nowJakarta.timeStr}
      />

      <div className="grid items-start gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <MachineSlotPicker
          daftarLayanan={daftarLayanan}
          machines={machines}
          blocks={allBlocks}
          pengaturan={pengaturan}
          todayStr={todayStr}
          tomorrowStr={tomorrowStr}
          currentTimeStr={nowJakarta.timeStr}
        />

        <TrackingBooking />
      </div>
    </div>
  );
}
