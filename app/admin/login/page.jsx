import { redirect } from "next/navigation";
import FormLogin from "./FormLogin";
import { getAdminSession } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export default async function HalamanLogin() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-12">
      <div className="rounded-[20px] border border-garis bg-latar p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-utama">Portal Admin</p>
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-teks">
            Masuk admin
          </h1>
          <p className="mt-1.5 text-sm text-teks-lembut">
            Khusus pengelola gerai untuk mengatur layanan dan antrean mesin.
          </p>
        </div>

        <FormLogin />
      </div>
    </div>
  );
}
