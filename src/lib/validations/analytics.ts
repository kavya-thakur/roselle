import { z } from "zod";

// Sent by the public page once it has loaded (TrackView.tsx)
export const viewSchema = z.object({
    pageId: z.int32().positive(),
    referrer: z.string().max(2048).optional(),
    utmSource: z.string().max(100).optional(),
});
