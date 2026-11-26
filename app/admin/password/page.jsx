import NavAdmin from "@/components/NavAdmin";
import FormGantiPassword from "./FormGantiPassword";
import { requireSuperAdmin } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export default async function HalamanGantiPassword() {
  await requireSuperAdmin();

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-teks">Ganti password</h1>
        <p className="mt-1 text-sm text-teks-lembut">
          Ganti password bawaan segera setelah pertama kali masuk. Minimal 8 karakter.
        </p>
      </div>
      <FormGantiPassword />
    </div>
  );
}
