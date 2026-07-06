import { NextResponse } from "next/server";
import {
  getBirthdaysForMonth,
  getCoStars,
  getCoverWall,
  getModelYearCounts,
  getNewThisWeek,
  getOnThisDay,
  getRelatedModels,
  getSiteStats,
  getTodayBirthdays,
  getTrendingModels,
  getUpcomingReleases,
} from "@/lib/magazine-hub-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = getSiteStats();
    const trending = getTrendingModels(30);
    const sampleKey = trending[0]?.key ?? "えなこ";
    const today = new Date().toISOString().slice(0, 10);
    const month = Number(today.slice(5, 7));
    const coverWall = getCoverWall({ limit: 96 });

    const results = {
      getSiteStats: stats.models,
      getUpcomingReleases: getUpcomingReleases().length,
      getNewThisWeek: getNewThisWeek().length,
      getTrendingModels: trending.length,
      getModelYearCounts: getModelYearCounts(sampleKey).length,
      getCoStars: getCoStars(sampleKey).length,
      getRelatedModels: getRelatedModels(sampleKey).length,
      getTodayBirthdays: getTodayBirthdays().length,
      getBirthdaysForMonth: getBirthdaysForMonth(month).length,
      getOnThisDay: getOnThisDay().length,
      getCoverWall: coverWall.items.length,
    };

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      results: {},
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
