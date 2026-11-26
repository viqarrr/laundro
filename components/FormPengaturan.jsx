"use client";

import { useActionState, useState } from "react";
import CustomSelect from "@/components/CustomSelect";
import Input from "@/components/Input";
import SwitchToggle from "@/components/SwitchToggle";
import Tombol from "@/components/Tombol";
import { simpanPengaturanAction } from "@/app/admin/pengaturan-actions";

const DP_TYPE_OPTIONS = [
  { value: "FIXED", label: "Nominal Tetap (Rp)" },
  { value: "PERCENTAGE", label: "Persentase (%)" },
];

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-bahaya">{message}</p>;
}

export default function FormPengaturan({ pengaturan }) {
  const [state, formAction, isPending] = useActionState(simpanPengaturanAction, null);
  const [dpType, setDpType] = useState(pengaturan?.dp_type || "FIXED");

  const errors = state?.errors || {};

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      {state?.error ? (
        <p
          role="alert"
          className="rounded-[14px] border border-bahaya/30 bg-bahaya-latar px-4 py-3 text-sm font-medium text-bahaya"
        >
          {state.error}
        </p>
      ) : null}

      {state?.success ? (
        <p
          role="status"
          className="rounded-[14px] border border-sukses/30 bg-sukses-latar px-4 py-3 text-sm font-medium text-sukses"
        >
          {state.success}
        </p>
      ) : null}

      {/* Identitas & Jam Operasional Gerai */}
      <section className="flex flex-col gap-4 rounded-[20px] border border-garis bg-latar p-6">
        <div>
          <h2 className="text-lg font-semibold text-teks">Identitas &amp; Operasional Gerai</h2>
          <p className="mt-0.5 text-xs text-teks-lembut">
            Perubahan langsung tampil di Header, Footer, tombol WhatsApp, dan halaman Tentang.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Input
              label="Nama gerai"
              name="nama_gerai"
              defaultValue={pengaturan?.nama_gerai || "Laundro"}
              required
            />
            <FieldError message={errors.nama_gerai} />
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Nomor WhatsApp (format 628xxx)"
              name="nomor_wa"
              defaultValue={pengaturan?.nomor_wa || "6281234567890"}
              required
            />
            <FieldError message={errors.nomor_wa} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Input
            label="Alamat lengkap gerai"
            name="alamat"
            defaultValue={pengaturan?.alamat || ""}
            required
          />
          <FieldError message={errors.alamat} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Input
              label="Jam buka (HH:MM)"
              name="jam_buka"
              defaultValue={pengaturan?.jam_buka || "07:00"}
              placeholder="07:00"
              required
            />
            <FieldError message={errors.jam_buka} />
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Jam tutup (HH:MM)"
              name="jam_tutup"
              defaultValue={pengaturan?.jam_tutup || "22:00"}
              placeholder="22:00"
              required
            />
            <FieldError message={errors.jam_tutup} />
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Buffer transisi mesin (menit)"
              name="buffer_minutes"
              type="number"
              min="0"
              max="120"
              defaultValue={pengaturan?.buffer_minutes ?? 5}
              required
            />
            <FieldError message={errors.buffer_minutes} />
          </div>
        </div>
      </section>

      {/* Aturan DP & Rekening */}
      <section className="flex flex-col gap-4 rounded-[20px] border border-garis bg-latar p-6">
        <div>
          <h2 className="text-lg font-semibold text-teks">Aturan DP &amp; Rekening Transfer</h2>
          <p className="mt-0.5 text-xs text-teks-lembut">
            Digunakan oleh kalkulator biaya dan halaman konfirmasi DP pelanggan.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold tracking-[-0.01em] text-teks">
              Tipe perhitungan DP
            </span>
            <CustomSelect
              name="dp_type"
              options={DP_TYPE_OPTIONS}
              value={dpType}
              onChange={setDpType}
              ariaLabel="Tipe perhitungan DP"
            />
            <FieldError message={errors.dp_type} />
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label={dpType === "PERCENTAGE" ? "Persentase DP (%)" : "Nominal DP tetap (Rp)"}
              name="dp_value"
              type="number"
              min="0"
              max={dpType === "PERCENTAGE" ? "100" : undefined}
              defaultValue={pengaturan?.dp_value ?? 15000}
              required
            />
            <FieldError message={errors.dp_value} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Input
            label="Info rekening / e-wallet tujuan DP"
            name="info_rekening"
            textarea
            defaultValue={pengaturan?.info_rekening || ""}
            placeholder="Contoh: BCA 1234567890 a.n. Laundro Coin / QRIS Gerai Laundro"
          />
          <FieldError message={errors.info_rekening} />
        </div>
      </section>

      {/* Banner Promo Beranda (US-42) */}
      <section className="flex flex-col gap-4 rounded-[20px] border border-garis bg-latar p-6">
        <div>
          <h2 className="text-lg font-semibold text-teks">Banner Promo Beranda</h2>
          <p className="mt-0.5 text-xs text-teks-lembut">
            Tampilkan pengumuman atau promo jam sepi di bagian atas halaman beranda.
          </p>
        </div>

        <div className="overflow-hidden rounded-[16px] border border-garis bg-latar">
          <SwitchToggle
            name="banner_aktif"
            label="Aktifkan Banner Promo di Beranda"
            description="Jika dinonaktifkan, banner tidak ditampilkan kepada pengunjung."
            defaultChecked={Boolean(pengaturan?.banner_aktif)}
            tone="sukses"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Input
              label="Judul banner promo"
              name="banner_judul"
              defaultValue={pengaturan?.banner_judul || ""}
              placeholder="Contoh: Promo Jam Sepi: Cuci + Kering Rp20.000"
            />
            <FieldError message={errors.banner_judul} />
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Teks tombol CTA"
              name="banner_cta"
              defaultValue={pengaturan?.banner_cta || "Cek Antrean Mesin"}
              placeholder="Cek Antrean Mesin"
            />
            <FieldError message={errors.banner_cta} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Input
              label="Subjudul / syarat promo"
              name="banner_subjudul"
              defaultValue={pengaturan?.banner_subjudul || ""}
              placeholder="Berlaku Senin - Kamis pukul 09.00 - 15.00 WIB."
            />
            <FieldError message={errors.banner_subjudul} />
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Tautan tombol CTA"
              name="banner_link"
              defaultValue={pengaturan?.banner_link || "/antrean"}
              placeholder="/antrean atau /kategori/cuci-kering"
            />
            <FieldError message={errors.banner_link} />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Tombol type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </Tombol>
      </div>
    </form>
  );
}
