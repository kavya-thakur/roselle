import { z } from "zod";
import { emailSchema, passwordSchema, usernameSchema } from "./common";

// Sign up claims the page address too, so there's something to edit straight away
export const registerSchema = z.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
});

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z.object({
    token: z.string().min(1).max(200),
    password: passwordSchema,
});

export type ForgotFormValues = z.infer<typeof forgotSchema>;
export type ResetFormValues = z.infer<typeof resetSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
