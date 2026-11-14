import { z } from "zod";
import { CRAFTS, type Craft } from "@/lib/pages/starters";
import { TEMPLATES } from "@/lib/pages/theme";
import { CURRENCIES } from "./enquiry";

// The first-run answers at /welcome. Skipping is allowed: it starts them on the plain starter page.
export const onboardingSchema = z.union([
    z.object({ skip: z.literal(true) }),
    z.object({
        craft: z.enum(Object.keys(CRAFTS) as [Craft, ...Craft[]]),
        name: z.string().trim().min(1, "Add your name").max(80, "Must be at most 80 characters"),
        bio: z.string().trim().max(300, "Must be at most 300 characters").default(""),
        template: z.string().refine((id) => TEMPLATES.some((template) => template.id === id), "Pick a look"),
        currency: z.enum(CURRENCIES),
    }),
]);

export type OnboardingAnswers = Exclude<z.infer<typeof onboardingSchema>, { skip: true }>;
