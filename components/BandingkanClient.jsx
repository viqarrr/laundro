"use client";

import Link from "next/link";
import CustomSelect from "@/components/CustomSelect";
import Tombol from "@/components/Tombol";
import { useUserPrefs } from "@/components/UserPrefsProvider";
import { formatRupiah } from "@/lib/format";
import { toko } from "@/lib/toko";
import { catatKlikWa } from "@/lib/wa-tracking";

function normalisasiNomorWa(nomor) {
  const digits = String(nomor || "").replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits || "6281234567890";
}

export default function BandingkanClient({ semuaProduk = [], pengaturan = null }) {
  const { hydrated, compareItems, toggleCompare, clearCompare } = useUserPrefs();

  // Sinkronkan snapshot dengan data terbaru dari server
  const resolvedItems = hydrated
    ? compareItems
        .map((snap) => semuaProduk.find((p) => p.id === snap.id) || snap)
        .slice(0, 2)
    : [];

  const opsiProduk = [
    { value: "", label: "Pilih paket layanan..." },
    ...semuaProduk.map((p) => ({
      value: String(p.id),
      label: `${p.nama} (${formatRupiah(p.harga)})`,
    })),
  ];

  function handleSlotSelect(slotIndex, nextId) {
    if (!nextId) return;
    const picked = semuaProduk.find((p) => String(p.id) === String(nextId));
    if (!picked) return;

    const existing = resolvedItems[slotIndex];
    if (existing && existing.id === picked.id) return;

    if (existing) {
      toggleCompare(existing);
    }
    toggleCompare(picked);
  }

  const namaGerai = pengaturan?.nama_gerai || toko.nama;
  const nomorWa = normalisasiNomorWa(toko.nomorWhatsApp || pengaturan?.nomor_wa);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-garis bg-permukaan p-4">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-teks-lembut">Paket 1</span>
            <CustomSelect
              options={opsiProduk}
              value={resolvedItems[0] ? String(resolvedItems[0].id) : ""}
              onChange={(val) => handleSlotSelect(0, val)}
              ariaLabel="Pilih paket layanan pertama"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-teks-lembut">Paket 2</span>
            <CustomSelect
              options={opsiProduk}
              value={resolvedItems[1] ? String(resolvedItems[1].id) : ""}
              onChange={(val) => handleSlotSelect(1, val)}
              ariaLabel="Pilih paket layanan kedua"
            />
          </div>
        </div>

        {resolvedItems.length > 0 ? (
          <Tombol type="button" varian="garis" onClick={clearCompare} className="self-end">
            Kosongkan Pilihan
          </Tombol>
        ) : null}
      </div>

      {!hydrated ? (
        <div className="h-64 animate-pulse rounded-[20px] border border-garis bg-permukaan" />
      ) : resolvedItems.length === 0 ? (
        <div className="rounded-[20px] border border-garis bg-permukaan p-10 text-center">
          <p className="text-lg font-semibold text-teks">Belum ada paket yang dibandingkan</p>
          <p className="mt-1 text-sm text-teks-lembut">
            Pilih dua paket melalui dropdown di atas atau klik tombol Bandingkan pada kartu layanan.
          </p>
          <Tombol href="/" varian="garis" className="mt-5">
            Jelajahi Katalog Layanan
          </Tombol>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[20px] border border-garis bg-latar">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-permukaan">
              <tr>
                <th className="w-44 px-5 py-4 text-xs font-semibold uppercase tracking-[0.03em] text-teks-lembut">
                  Atribut
                </th>
                {resolvedItems.map((item) => (
                  <th key={item.id} className="px-5 py-4 align-top">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.foto_url || "/images/hero-machines.jpg"}
                        alt={item.nama}
                        className="h-14 w-14 shrink-0 rounded-[10px] border border-garis bg-latar object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-teks-lembut">{item.kategori}</p>
                        <Link
                          href={`/produk/${item.id}`}
                          className="text-base font-semibold text-teks hover:text-utama"
                        >
                          {item.nama}
                        </Link>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-garis">
              <tr>
                <td className="px-5 py-3.5 font-semibold text-teks-lembut">Tarif Layanan</td>
                {resolvedItems.map((item) => (
                  <td key={item.id} className="numeric px-5 py-3.5">
                    <span className="text-base font-bold text-teks">
                      {formatRupiah(item.harga)}
                    </span>
                    {Number(item.harga_coret) > Number(item.harga) ? (
                      <span className="ml-2 text-xs text-teks-lembut line-through">
                        {formatRupiah(item.harga_coret)}
                      </span>
                    ) : null}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3.5 font-semibold text-teks-lembut">Kapasitas Tabung</td>
                {resolvedItems.map((item) => (
                  <td key={item.id} className="numeric px-5 py-3.5 font-medium text-teks">
                    {item.max_capacity_kg || 7} kg
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3.5 font-semibold text-teks-lembut">Estimasi Durasi</td>
                {resolvedItems.map((item) => (
                  <td key={item.id} className="numeric px-5 py-3.5 font-medium text-teks">
                    {item.cycle_duration_minutes || 40} menit
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3.5 font-semibold text-teks-lembut">Cakupan Mesin</td>
                {resolvedItems.map((item) => (
                  <td key={item.id} className="px-5 py-3.5 font-medium text-teks">
                    {[item.requires_washer ? "Washer" : null, item.requires_dryer ? "Dryer" : null]
                      .filter(Boolean)
                      .join(" + ") || "Add-on / Jasa Gerai"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3.5 font-semibold text-teks-lembut">Ketersediaan</td>
                {resolvedItems.map((item) => {
                  const stok = Number(item.stok ?? 10);
                  return (
                    <td key={item.id} className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          stok <= 0
                            ? "bg-bahaya-latar text-bahaya"
                            : stok <= 2
                              ? "bg-harga-latar text-harga"
                              : "bg-sukses-latar text-sukses"
                        }`}
                      >
                        {stok <= 0 ? "Penuh / Habis" : `Tersedia (${stok})`}
                      </span>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-5 py-4 font-semibold text-teks-lembut">Aksi</td>
                {resolvedItems.map((item) => {
                  const waText = `Halo ${namaGerai}, saya ingin memesan layanan "${item.nama}" seharga ${formatRupiah(item.harga)}.`;
                  const waUrl = `https://wa.me/${nomorWa}?text=${encodeURIComponent(waText)}`;
                  return (
                    <td key={item.id} className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Tombol
                          href={`/produk/${item.id}`}
                          varian="garis"
                          className="min-h-[38px] px-4 py-1.5 text-xs"
                        >
                          Detail &amp; Hitung
                        </Tombol>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            catatKlikWa({ produkId: item.id, sumber: "bandingkan" })
                          }
                          className="inline-flex min-h-[38px] items-center rounded-full bg-utama px-4 py-1.5 text-xs font-semibold text-white hover:bg-utama-gelap"
                        >
                          Pesan WhatsApp
                        </a>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
