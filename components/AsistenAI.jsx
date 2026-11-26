"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MAX_CHARS = 300;

const SARAN_PERTANYAAN = [
  "Cucian saya 9 kg, pilih paket apa?",
  "Berapa biaya paket cuci + kering?",
  "Ada paket kapasitas jumbo?",
];

export default function AsistenAI() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Halo! Saya asisten Laundro. Tanyakan tarif paket, estimasi jumlah tabung dari berat cucian Anda, atau ketersediaan mesin.",
    },
  ]);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  async function kirimPertanyaan(teks) {
    const pertanyaan = String(teks || "").trim();
    if (!pertanyaan || loading) return;

    if (pertanyaan.length > MAX_CHARS) {
      setErrorMsg(`Pertanyaan maksimal ${MAX_CHARS} karakter.`);
      return;
    }

    setErrorMsg("");
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", text: pertanyaan },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/asisten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pertanyaan }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.jawaban) {
        setErrorMsg(data?.error || "Gagal mendapatkan jawaban asisten. Silakan coba lagi.");
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: "assistant", text: String(data.jawaban) },
      ]);
    } catch {
      setErrorMsg("Koneksi bermasalah saat menghubungi asisten AI.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    kirimPertanyaan(input);
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3">
      {open ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="asisten-ai-judul"
          className="fixed right-4 bottom-20 left-4 flex max-h-[72vh] flex-col overflow-hidden rounded-[20px] border border-garis bg-latar shadow-[0_16px_44px_rgba(0,0,0,0.16)] sm:left-auto sm:w-[380px]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-garis bg-permukaan px-4 py-3.5">
            <div>
              <h2 id="asisten-ai-judul" className="text-sm font-semibold text-teks">
                Asisten Layanan Laundro
              </h2>
              <p className="text-xs text-teks-lembut">
                Rekomendasi paket &amp; info mesin real-time
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup asisten AI"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-latar text-teks transition-colors hover:bg-garis"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[16px] px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-utama text-white"
                      : "border border-garis bg-permukaan text-teks"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-[16px] border border-garis bg-permukaan px-3.5 py-2.5 text-xs font-medium text-teks-lembut">
                  Sedang menyusun rekomendasi...
                </div>
              </div>
            ) : null}

            {messages.length === 1 && !loading ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SARAN_PERTANYAAN.map((saran) => (
                  <button
                    key={saran}
                    type="button"
                    onClick={() => kirimPertanyaan(saran)}
                    className="cursor-pointer rounded-full border border-garis bg-latar px-3 py-1.5 text-left text-xs font-medium text-utama transition-colors hover:border-utama hover:bg-utama-lembut"
                  >
                    {saran}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {errorMsg ? (
            <p
              role="alert"
              className="mx-4 mb-2 rounded-[10px] border border-bahaya/30 bg-bahaya-latar px-3 py-2 text-xs font-medium text-bahaya"
            >
              {errorMsg}
            </p>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 border-t border-garis bg-permukaan p-3"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={MAX_CHARS}
                placeholder="Tanya paket atau berat cucian..."
                aria-label="Pertanyaan untuk asisten AI"
                disabled={loading}
                className="min-h-[44px] min-w-0 flex-1 rounded-full border border-garis-tegas bg-latar px-4 py-2 text-sm text-teks placeholder:text-teks-lembut focus:border-utama focus:outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || input.trim().length < 2}
                className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-utama px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-utama-gelap active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Kirim
              </button>
            </div>
            <div className="flex items-center justify-between px-1 text-xs text-teks-lembut">
              <span>Jawaban mengacu pada tarif &amp; stok gerai</span>
              <span className="numeric">
                {input.length}/{MAX_CHARS}
              </span>
            </div>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "Tutup asisten layanan" : "Buka asisten AI Laundro"}
        className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full bg-utama px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(0,0,0,0.2)] transition-all hover:bg-utama-gelap active:scale-[0.96]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M8 2.25C4.55 2.25 1.75 4.71 1.75 7.75C1.75 9.18 2.38 10.48 3.41 11.46L2.75 13.75L5.32 12.78C6.15 13.08 7.05 13.25 8 13.25C11.45 13.25 14.25 10.79 14.25 7.75C14.25 4.71 11.45 2.25 8 2.25Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <span>Tanya Asisten</span>
      </button>
    </div>
  );
}
