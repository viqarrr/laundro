const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const MODEL_CACHE_TTL_MS = 10 * 60 * 1000;

let cachedModels = [];
let cachedAt = 0;

export function sanitasiTeksAi(text) {
  return String(text || "")
    .replace(/[\u2014\u2013]/g, "-")
    .replace(/\r\n/g, "\n")
    .trim();
}

async function getCandidateModels(apiKey) {
  const now = Date.now();
  if (cachedModels.length > 0 && now - cachedAt < MODEL_CACHE_TTL_MS) {
    return cachedModels;
  }

  try {
    const res = await fetch(`${GEMINI_BASE_URL}/models`, {
      headers: { "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      const valid = (data.models || [])
        .filter(
          (m) =>
            m.supportedGenerationMethods?.includes("generateContent") &&
            m.name?.includes("gemini")
        )
        .map((m) => m.name.replace(/^models\//, ""));

      // Prioritaskan model flash / flash-lite agar respons cepat
      valid.sort((a, b) => {
        const score = (name) => {
          if (name.includes("flash-lite")) return 0;
          if (name.includes("flash")) return 1;
          return 2;
        };
        return score(a) - score(b);
      });

      if (valid.length > 0) {
        cachedModels = valid.slice(0, 5);
        cachedAt = now;
        return cachedModels;
      }
    }
  } catch {
    // Lanjut ke fallback statis jika ListModels gagal
  }

  return ["gemini-3.8-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
}

export async function callGeminiFlash({
  systemInstruction = "",
  prompt,
  temperature = 0.4,
  maxOutputTokens = 450,
}) {
  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      error: "Layanan AI belum dikonfigurasi. Hubungi pengelola untuk menambahkan kunci API.",
    };
  }

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: String(prompt || "").trim() }],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: Math.max(maxOutputTokens, 600),
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const candidates = await getCandidateModels(apiKey);
  let lastStatus = 502;

  for (const model of candidates) {
    try {
      const response = await fetch(
        `${GEMINI_BASE_URL}/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(12000),
          cache: "no-store",
        }
      );

      if (response.ok) {
        const data = await response.json();
        const parts = data?.candidates?.[0]?.content?.parts;
        const rawText = Array.isArray(parts)
          ? parts.map((part) => (typeof part?.text === "string" ? part.text : "")).join("")
          : "";

        const cleaned = sanitasiTeksAi(rawText);
        if (cleaned) {
          return { ok: true, status: 200, text: cleaned };
        }
        continue;
      }

      lastStatus = response.status;
      if (process.env.NODE_ENV !== "production") {
        console.error(`Gemini model ${model} gagal:`, response.status);
      }

      // Jika 401/403 (API key invalid), tidak perlu coba model lain
      if (response.status === 401 || response.status === 403) {
        break;
      }
    } catch {
      lastStatus = 502;
    }
  }

  if (lastStatus === 429) {
    return {
      ok: false,
      status: 429,
      error: "Kuota layanan AI sedang penuh. Silakan coba lagi beberapa saat nanti.",
    };
  }

  if (lastStatus === 503) {
    return {
      ok: false,
      status: 503,
      error: "Server AI sedang padat sementara. Silakan coba lagi dalam beberapa detik.",
    };
  }

  return {
    ok: false,
    status: 502,
    error: "Layanan AI sedang tidak dapat merespons. Silakan coba lagi nanti.",
  };
}