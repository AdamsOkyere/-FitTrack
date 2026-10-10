import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/require-user";
import { goalsSchema } from "@/lib/schemas";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId)
    return apiError("UNAUTHORIZED", "Authentication is required.", 401);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stepGoal: true, waterGoalMl: true, sleepGoalHrs: true },
    });
    if (!user) return apiError("NOT_FOUND", "User account was not found.", 404);
    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("Goal request failed", error);
    return apiError("INTERNAL_ERROR", "Unable to load your goals.", 500);
  }
}

export async function PATCH(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId)
    return apiError("UNAUTHORIZED", "Authentication is required.", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }
  const changes = goalsSchema.safeParse(body);
  if (!changes.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Please provide valid daily goals.",
      400,
      changes.error.flatten(),
    );
  }

  try {
    const goals = await prisma.user.update({
      where: { id: userId },
      data: changes.data,
      select: { stepGoal: true, waterGoalMl: true, sleepGoalHrs: true },
    });
    return NextResponse.json({ data: goals });
  } catch (error) {
    console.error("Goal update failed", error);
    return apiError("INTERNAL_ERROR", "Unable to update your goals.", 500);
  }
}
