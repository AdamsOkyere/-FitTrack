import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(80),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .max(254)
      .toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password must be 72 characters or fewer."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254)
    .toLowerCase(),
  password: z.string().min(1, "Password is required.").max(72),
});

export const activityTypeSchema = z.enum(["WALK", "WATER", "SLEEP"]);

const activityFields = {
  date: z.string().datetime({ offset: true }),
  note: z.string().trim().max(500).optional(),
};

export const activityInputSchema = z.discriminatedUnion("type", [
  z.object({
    ...activityFields,
    type: z.literal("WALK"),
    value: z.number().int().min(1).max(200000),
    secondaryValue: z.number().finite().min(0).max(500),
  }),
  z.object({
    ...activityFields,
    type: z.literal("WATER"),
    value: z.number().int().min(1).max(20000),
  }),
  z.object({
    ...activityFields,
    type: z.literal("SLEEP"),
    value: z.number().finite().min(0.1).max(24),
    secondaryValue: z.number().int().min(1).max(5),
  }),
]);

export const activityPatchSchema = z
  .object({
    type: activityTypeSchema.optional(),
    value: z.number().finite().optional(),
    secondaryValue: z.number().finite().nullable().optional(),
    date: z.string().datetime({ offset: true }).optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .refine((changes) => Object.keys(changes).length > 0, {
    message: "At least one activity field is required.",
  });

export const goalsSchema = z
  .object({
    stepGoal: z.number().int().min(500).max(100000).optional(),
    waterGoalMl: z.number().int().min(250).max(10000).optional(),
    sleepGoalHrs: z.number().min(1).max(16).multipleOf(0.5).optional(),
  })
  .refine((goals) => Object.keys(goals).length > 0, {
    message: "At least one goal is required.",
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ActivityInput = z.infer<typeof activityInputSchema>;
