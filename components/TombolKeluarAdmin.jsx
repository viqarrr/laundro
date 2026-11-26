"use client";

import { useActionState } from "react";
import { logoutAdmin } from "@/app/admin/auth-actions";

export default function TombolKeluarAdmin() {
  const [state, formAction, isPending] = useActionState(logoutAdmin, null);

  return (
    <form action={formAction} className="ml-auto flex items-center gap-2">
      {state?.error ? (
        <span role="alert" className="text-xs font-medium text-bahaya">
          {state.error}
        </span>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-[38px] cursor-pointer items-center rounded-full border border-garis bg-latar px-4 py-1.5 text-sm font-semibold text-teks-lembut transition-colors hover:border-bahaya hover:bg-bahaya-latar hover:text-bahaya disabled:opacity-50"
      >
        {isPending ? "Keluar..." : "Keluar"}
      </button>
    </form>
  );
}
