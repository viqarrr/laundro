"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Tombol from "@/components/Tombol";
import { imporProdukCsvAction } from "@/app/admin/csv-actions";

const TEMPLATE_CSV = [
  "nama,kategori,harga,deskripsi,max_capacity_kg,cycle_duration_minutes,stok,aktif",
  '"Paket Cuci + Kering Malam","Cuci + Kering",23000,"Paket cuci dan pengeringan hemat untuk jadwal malam hari.",7,80,10,true',
  '"Add-on Pelembut Ekstra","Add-on & Jasa",4000,"Tambahan takaran pelembut aroma segar untuk satu siklus cuci.",7,5,30,true',
].join("\r\n");

export default function ImporCsvModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [state, formAction, isPending] = useActionState(imporProdukCsvAction, null);

  useEffect(() => {
    if (state?.ok && state.berhasilCount > 0) {
      router.refresh();
    }
  }, [state, router]);

  function handleDownloadTemplate() {
    const blob = new Blob([`\uFEFF${TEMPLATE_CSV}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template-impor-produk-laundro.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Tombol
        type="button"
        varian="garis"
        onClick={() => setOpen(true)}
        className="min-h-[40px] px-4 py-2 text-xs"
      >
        Impor CSV
      </Tombol>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-impor-csv-judul"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <div className="flex max-h-[88vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-[20px] border border-garis bg-latar p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="modal-impor-csv-judul" className="text-lg font-semibold text-teks">
                  Impor Paket Layanan dari CSV
                </h2>
                <p className="mt-1 text-xs text-teks-lembut">
                  Tambahkan banyak paket sekaligus menggunakan template CSV UTF-8.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup modal impor CSV"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-permukaan text-teks hover:bg-garis"
              >
                ×
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-garis bg-permukaan p-3.5 text-xs">
              <span className="text-teks-lembut">Belum punya format kolomnya?</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="cursor-pointer font-semibold text-utama hover:underline"
              >
                Unduh Template CSV
              </button>
            </div>

            <form action={formAction} className="flex flex-col gap-4">
              {state?.error ? (
                <p
                  role="alert"
                  className="rounded-[12px] border border-bahaya/30 bg-bahaya-latar px-3.5 py-2.5 text-xs font-medium text-bahaya"
                >
                  {state.error}
                </p>
              ) : null}

              {state?.ok ? (
                <div className="flex flex-col gap-2 rounded-[14px] border border-garis bg-permukaan p-4 text-xs">
                  <p className="font-semibold text-sukses">
                    {state.berhasilCount} baris paket layanan berhasil diimpor.
                  </p>
                  {state.gagalList && state.gagalList.length > 0 ? (
                    <div>
                      <p className="font-semibold text-bahaya">
                        {state.gagalList.length} baris gagal divalidasi:
                      </p>
                      <ul className="mt-1.5 flex max-h-36 flex-col gap-1 overflow-y-auto text-teks-lembut">
                        {state.gagalList.map((item, idx) => (
                          <li key={idx}>
                            Baris {item.baris} ({item.nama}): {item.alasan}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-dashed border-garis-tegas bg-permukaan p-4">
                <label className="inline-flex min-h-[38px] cursor-pointer items-center rounded-full border border-garis-tegas bg-latar px-4 py-1.5 text-xs font-semibold text-teks hover:border-utama hover:text-utama">
                  <span>Pilih File .CSV</span>
                  <input
                    type="file"
                    name="csv_file"
                    accept=".csv,text/csv"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                    required
                    className="sr-only"
                  />
                </label>
                <span className="truncate text-xs text-teks-lembut">
                  {fileName || "Belum ada file dipilih (maks. 2 MB)"}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Tombol type="button" varian="garis" onClick={() => setOpen(false)}>
                  Tutup
                </Tombol>
                <Tombol type="submit" disabled={isPending}>
                  {isPending ? "Memproses..." : "Unggah & Impor"}
                </Tombol>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
