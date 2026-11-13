import { z } from "zod";
import { passwordSchema, usernameSchema } from "./common";

export const usernameChangeSchema = z.object({
    username: usernameSchema,
});

export type UsernameFormValues = z.infer<typeof usernameChangeSchema>;

export const passwordChangeSchema = z.object({
    current: z.string().min(1, "Enter your current password"),
    password: passwordSchema,
});

// deleting everything asks for the password once more
export const deleteAccountSchema = z.object({
    password: z.string().min(1, "Enter your password"),
});

export type PasswordFormValues = z.infer<typeof passwordChangeSchema>;
