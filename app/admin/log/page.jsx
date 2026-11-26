import Link from "next/link";
import NavAdmin from "@/components/NavAdmin";
import Tombol from "@/components/Tombol";
import { requireSuperAdmin } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

const PER_PAGE = 15;

function buatUrlLog({ aksi, page }) {
  const params = new URLSearchParams();
  if (aksi) params.set("aksi", aksi);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/log?${qs}` : "/admin/log";
}

function formatWaktu(iso) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso));
  } catch {
    return String(iso || "-");
  }
}

export default async function HalamanLogAdmin({ searchParams }) {
  const { supabase } = await requireSuperAdmin();
  const sp = await searchParams;

  const aksiFilter = String(sp?.aksi || "").trim();
  const pageRaw = Number(sp?.page || 1);
  const currentPage = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  let query = supabase
    .from("admin_logs")
    .select("id, admin_email, aksi, entitas, entitas_id, detail, created_at", {
      count: "exact",
    });

  if (aksiFilter) {
    query = query.eq("aksi", aksiFilter);
  }

  const from = (currentPage - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const [{ data, count, error }, { data: aksiRows }] = await Promise.all([
    query.order("created_at", { ascending: false }).range(from, to),
    supabase.from("admin_logs").select("aksi").order("created_at", { ascending: false }).limit(100),
  ]);

  const daftarLog = error ? [] : data || [];
  const totalCount = error ? 0 : count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const daftarAksi = Array.from(new Set((aksiRows || []).map((r) => r.aksi).filter(Boolean)));

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-teks">
            Log Aktivitas Admin
          </h1>
          <p className="numeric mt-1 text-sm text-teks-lembut">
            Menampilkan {daftarLog.length} dari {totalCount} catatan aktivitas operasional
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/log"
            className={`inline-flex min-h-[36px] items-center rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
              !aksiFilter
                ? "bg-utama text-white"
                : "border border-garis bg-latar text-teks-lembut hover:border-garis-tegas"
            }`}
          >
            Semua Aksi
          </Link>
          {daftarAksi.map((aksi) => (
            <Link
              key={aksi}
              href={buatUrlLog({ aksi, page: 1 })}
              className={`inline-flex min-h-[36px] items-center rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                aksiFilter === aksi
                  ? "bg-utama text-white"
                  : "border border-garis bg-latar text-teks-lembut hover:border-garis-tegas"
              }`}
            >
              {aksi}
            </Link>
          ))}
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-[14px] border border-bahaya/30 bg-bahaya-latar px-4 py-3 text-sm font-medium text-bahaya"
        >
          Gagal memuat riwayat log aktivitas.
        </p>
      ) : daftarLog.length === 0 ? (
        <div className="rounded-[20px] border border-garis bg-permukaan p-8 text-center">
          <p className="text-base font-semibold text-teks">Belum ada riwayat aktivitas</p>
          <p className="mt-1 text-sm text-teks-lembut">
            Setiap perubahan layanan, kategori, akun, pengaturan, dan jadwal akan tercatat di sini.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[20px] border border-garis bg-latar">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-permukaan text-xs font-semibold uppercase tracking-[0.03em] text-teks-lembut">
              <tr>
                <th className="px-4 py-3.5">Waktu</th>
                <th className="px-4 py-3.5">Admin</th>
                <th className="px-4 py-3.5">Aksi</th>
                <th className="px-4 py-3.5">Entitas</th>
                <th className="px-4 py-3.5">Ringkasan Detail</th>
              </tr>
            </thead>
            <tbody>
              {daftarLog.map((log) => (
                <tr key={log.id} className="border-t border-garis">
                  <td className="numeric whitespace-nowrap px-4 py-3 text-xs text-teks-lembut">
                    {formatWaktu(log.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-teks">{log.admin_email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-utama-lembut px-2.5 py-0.5 text-xs font-semibold text-utama">
                      {log.aksi}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-teks-lembut">
                    {log.entitas}
                    {log.entitas_id ? ` #${log.entitas_id}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-teks-lembut">
                    {log.detail && Object.keys(log.detail).length > 0
                      ? Object.entries(log.detail)
                          .map(([k, v]) => `${k}: ${String(v)}`)
                          .join(" · ")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="Paginasi log admin"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-garis pt-4 text-sm"
        >
          <span className="numeric text-teks-lembut">
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Tombol
                href={buatUrlLog({ aksi: aksiFilter, page: currentPage - 1 })}
                varian="garis"
                className="min-h-[38px] px-4 py-1.5 text-xs"
              >
                Sebelumnya
              </Tombol>
            ) : null}
            {currentPage < totalPages ? (
              <Tombol
                href={buatUrlLog({ aksi: aksiFilter, page: currentPage + 1 })}
                varian="garis"
                className="min-h-[38px] px-4 py-1.5 text-xs"
              >
                Berikutnya
              </Tombol>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
