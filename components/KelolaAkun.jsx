"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import CustomSelect from "@/components/CustomSelect";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import {
  tambahAkunAdminAction,
  toggleAktifAkunAction,
  ubahRoleAkunAction,
} from "@/app/admin/akun-actions";

const ROLE_OPTIONS = [
  { value: "STAFF", label: "STAFF (Penjaga Outlet)" },
  { value: "SUPERADMIN", label: "SUPERADMIN (Pemilik)" },
];

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-bahaya">{message}</p>;
}

export default function KelolaAkun({
  daftarAkun = [],
  currentUserId,
  currentUserEmail = "",
}) {
  const router = useRouter();
  const formRef = useRef(null);
  const [state, formAction, isPending] = useActionState(tambahAkunAdminAction, null);
  const [roleTambah, setRoleTambah] = useState("STAFF");
  const [aksiError, setAksiError] = useState("");
  const [isMutating, startTransition] = useTransition();

  useEffect(() => {
    if (state?.ok && state.success) {
      formRef.current?.reset();
      setRoleTambah("STAFF");
      router.refresh();
    }
  }, [state, router]);

  function handleRoleChange(userId, nextRole) {
    setAksiError("");
    startTransition(async () => {
      const res = await ubahRoleAkunAction(userId, nextRole);
      if (!res?.ok) {
        setAksiError(res?.error || "Gagal mengubah peran akun.");
        return;
      }
      router.refresh();
    });
  }

  function handleToggleAktif(userId, nextAktif) {
    setAksiError("");
    startTransition(async () => {
      const res = await toggleAktifAkunAction(userId, nextAktif);
      if (!res?.ok) {
        setAksiError(res?.error || "Gagal mengubah status akun.");
        return;
      }
      router.refresh();
    });
  }

  const errors = state?.errors || {};

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-4 rounded-[20px] border border-garis bg-latar p-6"
      >
        <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-teks">
          Tambah Akun Pengelola
        </h2>

        {state?.error ? (
          <p
            role="alert"
            className="rounded-[12px] border border-bahaya/30 bg-bahaya-latar px-3.5 py-2.5 text-xs font-medium text-bahaya"
          >
            {state.error}
          </p>
        ) : null}

        {state?.success ? (
          <p
            role="status"
            className="rounded-[12px] border border-sukses/30 bg-sukses-latar px-3.5 py-2.5 text-xs font-medium text-sukses"
          >
            {state.success}
          </p>
        ) : null}

        <div className="flex flex-col gap-1">
          <Input label="Nama lengkap" name="nama" placeholder="Contoh: Rina Kasir" required />
          <FieldError message={errors.nama} />
        </div>

        <div className="flex flex-col gap-1">
          <Input
            label="Email login"
            name="email"
            type="email"
            placeholder="staff@laundro.id"
            required
          />
          <FieldError message={errors.email} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-teks">Peran akun</span>
          <CustomSelect
            name="role"
            options={ROLE_OPTIONS}
            value={roleTambah}
            onChange={setRoleTambah}
            ariaLabel="Pilih peran akun"
          />
          <FieldError message={errors.role} />
        </div>

        <div className="flex flex-col gap-1">
          <Input
            label="Password awal (opsional, min. 8 karakter)"
            name="password_awal"
            type="password"
            placeholder="Isi untuk membuat akun login baru sekaligus"
          />
          <FieldError message={errors.password_awal} />
        </div>

        <Tombol type="submit" disabled={isPending} className="mt-1">
          {isPending ? "Menyimpan..." : "Tambah Akun"}
        </Tombol>
      </form>

      <div className="flex flex-col gap-3">
        {aksiError ? (
          <p
            role="alert"
            className="rounded-[14px] border border-bahaya/30 bg-bahaya-latar px-4 py-3 text-sm font-medium text-bahaya"
          >
            {aksiError}
          </p>
        ) : null}

        <div className="overflow-x-auto rounded-[20px] border border-garis bg-latar">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-permukaan text-xs font-semibold uppercase tracking-[0.03em] text-teks-lembut">
              <tr>
                <th className="px-4 py-3.5">Pengelola</th>
                <th className="px-4 py-3.5">Peran</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {daftarAkun.map((akun) => {
                const isSelf =
                  akun.user_id === currentUserId ||
                  (currentUserEmail &&
                    String(akun.email || "").toLowerCase() ===
                      String(currentUserEmail).toLowerCase());
                return (
                  <tr key={akun.user_id} className="border-t border-garis">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-teks">
                        {akun.nama}
                        {isSelf ? (
                          <span className="ml-2 rounded-full bg-utama-lembut px-2 py-0.5 text-[11px] font-semibold text-utama">
                            Anda
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-teks-lembut">{akun.email}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          akun.role === "SUPERADMIN"
                            ? "bg-utama-lembut text-utama"
                            : "bg-permukaan text-teks-lembut"
                        }`}
                      >
                        {akun.role}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          akun.aktif
                            ? "bg-sukses-latar text-sukses"
                            : "bg-bahaya-latar text-bahaya"
                        }`}
                      >
                        {akun.aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Tombol
                          type="button"
                          varian="garis"
                          disabled={isMutating || isSelf}
                          onClick={() =>
                            handleRoleChange(
                              akun.user_id,
                              akun.role === "SUPERADMIN" ? "STAFF" : "SUPERADMIN"
                            )
                          }
                          className="min-h-[34px] px-3 py-1 text-xs"
                        >
                          Jadikan {akun.role === "SUPERADMIN" ? "STAFF" : "SUPERADMIN"}
                        </Tombol>

                        <Tombol
                          type="button"
                          varian={akun.aktif ? "bahaya" : "lembut"}
                          disabled={isMutating || (isSelf && akun.aktif)}
                          onClick={() => handleToggleAktif(akun.user_id, !akun.aktif)}
                          className="min-h-[34px] px-3 py-1 text-xs"
                        >
                          {akun.aktif ? "Nonaktifkan" : "Aktifkan"}
                        </Tombol>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
