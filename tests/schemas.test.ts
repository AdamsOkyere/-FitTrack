import { describe, expect, it } from "vitest";
import {
  activityInputSchema,
  goalsSchema,
  registerSchema,
} from "@/lib/schemas";

describe("shared validation schemas", () => {
  it("normalizes registration email and rejects mismatched passwords", () => {
    const valid = registerSchema.safeParse({
      name: "Taylor Morgan",
      email: "  DEMO@FITNESS.APP ",
      password: "Demo1234!",
      confirmPassword: "Demo1234!",
    });
    const mismatch = registerSchema.safeParse({
      name: "Taylor Morgan",
      email: "demo@fitness.app",
      password: "Demo1234!",
      confirmPassword: "Different123!",
    });

    expect(valid.success).toBe(true);
    if (valid.success) expect(valid.data.email).toBe("demo@fitness.app");
    expect(mismatch.success).toBe(false);
  });

  it("rejects invalid activity ranges and out-of-bound goals", () => {
    const invalidWalk = activityInputSchema.safeParse({
      type: "WALK",
      value: -10,
      secondaryValue: 3,
      date: "2026-10-08T12:00:00.000Z",
    });
    const invalidGoal = goalsSchema.safeParse({ stepGoal: 0 });
    const validSleep = activityInputSchema.safeParse({
      type: "SLEEP",
      value: 7.5,
      secondaryValue: 4,
      date: "2026-10-08T12:00:00.000Z",
    });

    expect(invalidWalk.success).toBe(false);
    expect(invalidGoal.success).toBe(false);
    expect(validSleep.success).toBe(true);
  });
});
