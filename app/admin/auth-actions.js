"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureAdminProfile, requireSuperAdmin } from "@/lib/supabase/session";
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function loginAdmin(_prevState, formData) {
  const clientIp = await getClientIp();
  const rateKey = `admin-login:${clientIp}`;

  const preCheck = checkRateLimit({
    key: rateKey,
    limit: LOGIN_MAX_ATTEMPTS,
    windowMs: LOGIN_WINDOW_MS,
    consume: false,
  });

  if (!preCheck.allowed) {
    return {
      error: `Terlalu banyak percobaan login gagal. Silakan tunggu ${preCheck.retryAfterMinutes} menit sebelum mencoba lagi.`,
    };
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !EMAIL_REGEX.test(email) || !password) {
    checkRateLimit({
      key: rateKey,
      limit: LOGIN_MAX_ATTEMPTS,
      windowMs: LOGIN_WINDOW_MS,
      consume: true,
    });
    return { error: "Masukkan email dan password yang valid." };
  }

  let redirectTarget = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !authData?.user) {
      const attempt = checkRateLimit({
        key: rateKey,
        limit: LOGIN_MAX_ATTEMPTS,
        windowMs: LOGIN_WINDOW_MS,
        consume: true,
      });

      if (!attempt.allowed) {
        return {
          error: `Terlalu banyak percobaan login gagal. Silakan tunggu ${attempt.retryAfterMinutes} menit sebelum mencoba lagi.`,
        };
      }

      return { error: "Email atau password salah. Silakan periksa kembali." };
    }

    const profile = await ensureAdminProfile({ supabase, user: authData.user });
    if (!profile.aktif) {
      await supabase.auth.signOut();
      return { error: "Akun admin ini sedang dinonaktifkan." };
    }

    resetRateLimit(rateKey);
    redirectTarget = profile.role === "SUPERADMIN" ? "/admin" : "/admin/jadwal";
  } catch {
    return { error: "Terjadi gangguan saat memproses login. Coba beberapa saat lagi." };
  }

  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return { error: "Login gagal diproses." };
}

export async function gantiPasswordAdmin(_prevState, formData) {
  let session;
  try {
    session = await requireSuperAdmin({ mode: "throw" });
  } catch {
    return { error: "Akses ditolak: fitur ini khusus untuk Superadmin." };
  }

  try {

    const passwordBaru = String(formData.get("password_baru") || "");
    const konfirmasiPassword = String(formData.get("konfirmasi_password") || "");

    if (passwordBaru.length < 8) {
      return { error: "Password baru minimal 8 karakter." };
    }

    if (passwordBaru !== konfirmasiPassword) {
      return { error: "Konfirmasi password tidak cocok dengan password baru." };
    }

    const { error } = await session.supabase.auth.updateUser({ password: passwordBaru });

    if (error) {
      return { error: "Gagal memperbarui password. Pastikan sesi aktif dan coba lagi." };
    }

    return { success: "Password berhasil diperbarui." };
  } catch {
    return { error: "Terjadi kesalahan saat memperbarui password." };
  }
}

export async function logoutAdmin() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Tetap arahkan ke halaman login agar sesi klien bersih.
  }

  redirect("/admin/login");
}
