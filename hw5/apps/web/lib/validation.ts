import { z } from "zod";

export const RESERVED_USER_IDS = [
  "home",
  "post",
  "profile",
  "api",
  "login",
  "signup",
  "settings",
];

export const userIdSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-z][a-z0-9_]*$/)
  .refine((v) => !RESERVED_USER_IDS.includes(v), "Reserved username");

export const postInputSchema = z.object({
  text: z.string().min(1).max(10000),
  parentId: z.string().optional(),
});


