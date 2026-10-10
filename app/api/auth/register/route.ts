import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const input = registerSchema.safeParse(body);
  if (!input.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Please check the form fields.",
      400,
      input.error.flatten(),
    );
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: input.data.name,
        email: input.data.email,
        passwordHash: await hash(input.data.password, 12),
      },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError(
        "EMAIL_IN_USE",
        "An account with this email already exists.",
        409,
      );
    }
    console.error("Account registration failed", error);
    return apiError(
      "INTERNAL_ERROR",
      "Unable to create your account right now.",
      500,
    );
  }
}
