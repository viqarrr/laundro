"use client";

import { useActionState, useEffect, useState } from "react";
import CustomSelect from "@/components/CustomSelect";
import Input from "@/components/Input";
import SwitchToggle from "@/components/SwitchToggle";
import Tombol from "@/components/Tombol";

const KATEGORI_DEFAULT = ["Cuci + Kering", "Cuci Saja", "Kering Saja", "Add-on & Jasa"];

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
  const [previewUrl, setPreviewUrl] = useState(produk.foto_url || "");
  const [fotoUrlInput, setFotoUrlInput] = useState(produk.foto_url || "");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const dbKategori = daftarKategori.map((k) => k.nama || k).filter(Boolean);
  const sumberKategori = dbKategori.length > 0 ? dbKategori : KATEGORI_DEFAULT;
  const pilihanKategori = Array.from(
    new Set([...sumberKategori, produk.kategori || ""])
  ).filter(Boolean);

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

  const errors = state?.errors || {};

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
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
            defaultValue={produk.nama || ""}
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
            <CustomSelect
              name="kategori"
              options={pilihanKategori}
              defaultValue={produk.kategori || pilihanKategori[0] || "Cuci + Kering"}
              ariaLabel="Pilih kategori layanan"
            />
            <FieldError message={errors.kategori} />
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Badge penanda (opsional)"
              name="badge"
              defaultValue={produk.badge || ""}
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
              min="0"
              step="1"
              defaultValue={produk.harga ?? ""}
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
              defaultValue={produk.harga_coret ?? ""}
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
              defaultValue={produk.max_capacity_kg ?? 7}
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
              defaultValue={produk.cycle_duration_minutes ?? 40}
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
              defaultValue={produk.stok ?? 10}
            />
            <FieldError message={errors.stok} />
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Urutan tampil"
              name="urutan"
              type="number"
              step="1"
              defaultValue={produk.urutan ?? 0}
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

        <div className="flex flex-col gap-1">
          <Input
            label="Deskripsi layanan"
            name="deskripsi"
            textarea
            defaultValue={produk.deskripsi || ""}
            placeholder="Jelaskan cakupan layanan, kapasitas drum, dan perkiraan waktu selesai."
            required
          />
          <FieldError message={errors.deskripsi} />
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
