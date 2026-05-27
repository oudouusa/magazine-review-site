import type { MetadataRoute } from "next";
import { getAllModelSlugs, getAllIssueIds, getBrands } from "@/lib/magazine-hub-db";

export const dynamic = "force-dynamic";

const BASE = "https://magazine.happyharem.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date().toISOString().slice(0, 10);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,               lastModified: today, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/models`,   lastModified: today, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/magazines`,lastModified: today, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/brands`,   lastModified: today, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/ranking`,  lastModified: today, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/features`, lastModified: today, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/search`,   lastModified: today, changeFrequency: "monthly", priority: 0.5 },
  ];

  const modelSlugs = getAllModelSlugs();
  const modelPages: MetadataRoute.Sitemap = modelSlugs.map((slug) => ({
    url: `${BASE}/models/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const issueIds = getAllIssueIds();
  const issuePages: MetadataRoute.Sitemap = issueIds.map(({ id, date }) => ({
    url: `${BASE}/magazines/issue-${id}`,
    lastModified: date,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const brands = getBrands();
  const brandPages: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${BASE}/magazines?brand=${brand.slug}`,
    lastModified: brand.latestDate,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...modelPages, ...issuePages, ...brandPages];
}
