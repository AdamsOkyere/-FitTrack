import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/require-user";
import { activityInputSchema, activityPatchSchema } from "@/lib/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId();
  if (!userId)
    return apiError("UNAUTHORIZED", "Authentication is required.", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }
  const changes = activityPatchSchema.safeParse(body);
  if (!changes.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Please check the activity fields.",
      400,
      changes.error.flatten(),
    );
  }

  const { id } = await context.params;
  try {
    const current = await prisma.activityLog.findFirst({
      where: { id, userId },
    });
    if (!current)
      return apiError("NOT_FOUND", "Activity entry was not found.", 404);

    const merged = activityInputSchema.safeParse({
      type: current.type,
      value: current.value,
      ...(current.secondaryValue === null
        ? {}
        : { secondaryValue: current.secondaryValue }),
      date: current.date.toISOString(),
      ...(current.note ? { note: current.note } : {}),
      ...changes.data,
    });
    if (!merged.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Please check the activity fields.",
        400,
        merged.error.flatten(),
      );
    }

    const secondaryValue =
      merged.data.type === "WALK" || merged.data.type === "SLEEP"
        ? merged.data.secondaryValue
        : null;
    const log = await prisma.activityLog.update({
      where: { id },
      data: {
        type: merged.data.type,
        value: merged.data.value,
        secondaryValue,
        date: new Date(merged.data.date),
        note: merged.data.note || null,
      },
    });
    return NextResponse.json({ data: log });
  } catch (error) {
    console.error("Activity update failed", error);
    return apiError(
      "INTERNAL_ERROR",
      "Unable to update activity right now.",
      500,
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId();
  if (!userId)
    return apiError("UNAUTHORIZED", "Authentication is required.", 401);

  const { id } = await context.params;
  try {
    const result = await prisma.activityLog.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0)
      return apiError("NOT_FOUND", "Activity entry was not found.", 404);
    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Activity deletion failed", error);
    return apiError(
      "INTERNAL_ERROR",
      "Unable to delete activity right now.",
      500,
    );
  }
}
