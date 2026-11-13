import { z } from "zod";
import { emailSchema } from "./common";

// A message from a "Work with me" block
export const enquirySchema = z.object({
    pageId: z.number().int().positive(),
    blockId: z.string().min(1).max(40),
    name: z.string().trim().min(1, "Add your name").max(100, "Must be at most 100 characters"),
    email: emailSchema,
    message: z.string().trim().min(2, "Write a message").max(3000, "Must be at most 3000 characters"),
    // a field people never see: only spam robots fill it in (see ContactForm)
    website: z.string().max(200).default(""),
});
