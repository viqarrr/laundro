"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatRupiah } from "@/lib/format";
import { toko } from "@/lib/toko";
import { catatKlikWa } from "@/lib/wa-tracking";

function normalisasiNomorWa(nomor) {
  const digits = String(nomor || "").replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  return digits;
}

function hitungDp(totalHarga, pengaturan) {
  if (totalHarga <= 0) return 0;
  if (pengaturan?.dp_type === "PERCENTAGE") {
    const persen = Math.min(100, Math.max(0, Number(pengaturan.dp_value ?? 50)));
    return Math.round((totalHarga * persen) / 100);
  }
  if (pengaturan?.dp_type === "FIXED") {
    return Math.min(totalHarga, Math.max(0, Number(pengaturan.dp_value ?? 15000)));
  }
  return Math.round(totalHarga * 0.5);
}

export default function KalkulatorLaundry({ produk, pengaturan = null }) {
  const { addItem, openCart } = useCart();

  const varianList = useMemo(() => {
    if (!Array.isArray(produk.varian)) return [];
    return produk.varian.filter(
      (v) => v && v.nama_ukuran && Number(v.kapasitas_kg) > 0 && Number(v.harga) >= 0
    );
  }, [produk.varian]);

  const [selectedVarianIdx, setSelectedVarianIdx] = useState(0);
  const varianAktif = varianList[selectedVarianIdx] || null;

  const hargaSatuan = varianAktif ? Number(varianAktif.harga) : Number(produk.harga || 0);
  const kapasitasAktif = varianAktif
    ? Number(varianAktif.kapasitas_kg)
    : Number(produk.max_capacity_kg || 7);
  const durasiAktif = varianAktif
    ? Number(varianAktif.durasi_menit || produk.cycle_duration_minutes || 40)
    : Number(produk.cycle_duration_minutes || 40);
  const namaVarian = varianAktif ? varianAktif.nama_ukuran : `Standar ${kapasitasAktif} kg`;

  const [beratKg, setBeratKg] = useState(kapasitasAktif);
  const [jumlahTabung, setJumlahTabung] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const isHabis = Number(produk.stok ?? 10) <= 0;

  function handleSelectVarian(idx) {
    setSelectedVarianIdx(idx);
    const nextVar = varianList[idx];
    const nextCap = nextVar ? Number(nextVar.kapasitas_kg) : Number(produk.max_capacity_kg || 7);
    const nextTabung = Math.max(1, Math.ceil(Math.max(1, Number(beratKg || 1)) / nextCap));
    setJumlahTabung(nextTabung);
  }

  function handleBeratChange(nextRaw) {
    const num = Number(nextRaw);
    if (Number.isNaN(num) || num <= 0) {
      setBeratKg("");
      setJumlahTabung(1);
      return;
    }
    const clamped = Math.min(200, num);
    setBeratKg(clamped);
    setJumlahTabung(Math.max(1, Math.ceil(clamped / kapasitasAktif)));
  }

  const beratValid = Math.max(1, Number(beratKg || kapasitasAktif));
  const totalHarga = hargaSatuan * jumlahTabung;
  const estimasiDp = hitungDp(totalHarga, pengaturan);

  const namaGerai = pengaturan?.nama_gerai || toko.nama;
  const nomorTujuan = normalisasiNomorWa(toko.nomorWhatsApp || pengaturan?.nomor_wa);
  const pesanWa = `Halo ${namaGerai}, saya ingin reservasi ${produk.nama} (${namaVarian}) sebanyak ${jumlahTabung} tabung/unit (est. ${beratValid} kg) seharga total ${formatRupiah(totalHarga)} (estimasi DP ${formatRupiah(estimasiDp)}). Mohon info konfirmasi DP.`;
  const tautanWa = `https://wa.me/${nomorTujuan}?text=${encodeURIComponent(pesanWa)}`;

  function handleTambahKeranjang() {
    if (isHabis) return;

    addItem({
      key: `${produk.id}::${namaVarian}`,
      produkId: produk.id,
      nama: produk.nama,
      fotoUrl: produk.foto_url || "/images/hero-machines.jpg",
      varianNama: namaVarian,
      kapasitasKg: kapasitasAktif,
      durasiMenit: durasiAktif,
      hargaSatuan,
      jumlah: jumlahTabung,
      estimasiBeratKg: beratValid,
    });

    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2500);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Harga Aktif, Harga Coret Promo & Spesifikasi Singkat */}
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="numeric text-[28px] font-semibold leading-[34px] tracking-[-0.015em] text-teks">
          {formatRupiah(hargaSatuan)}
        </span>
        {Number(produk.harga_coret) > hargaSatuan ? (
          <>
            <span className="numeric text-sm text-teks-lembut line-through">
              {formatRupiah(produk.harga_coret)}
            </span>
            <span className="numeric rounded-full bg-harga-latar px-2.5 py-0.5 text-xs font-semibold text-harga">
              Hemat{" "}
              {Math.round(((Number(produk.harga_coret) - hargaSatuan) / Number(produk.harga_coret)) * 100)}
              %
            </span>
          </>
        ) : null}
        <span className="numeric text-xs font-medium text-teks-lembut">
          per tabung/unit ({kapasitasAktif} kg · {durasiAktif} menit)
        </span>
      </div>

      {/* Pemilih Varian Ukuran Tabung (US-48) */}
      {varianList.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-teks">Pilih Ukuran Tabung</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Ukuran tabung">
            {varianList.map((v, idx) => {
              const aktif = idx === selectedVarianIdx;
              return (
                <button
                  key={`${v.nama_ukuran}-${idx}`}
                  type="button"
                  role="radio"
                  aria-checked={aktif}
                  onClick={() => handleSelectVarian(idx)}
                  className={`flex cursor-pointer flex-col gap-1 rounded-[14px] border p-3.5 text-left transition-all ${
                    aktif
                      ? "border-2 border-utama bg-utama-lembut"
                      : "border-garis bg-latar hover:border-garis-tegas"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-teks">{v.nama_ukuran}</span>
                    <span className="numeric text-sm font-semibold text-utama">
                      {formatRupiah(v.harga)}
                    </span>
                  </div>
                  <span className="numeric text-xs text-teks-lembut">
                    Maks {v.kapasitas_kg} kg · {v.durasi_menit || durasiAktif} menit
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Kalkulator Estimasi Berat & Kebutuhan Tabung (US-12) */}
      <div className="flex flex-col gap-4 rounded-[20px] border border-garis bg-permukaan p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-teks">Kalkulator Estimasi Biaya</h2>
          <span className="numeric rounded-full bg-latar px-2.5 py-0.5 text-xs font-semibold text-teks-lembut">
            Maks {kapasitasAktif} kg / tabung
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-teks">
            <span>Estimasi berat cucian (kg)</span>
            <input
              type="number"
              min="1"
              max="200"
              step="1"
              value={beratKg}
              onChange={(e) => handleBeratChange(e.target.value)}
              className="numeric min-h-[42px] w-full rounded-[10px] border border-garis-tegas bg-latar px-3.5 py-2 text-sm font-semibold text-teks focus:border-utama focus:outline-none"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-teks">Kebutuhan tabung / unit</span>
            <div className="flex min-h-[42px] items-center justify-between rounded-[10px] border border-garis-tegas bg-latar px-2">
              <button
                type="button"
                onClick={() => setJumlahTabung((prev) => Math.max(1, prev - 1))}
                aria-label="Kurangi jumlah tabung"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-base font-semibold text-teks hover:bg-permukaan"
              >
                -
              </button>
              <span className="numeric text-sm font-semibold text-teks">
                {jumlahTabung} tabung
              </span>
              <button
                type="button"
                onClick={() => setJumlahTabung((prev) => prev + 1)}
                aria-label="Tambah jumlah tabung"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-base font-semibold text-teks hover:bg-permukaan"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-garis rounded-[14px] border border-garis bg-latar">
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-teks-lembut">Estimasi Total Harga</span>
            <span className="numeric text-base font-semibold text-teks">
              {formatRupiah(totalHarga)}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-teks-lembut">Estimasi DP (50%)</span>
            <span className="numeric font-semibold text-utama">{formatRupiah(estimasiDp)}</span>
          </div>
        </div>

        <p className="rounded-[12px] bg-harga-latar px-3.5 py-2.5 text-xs leading-relaxed font-medium text-harga">
          Catatan: Berat final ditentukan berdasarkan timbangan digital di gerai. Kelebihan
          kapasitas per tabung akan disesuaikan dengan jumlah mesin yang digunakan.
        </p>
      </div>

      {/* Peringatan Stok / Mesin Penuh (US-19) */}
      {isHabis ? (
        <div className="rounded-[16px] border border-bahaya/30 bg-bahaya-latar p-4 text-sm text-bahaya">
          <p className="font-semibold">Layanan ini sedang penuh atau mesin dalam maintenance.</p>
          <p className="mt-1 text-xs">
            Silakan pantau{" "}
            <Link href="/antrean" className="font-semibold underline">
              papan antrean mesin
            </Link>{" "}
            atau pilih paket lain yang tersedia.
          </p>
        </div>
      ) : null}

      {/* Tombol Aksi */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isHabis}
          onClick={handleTambahKeranjang}
          className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-full border border-garis-tegas bg-latar px-5 py-2.5 text-sm font-semibold text-teks transition-all hover:border-utama hover:bg-permukaan hover:text-utama active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none"
        >
          {addedFeedback ? "Ditambahkan ke Keranjang" : "Tambah ke Keranjang"}
        </button>

        {isHabis ? (
          <button
            type="button"
            disabled
            className="inline-flex min-h-[44px] flex-1 cursor-not-allowed items-center justify-center rounded-full bg-utama px-6 py-2.5 text-sm font-semibold text-white opacity-45 sm:flex-none"
          >
            Pesan via WhatsApp
          </button>
        ) : (
          <a
            href={tautanWa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => catatKlikWa({ produkId: produk?.id, sumber: "kalkulator" })}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-utama px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-utama-gelap active:scale-[0.98] sm:flex-none"
          >
            Pesan via WhatsApp
          </a>
        )}

        {addedFeedback ? (
          <button
            type="button"
            onClick={openCart}
            className="cursor-pointer text-xs font-semibold text-utama hover:underline"
          >
            Buka Keranjang &#8250;
          </button>
        ) : null}
      </div>
    </div>
  );
}
