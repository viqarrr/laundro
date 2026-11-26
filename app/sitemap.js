import { createSupabasePublicClient } from "@/lib/supabase/server";

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export default async function sitemap() {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const staticRoutes = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/antrean`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/tentang`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/bandingkan`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  try {
    const supabase = createSupabasePublicClient();
    const [produkRes, kategoriRes] = await Promise.all([
      supabase.from("produk").select("id, created_at").eq("aktif", true),
      supabase.from("kategori").select("slug, created_at"),
    ]);

    const produkRoutes = (produkRes.data || []).map((p) => ({
      url: `${baseUrl}/produk/${p.id}`,
      lastModified: p.created_at ? new Date(p.created_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const kategoriRoutes = (kategoriRes.data || []).map((k) => ({
      url: `${baseUrl}/kategori/${k.slug}`,
      lastModified: k.created_at ? new Date(k.created_at) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...kategoriRoutes, ...produkRoutes];
  } catch {
    return staticRoutes;
  }
}
