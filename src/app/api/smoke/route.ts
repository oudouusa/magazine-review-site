import { NextResponse } from "next/server";
import {
  getSiteStats,
  getUpcomingReleases,
  getNewThisWeek,
  getTrendingModels,
  getModelYearCounts,
  getCoStars,
  getRelatedModels,
  getTodayBirthdays,
  getBirthdaysForMonth,
  getOnThisDay,
  getCoverWall,
  jstToday,
} from "@/lib/mh-insights";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const trending = getTrendingModels(30);
    const sampleKey = trending[0]?.key ?? "えなこ";
    const results = {
      getSiteStats: getSiteStats().models,
      getUpcomingReleases: getUpcomingReleases().length,
      getNewThisWeek: getNewThisWeek().length,
      getTrendingModels: trending.length,
      getModelYearCounts: getModelYearCounts(sampleKey).length,
      getCoStars: getCoStars(sampleKey).length,
      getRelatedModels: getRelatedModels(sampleKey).length,
      getTodayBirthdays: getTodayBirthdays().length,
      getBirthdaysForMonth: getBirthdaysForMonth(jstToday().m).length,
      getOnThisDay: getOnThisDay().length,
      getCoverWall: getCoverWall({ pageSize: 96 }).items.length,
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
