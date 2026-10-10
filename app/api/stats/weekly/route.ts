import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/require-user";
import { aggregateWeeklyData } from "@/lib/weekly";

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId)
    return apiError("UNAUTHORIZED", "Authentication is required.", 401);

  const startParam = new URL(request.url).searchParams.get("start");
  if (!startParam || !/^\d{4}-\d{2}-\d{2}$/.test(startParam)) {
    return apiError(
      "VALIDATION_ERROR",
      "start must be a date in YYYY-MM-DD format.",
      400,
    );
  }
  const start = new Date(`${startParam}T00:00:00.000Z`);
  if (
    !Number.isFinite(start.getTime()) ||
    start.toISOString().slice(0, 10) !== startParam
  ) {
    return apiError(
      "VALIDATION_ERROR",
      "start must be a valid calendar date.",
      400,
    );
  }
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  const streakStart = new Date();
  streakStart.setUTCDate(streakStart.getUTCDate() - 400);
  streakStart.setUTCHours(0, 0, 0, 0);

  try {
    const [user, entries, activeLogs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { stepGoal: true, waterGoalMl: true, sleepGoalHrs: true },
      }),
      prisma.activityLog.findMany({
        where: { userId, date: { gte: start, lt: end } },
        select: { type: true, value: true, secondaryValue: true, date: true },
      }),
      prisma.activityLog.findMany({
        where: { userId, date: { gte: streakStart } },
        select: { date: true },
      }),
    ]);
    if (!user) return apiError("NOT_FOUND", "User account was not found.", 404);

    return NextResponse.json({
      data: aggregateWeeklyData(
        start,
        entries,
        activeLogs.map((log) => log.date),
        user,
      ),
    });
  } catch (error) {
    console.error("Weekly stats request failed", error);
    return apiError("INTERNAL_ERROR", "Unable to load weekly statistics.", 500);
  }
}
