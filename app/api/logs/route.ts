import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/require-user";
import { activityInputSchema, activityTypeSchema } from "@/lib/schemas";

function parseDateBound(value: string | null, inclusiveEnd = false) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  if (inclusiveEnd && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    parsed.setUTCHours(23, 59, 59, 999);
  }
  return parsed;
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId)
    return apiError("UNAUTHORIZED", "Authentication is required.", 401);

  const search = new URL(request.url).searchParams;
  const requestedType = search.get("type");
  const type = requestedType
    ? activityTypeSchema.safeParse(requestedType)
    : null;
  if (type && !type.success) {
    return apiError("VALIDATION_ERROR", "Unknown activity type.", 400);
  }

  const start = parseDateBound(search.get("start"));
  const end = parseDateBound(search.get("end"), true);
  if (start === null || end === null || (start && end && start > end)) {
    return apiError("VALIDATION_ERROR", "The date range is invalid.", 400);
  }

  const where: Prisma.ActivityLogWhereInput = { userId };
  if (type?.success) where.type = type.data;
  if (start || end) {
    where.date = {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {}),
    };
  }

  try {
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 100,
    });
    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error("Activity history request failed", error);
    return apiError("INTERNAL_ERROR", "Unable to load activity history.", 500);
  }
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId)
    return apiError("UNAUTHORIZED", "Authentication is required.", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const input = activityInputSchema.safeParse(body);
  if (!input.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Please check the activity fields.",
      400,
      input.error.flatten(),
    );
  }

  const secondaryValue =
    input.data.type === "WALK" || input.data.type === "SLEEP"
      ? input.data.secondaryValue
      : null;
  try {
    const log = await prisma.activityLog.create({
      data: {
        userId,
        type: input.data.type,
        value: input.data.value,
        secondaryValue,
        date: new Date(input.data.date),
        note: input.data.note || null,
      },
    });
    return NextResponse.json({ data: log }, { status: 201 });
  } catch (error) {
    console.error("Activity creation failed", error);
    return apiError(
      "INTERNAL_ERROR",
      "Unable to save activity right now.",
      500,
    );
  }
}
