import Link from "next/link";

function hitungStatusMesinSaatIni(machine, blocksToday, currentTimeStr) {
  if (machine.status === "MAINTENANCE") {
    return {
      kode: "MAINTENANCE",
      label: "Maintenance",
      detail: "Sedang perbaikan",
      badgeClass: "bg-permukaan text-teks-lembut",
      dotClass: "bg-garis-tegas",
    };
  }

  const activeBlock = blocksToday.find((b) => {
    if (b.machine_id !== machine.id) return false;
    if (!["LOCKED_TEMP", "BOOKED", "RUNNING"].includes(b.block_status)) return false;
    const start = String(b.start_time || "").slice(0, 5);
    const end = String(b.end_time || "").slice(0, 5);
    return start <= currentTimeStr && end > currentTimeStr;
  });

  if (activeBlock) {
    const endShort = String(activeBlock.end_time || "").slice(0, 5);
    const statusLabel =
      activeBlock.block_status === "LOCKED_TEMP" ? "Terkunci DP" : "Sedang Dipakai";
    return {
      kode: "BUSY",
      label: statusLabel,
      detail: `Selesai ~${endShort} WIB`,
      badgeClass:
        activeBlock.block_status === "LOCKED_TEMP"
          ? "bg-harga-latar text-harga"
          : "bg-utama-lembut text-utama",
      dotClass: activeBlock.block_status === "LOCKED_TEMP" ? "bg-harga" : "bg-utama",
    };
  }

  return {
    kode: "AVAILABLE",
    label: "Tersedia",
    detail: `${machine.max_capacity_kg} kg · ${machine.cycle_duration_minutes} mnt`,
    badgeClass: "bg-sukses-latar text-sukses",
    dotClass: "bg-sukses",
  };
}

export default function LiveMesinStatus({
  machines = [],
  blocksToday = [],
  currentTimeStr = "08:00",
  compact = false,
}) {
  if (!machines || machines.length === 0) {
    return null;
  }

  const mapped = machines.map((m) => ({
    ...m,
    live: hitungStatusMesinSaatIni(m, blocksToday, currentTimeStr),
  }));

  const availableCount = mapped.filter((m) => m.live.kode === "AVAILABLE").length;

  if (compact) {
    return (
      <div className="rounded-[20px] border border-garis bg-permukaan p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.04em] text-utama">
              Live Status Mesin
            </p>
            <p className="numeric mt-0.5 text-sm font-semibold text-teks">
              {availableCount} dari {mapped.length} unit mesin tersedia saat ini ({currentTimeStr} WIB)
            </p>
          </div>
          <Link
            href="/antrean"
            className="inline-flex min-h-[38px] items-center rounded-full bg-latar px-4 py-1.5 text-xs font-semibold text-utama border border-garis hover:border-utama transition-colors"
          >
            Pesan Slot &amp; Cek Antrean &#8250;
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {mapped.map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-1 rounded-[14px] border border-garis bg-latar p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-teks">{m.machine_code}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.live.badgeClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${m.live.dotClass}`} />
                  {m.live.label}
                </span>
              </div>
              <p className="truncate text-xs font-medium text-teks-lembut">{m.name}</p>
              <p className="numeric text-[11px] text-teks-lembut">{m.live.detail}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-teks">
            Status Unit Mesin Saat Ini
          </h2>
          <p className="numeric text-sm text-teks-lembut">
            Pembaruan pukul {currentTimeStr} WIB · {availableCount} dari {mapped.length} unit siap dipakai
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mapped.map((m) => (
          <article
            key={m.id}
            className="flex flex-col justify-between gap-3 rounded-[18px] border border-garis bg-latar p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-teks">{m.machine_code}</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.live.badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${m.live.dotClass}`} aria-hidden="true" />
                {m.live.label}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-teks">{m.name}</h3>
              <p className="numeric mt-1 text-xs text-teks-lembut">{m.live.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
