"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import CustomSelect from "@/components/CustomSelect";
import Input from "@/components/Input";
import SwitchToggle from "@/components/SwitchToggle";
import Tombol from "@/components/Tombol";

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-bahaya">{message}</p>;
}

export default function FormProduk({
  produk = {},
  action,
  labelTombol = "Simpan produk",
  daftarKategori = [],
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef(null);

  const dbKategori = daftarKategori.map((k) => k.nama || k).filter(Boolean);
  const pilihanKategori = Array.from(
    new Set([...dbKategori, produk.kategori || ""])
  ).filter(Boolean);

  const [namaInput, setNamaInput] = useState(String(produk.nama || ""));
  const [kategoriInput, setKategoriInput] = useState(
    String(produk.kategori || pilihanKategori[0] || "")
  );
  const [badgeInput, setBadgeInput] = useState(String(produk.badge || ""));
  const [hargaInput, setHargaInput] = useState(
    produk.harga !== undefined && produk.harga !== null ? String(produk.harga) : ""
  );
  const [hargaCoretInput, setHargaCoretInput] = useState(
    produk.harga_coret !== undefined && produk.harga_coret !== null
      ? String(produk.harga_coret)
      : ""
  );
  const [capacityInput, setCapacityInput] = useState(String(produk.max_capacity_kg ?? 7));
  const [durationInput, setDurationInput] = useState(
    String(produk.cycle_duration_minutes ?? 40)
  );
  const [stokInput, setStokInput] = useState(String(produk.stok ?? 10));
  const [urutanInput, setUrutanInput] = useState(String(produk.urutan ?? 0));
  const [deskripsiInput, setDeskripsiInput] = useState(produk.deskripsi || "");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(produk.foto_url || "");
  const [fotoUrlInput, setFotoUrlInput] = useState(produk.foto_url || "");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [objectUrl, setObjectUrl] = useState(null);
  const [galeriList, setGaleriList] = useState(() =>
    Array.isArray(produk.galeri_foto) ? produk.galeri_foto.map(String) : []
  );
  const [varianList, setVarianList] = useState(() =>
    Array.isArray(produk.varian)
      ? produk.varian.map((v) => ({
          nama_ukuran: String(v?.nama_ukuran || ""),
          kapasitas_kg: String(v?.kapasitas_kg ?? ""),
          harga: String(v?.harga ?? ""),
          durasi_menit: String(v?.durasi_menit ?? ""),
        }))
      : []
  );

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  useEffect(() => {
    if (state?.values) {
      setNamaInput(String(state.values.nama ?? ""));
      setKategoriInput(String(state.values.kategori ?? ""));
      setBadgeInput(String(state.values.badge ?? ""));
      setHargaInput(String(state.values.harga ?? ""));
      setHargaCoretInput(String(state.values.harga_coret ?? ""));
      setCapacityInput(String(state.values.max_capacity_kg ?? ""));
      setDurationInput(String(state.values.cycle_duration_minutes ?? ""));
      setStokInput(String(state.values.stok ?? ""));
      setUrutanInput(String(state.values.urutan ?? ""));
      setFotoUrlInput(String(state.values.foto_url ?? ""));
      setDeskripsiInput(String(state.values.deskripsi ?? ""));
    }
  }, [state]);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }

    if (file) {
      const nextUrl = URL.createObjectURL(file);
      setObjectUrl(nextUrl);
      setPreviewUrl(nextUrl);
      setSelectedFileName(file.name);
    } else {
      setPreviewUrl(fotoUrlInput);
      setSelectedFileName("");
    }
  }

  function handleUrlChange(event) {
    const val = event.target.value;
    setFotoUrlInput(val);
    if (!objectUrl) {
      setPreviewUrl(val);
    }
  }

  async function handleBuatDeskripsiAi() {
    if (aiLoading) return;
    setAiError("");

    const fd = formRef.current ? new FormData(formRef.current) : null;
    const nama = String(fd?.get("nama") || "").trim();
    const kategori = String(fd?.get("kategori") || "").trim();
    const maxCapacityKg = Number(fd?.get("max_capacity_kg") || 7);
    const cycleDurationMinutes = Number(fd?.get("cycle_duration_minutes") || 40);

    if (nama.length < 2) {
      setAiError("Isi nama paket layanan terlebih dahulu sebelum membuat deskripsi AI.");
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/deskripsi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          kategori,
          max_capacity_kg: maxCapacityKg,
          cycle_duration_minutes: cycleDurationMinutes,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.deskripsi) {
        setAiError(data?.error || "Gagal membuat deskripsi AI. Silakan coba lagi.");
        return;
      }

      setDeskripsiInput(String(data.deskripsi));
    } catch {
      setAiError("Koneksi bermasalah saat menghubungi generator deskripsi AI.");
    } finally {
      setAiLoading(false);
    }
  }

  const errors = state?.errors || {};

  return (
    <form ref={formRef} action={formAction} className="flex max-w-2xl flex-col gap-5">
      {state?.error ? (
        <p
          role="alert"
          className="rounded-[14px] border border-bahaya/30 bg-bahaya-latar px-4 py-3 text-sm font-medium text-bahaya"
        >
          {state.error}
        </p>
      ) : null}

      {produk.id ? <input type="hidden" name="id" value={produk.id} /> : null}

      <div className="grid gap-5 rounded-[20px] border border-garis bg-latar p-6">
        <div className="flex flex-col gap-1">
          <Input
            label="Nama paket layanan"
            name="nama"
            value={namaInput}
            onChange={(e) => setNamaInput(e.target.value)}
            placeholder="Contoh: Paket Cuci + Kering Express"
            required
          />
          <FieldError message={errors.nama} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold tracking-[-0.01em] text-teks">
              Kategori
            </span>
            {pilihanKategori.length > 0 ? (
              <CustomSelect
                name="kategori"
                options={pilihanKategori}
                value={kategoriInput}
                onChange={setKategoriInput}
                ariaLabel="Pilih kategori layanan"
              />
            ) : (
              <div className="rounded-[12px] border border-harga/40 bg-harga-latar px-3.5 py-2.5 text-xs text-harga">
                Belum ada kategori di database.{" "}
                <Link href="/admin/kategori" className="font-semibold underline">
                  Tambah kategori terlebih dahulu
                </Link>
                .
                <input type="hidden" name="kategori" value="" />
              </div>
            )}
            <FieldError message={errors.kategori} />
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Badge penanda (opsional)"
              name="badge"
              value={badgeInput}
              onChange={(e) => setBadgeInput(e.target.value)}
              placeholder="Contoh: Terlaris, Promo Jam Sepi"
            />
            <FieldError message={errors.badge} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Input
              label="Harga aktif (Rp)"
              name="harga"
              type="number"
              min="1"
              step="1"
              value={hargaInput}
              onChange={(e) => setHargaInput(e.target.value)}
              required
            />
            <FieldError message={errors.harga} />
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Harga coret / sebelum diskon (opsional)"
              name="harga_coret"
              type="number"
              min="0"
              step="1"
              value={hargaCoretInput}
              onChange={(e) => setHargaCoretInput(e.target.value)}
              placeholder="Kosongkan jika tidak promo"
            />
            <FieldError message={errors.harga_coret} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <Input
              label="Kapasitas (kg)"
              name="max_capacity_kg"
              type="number"
              min="1"
              step="1"
              value={capacityInput}
              onChange={(e) => setCapacityInput(e.target.value)}
              required
            />
            <FieldError message={errors.max_capacity_kg} />
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Durasi (menit)"
              name="cycle_duration_minutes"
              type="number"
              min="1"
              step="1"
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
              required
            />
            <FieldError message={errors.cycle_duration_minutes} />
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Stok / Kuota"
              name="stok"
              type="number"
              min="0"
              step="1"
              value={stokInput}
              onChange={(e) => setStokInput(e.target.value)}
            />
            <FieldError message={errors.stok} />
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Urutan tampil"
              name="urutan"
              type="number"
              step="1"
              value={urutanInput}
              onChange={(e) => setUrutanInput(e.target.value)}
            />
            <FieldError message={errors.urutan} />
          </div>
        </div>

        {/* Toggle Switch Kustom ala Apple HIG (.inset-list + .hig-switch) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold tracking-[-0.01em] text-teks">
            Status &amp; Kebutuhan Mesin
          </span>
          <div className="divide-y divide-garis overflow-hidden rounded-[16px] border border-garis bg-latar">
            <SwitchToggle
              name="aktif"
              label="Tampilkan di Katalog Publik"
              description="Aktifkan agar paket muncul di halaman beranda dan dapat dipesan."
              defaultChecked={produk.aktif ?? true}
              tone="sukses"
            />
            <SwitchToggle
              name="requires_washer"
              label="Membutuhkan Unit Mesin Cuci (Washer)"
              description="Sistem akan memetakan slot waktu mesin cuci saat reservasi."
              defaultChecked={produk.requires_washer ?? false}
            />
            <SwitchToggle
              name="requires_dryer"
              label="Membutuhkan Unit Mesin Pengering (Dryer)"
              description="Sistem akan memetakan slot waktu pengering lanjutan saat reservasi."
              defaultChecked={produk.requires_dryer ?? false}
            />
          </div>
        </div>

        {/* Upload Foto Kustom + Preview */}
        <div className="grid gap-4 rounded-[16px] border border-garis bg-permukaan p-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
          <div className="flex aspect-square w-[120px] items-center justify-center overflow-hidden rounded-[12px] border border-garis bg-latar p-1.5">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview foto paket layanan"
                className="h-full w-full rounded-[8px] object-cover shadow-product"
              />
            ) : (
              <span className="px-2 text-center text-xs text-teks-lembut">Belum ada foto</span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-teks">
                Unggah foto layanan (JPG, PNG, WebP, maks 2 MB)
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full border border-garis-tegas bg-latar px-4 py-1.5 text-xs font-semibold text-teks transition-colors hover:border-utama hover:text-utama">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M8 10.5V3M8 3L5 6M8 3L11 6M3 12.5H13"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Pilih File Gambar</span>
                  <input
                    type="file"
                    name="foto_file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                <span className="truncate text-xs text-teks-lembut">
                  {selectedFileName || "Belum ada file baru dipilih"}
                </span>
              </div>
              <FieldError message={errors.foto_file} />
            </div>

            <div className="flex flex-col gap-1">
              <Input
                label="Atau link / path foto fallback"
                name="foto_url"
                value={fotoUrlInput}
                onChange={handleUrlChange}
                placeholder="/images/hero-machines.jpg atau https://..."
              />
              <FieldError message={errors.foto_url} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="input-deskripsi-produk"
              className="text-[13px] font-semibold tracking-[-0.01em] text-teks"
            >
              Deskripsi layanan
            </label>
            <button
              type="button"
              onClick={handleBuatDeskripsiAi}
              disabled={aiLoading || isPending}
              className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border border-garis-tegas bg-permukaan px-3.5 py-1 text-xs font-semibold text-utama transition-colors hover:border-utama hover:bg-utama-lembut disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiLoading ? "Menyusun deskripsi..." : "Buat Deskripsi AI"}
            </button>
          </div>
          <textarea
            id="input-deskripsi-produk"
            name="deskripsi"
            rows={4}
            value={deskripsiInput}
            onChange={(e) => setDeskripsiInput(e.target.value)}
            placeholder="Jelaskan cakupan layanan, kapasitas drum, dan perkiraan waktu selesai."
            required
            className="min-h-[44px] w-full rounded-[8px] border border-garis-tegas bg-latar px-3.5 py-2.5 text-[15px] text-teks placeholder:text-teks-lembut transition-colors focus:border-utama focus:outline-none"
          />
          {aiError ? <FieldError message={aiError} /> : null}
          <FieldError message={errors.deskripsi} />
        </div>

        {/* Galeri Foto Tambahan (US-18) */}
        <div className="flex flex-col gap-3 rounded-[16px] border border-garis bg-permukaan p-4">
          <input type="hidden" name="galeri_foto_json" value={JSON.stringify(galeriList)} />
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[13px] font-semibold text-teks">Galeri Foto Tambahan (opsional)</p>
              <p className="text-xs text-teks-lembut">
                Tambahkan URL atau path foto tambahan untuk ditampilkan sebagai thumbnail di detail layanan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGaleriList((prev) => [...prev, ""])}
              className="inline-flex min-h-[34px] shrink-0 cursor-pointer items-center rounded-full border border-garis-tegas bg-latar px-3 py-1 text-xs font-semibold text-utama hover:border-utama"
            >
              + Tambah Foto
            </button>
          </div>

          {galeriList.length > 0 ? (
            <div className="flex flex-col gap-2">
              {galeriList.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) =>
                      setGaleriList((prev) =>
                        prev.map((item, i) => (i === idx ? e.target.value : item))
                      )
                    }
                    placeholder="/images/dark-drum.jpg atau https://..."
                    className="min-h-[40px] flex-1 rounded-[8px] border border-garis-tegas bg-latar px-3 py-1.5 text-sm text-teks placeholder:text-teks-lembut focus:border-utama focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setGaleriList((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="inline-flex min-h-[40px] cursor-pointer items-center rounded-[8px] border border-garis bg-latar px-3 text-xs font-semibold text-bahaya hover:border-bahaya"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <FieldError message={errors.galeri_foto} />
        </div>

        {/* Varian Ukuran Tabung (US-48) */}
        <div className="flex flex-col gap-3 rounded-[16px] border border-garis bg-permukaan p-4">
          <input type="hidden" name="varian_json" value={JSON.stringify(varianList)} />
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[13px] font-semibold text-teks">Varian Ukuran Tabung (opsional)</p>
              <p className="text-xs text-teks-lembut">
                Sediakan pilihan ukuran seperti Standar 7 kg atau Jumbo 10 kg dengan tarif khusus.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setVarianList((prev) => [
                  ...prev,
                  { nama_ukuran: "", kapasitas_kg: "7", harga: "", durasi_menit: "40" },
                ])
              }
              className="inline-flex min-h-[34px] shrink-0 cursor-pointer items-center rounded-full border border-garis-tegas bg-latar px-3 py-1 text-xs font-semibold text-utama hover:border-utama"
            >
              + Tambah Varian
            </button>
          </div>

          {varianList.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {varianList.map((row, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 rounded-[12px] border border-garis bg-latar p-3 sm:grid-cols-[1.5fr_0.8fr_1fr_0.8fr_auto] sm:items-center"
                >
                  <input
                    type="text"
                    value={row.nama_ukuran}
                    onChange={(e) =>
                      setVarianList((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, nama_ukuran: e.target.value } : item
                        )
                      )
                    }
                    placeholder="Nama (mis. Standar 7 kg)"
                    className="min-h-[38px] rounded-[8px] border border-garis-tegas bg-latar px-2.5 py-1.5 text-xs text-teks focus:border-utama focus:outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    value={row.kapasitas_kg}
                    onChange={(e) =>
                      setVarianList((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, kapasitas_kg: e.target.value } : item
                        )
                      )
                    }
                    placeholder="Kg"
                    aria-label="Kapasitas varian (kg)"
                    className="numeric min-h-[38px] rounded-[8px] border border-garis-tegas bg-latar px-2.5 py-1.5 text-xs text-teks focus:border-utama focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    value={row.harga}
                    onChange={(e) =>
                      setVarianList((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, harga: e.target.value } : item
                        )
                      )
                    }
                    placeholder="Harga (Rp)"
                    aria-label="Harga varian (Rp)"
                    className="numeric min-h-[38px] rounded-[8px] border border-garis-tegas bg-latar px-2.5 py-1.5 text-xs text-teks focus:border-utama focus:outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    value={row.durasi_menit}
                    onChange={(e) =>
                      setVarianList((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, durasi_menit: e.target.value } : item
                        )
                      )
                    }
                    placeholder="Mnt"
                    aria-label="Durasi varian (menit)"
                    className="numeric min-h-[38px] rounded-[8px] border border-garis-tegas bg-latar px-2.5 py-1.5 text-xs text-teks focus:border-utama focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVarianList((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="inline-flex min-h-[38px] cursor-pointer items-center justify-center rounded-[8px] border border-garis bg-latar px-3 text-xs font-semibold text-bahaya hover:border-bahaya"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <FieldError message={errors.varian} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tombol type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : labelTombol}
        </Tombol>
        <Tombol href="/admin" varian="garis">
          Batal
        </Tombol>
      </div>
    </form>
  );
}
