"use client";

import { useActionState } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { loginAdmin } from "@/app/admin/auth-actions";

export default function FormLogin() {
  const [state, formAction, isPending] = useActionState(loginAdmin, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error ? (
        <p
          role="alert"
          className="rounded-[14px] border border-bahaya/30 bg-bahaya-latar px-4 py-3 text-sm font-medium text-bahaya"
        >
          {state.error}
        </p>
      ) : null}

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="admin@laundro.id"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Masukkan password"
        required
      />

      <Tombol type="submit" disabled={isPending} className="mt-1 w-full">
        {isPending ? "Memproses..." : "Masuk"}
      </Tombol>
    </form>
  );
}
