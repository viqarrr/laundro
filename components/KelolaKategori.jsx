"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import {
  hapusKategoriAction,
  tambahKategoriAction,
  ubahKategoriAction,
} from "@/app/admin/kategori-actions";

function buatSlugPreview(teks) {
  return String(teks || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-bahaya">{message}</p>;
}

export default function KelolaKategori({ daftarKategori }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [namaInput, setNamaInput] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [deskripsiInput, setDeskripsiInput] = useState("");
  const [urutanInput, setUrutanInput] = useState("0");
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(null);
  const [pesanHapusError, setPesanHapusError] = useState("");
  const [isDeleting, startDeleteTransition] = useTransition();

  const [stateTambah, actionTambah, pendingTambah] = useActionState(tambahKategoriAction, null);
  const [stateUbah, actionUbah, pendingUbah] = useActionState(ubahKategoriAction, null);

  const lastHandledSuccessRef = useRef(null);

  const activeState = editing ? stateUbah : stateTambah;
  const activeAction = editing ? actionUbah : actionTambah;
  const isSubmitting = editing ? pendingUbah : pendingTambah;

  useEffect(() => {
    if (activeState?.ok && activeState.success && lastHandledSuccessRef.current !== activeState) {
      lastHandledSuccessRef.current = activeState;
      setEditing(null);
      setNamaInput("");
      setSlugInput("");
      setSlugManual(false);
      setDeskripsiInput("");
      setUrutanInput("0");
      router.refresh();
    }
  }, [activeState, router]);

  function mulaiEdit(kat) {
    setPesanHapusError("");
    setEditing(kat);
    setNamaInput(kat.nama || "");
    setSlugInput(kat.slug || "");
    setSlugManual(true);
    setDeskripsiInput(kat.deskripsi || "");
    setUrutanInput(String(kat.urutan ?? 0));
  }

  function batalEdit() {
    setEditing(null);
    setNamaInput("");
    setSlugInput("");
    setSlugManual(false);
    setDeskripsiInput("");
    setUrutanInput("0");
  }

  function handleNamaChange(event) {
    const val = event.target.value;
    setNamaInput(val);
    if (!slugManual && !editing) {
      setSlugInput(buatSlugPreview(val));
    }
  }

  function handleSlugChange(event) {
    setSlugManual(true);
    setSlugInput(event.target.value);
  }

  function konfirmasiDanHapus() {
    if (!konfirmasiHapus) return;
    const target = konfirmasiHapus;
    setKonfirmasiHapus(null);
    setPesanHapusError("");

    startDeleteTransition(async () => {
      const res = await hapusKategoriAction(target.id);
      if (!res?.ok) {
        setPesanHapusError(res?.error || "Gagal menghapus kategori.");
        return;
      }
      if (editing?.id === target.id) {
        batalEdit();
      }
      router.refresh();
    });
  }

  const errors = activeState?.errors || {};

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      {/* Form Tambah / Ubah Kategori */}
      <form
        action={activeAction}
        className="flex flex-col gap-4 rounded-[20px] border border-garis bg-latar p-6"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-teks">
            {editing ? "Ubah Kategori" : "Tambah Kategori"}
          </h2>
          {editing ? (
            <button
              type="button"
              onClick={batalEdit}
              className="cursor-pointer text-xs font-semibold text-utama hover:underline"
            >
              Batal ubah
            </button>
          ) : null}
        </div>

        {activeState?.error ? (
          <p
            role="alert"
            className="rounded-[12px] border border-bahaya/30 bg-bahaya-latar px-3.5 py-2.5 text-xs font-medium text-bahaya"
          >
            {activeState.error}
          </p>
        ) : null}

        {activeState?.success ? (
          <p
            role="status"
            className="rounded-[12px] border border-sukses/30 bg-sukses-latar px-3.5 py-2.5 text-xs font-medium text-sukses"
          >
            {activeState.success}
          </p>
        ) : null}

        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

        <div className="flex flex-col gap-1">
          <Input
            label="Nama kategori"
            name="nama"
            value={namaInput}
            onChange={handleNamaChange}
            placeholder="Contoh: Cuci + Kering"
            required
          />
          <FieldError message={errors.nama} />
        </div>

        <div className="flex flex-col gap-1">
          <Input
            label="Slug URL (otomatis jika kosong)"
            name="slug"
            value={slugInput}
            onChange={handleSlugChange}
            placeholder="cuci-kering"
          />
          <FieldError message={errors.slug} />
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

        <div className="flex flex-col gap-1">
          <Input
            label="Deskripsi singkat (opsional)"
            name="deskripsi"
            textarea
            value={deskripsiInput}
            onChange={(e) => setDeskripsiInput(e.target.value)}
            placeholder="Jelaskan jenis layanan dalam kategori ini."
          />
          <FieldError message={errors.deskripsi} />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Tombol type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting
              ? "Menyimpan..."
              : editing
                ? "Simpan perubahan"
                : "Tambah kategori"}
          </Tombol>
          {editing ? (
            <Tombol type="button" varian="garis" onClick={batalEdit}>
              Batal
            </Tombol>
          ) : null}
        </div>
      </form>

      {/* Daftar Kategori */}
      <div className="flex flex-col gap-3">
        {pesanHapusError ? (
          <p
            role="alert"
            className="rounded-[14px] border border-bahaya/30 bg-bahaya-latar px-4 py-3 text-sm font-medium text-bahaya"
          >
            {pesanHapusError}
          </p>
        ) : null}

        {!daftarKategori || daftarKategori.length === 0 ? (
          <div className="rounded-[20px] border border-garis bg-permukaan p-8 text-center">
            <p className="text-[17px] font-semibold text-teks">Belum ada kategori tersimpan</p>
            <p className="mt-1 text-sm text-teks-lembut">
              Tambahkan kategori layanan menggunakan formulir di samping.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[20px] border border-garis bg-latar">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="bg-permukaan text-xs font-semibold uppercase tracking-[0.03em] text-teks-lembut">
                <tr>
                  <th className="px-4 py-3.5">Urut</th>
                  <th className="px-4 py-3.5">Kategori</th>
                  <th className="px-4 py-3.5">Slug</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {daftarKategori.map((kat) => (
                  <tr
                    key={kat.id}
                    className={`border-t border-garis transition-colors hover:bg-permukaan/50 ${
                      editing?.id === kat.id ? "bg-utama-lembut/40" : ""
                    }`}
                  >
                    <td className="numeric px-4 py-3.5 font-semibold text-teks-lembut">
                      {kat.urutan ?? 0}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-teks">{kat.nama}</p>
                      {kat.deskripsi ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-teks-lembut">
                          {kat.deskripsi}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-teks-lembut">{kat.slug}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Tombol
                          type="button"
                          varian="garis"
                          onClick={() => mulaiEdit(kat)}
                          className="min-h-[36px] px-3.5 py-1.5 text-xs"
                        >
                          Ubah
                        </Tombol>
                        <Tombol
                          type="button"
                          varian="bahaya"
                          disabled={isDeleting}
                          onClick={() => setKonfirmasiHapus(kat)}
                          className="min-h-[36px] px-3.5 py-1.5 text-xs"
                        >
                          Hapus
                        </Tombol>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {konfirmasiHapus ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-hapus-kategori-judul"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-[20px] border border-garis bg-latar p-6">
            <h2 id="dialog-hapus-kategori-judul" className="text-lg font-semibold text-teks">
              Hapus kategori?
            </h2>
            <p className="mt-2 text-sm text-teks-lembut">
              Kategori <span className="font-semibold text-teks">{konfirmasiHapus.nama}</span> akan
              dihapus dari daftar kategori. Paket layanan yang sudah memakai nama kategori ini tidak
              terhapus.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Tombol
                type="button"
                varian="garis"
                onClick={() => setKonfirmasiHapus(null)}
                className="min-h-[40px] px-4 py-2 text-sm"
              >
                Batal
              </Tombol>
              <Tombol
                type="button"
                varian="bahaya"
                onClick={konfirmasiDanHapus}
                className="min-h-[40px] border-bahaya bg-bahaya px-4 py-2 text-sm text-white hover:bg-bahaya/90 hover:text-white"
              >
                Ya, Hapus
              </Tombol>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
