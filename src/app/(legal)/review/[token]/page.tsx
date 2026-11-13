import type { Metadata } from "next";
import { pageSchema } from "@/lib/validations/page";
import { enquiryForReview } from "@/lib/reviews";
import { ReviewForm } from "./ReviewForm";

export const metadata: Metadata = { title: "Leave a review", robots: { index: false } };

// The link in a client's "how did it go?" email: one review, once
export default async function ReviewPage({ params }: PageProps<"/review/[token]">) {
    const { token } = await params;
    const enquiry = await enquiryForReview(token);

    if (!enquiry) {
        return (
            <>
                <h1 className="font-display text-5xl text-ink">This link has been used</h1>
                <p className="mt-3 text-[16px] text-muted">Either a review was already left with it, or it has expired. Thank you either way.</p>
            </>
        );
    }

    const published = pageSchema.safeParse(enquiry.page.published);
    const creator = (published.success && published.data.profile.name) || enquiry.page.username;

    return (
        <>
            <h1 className="font-display text-5xl text-ink">How was working with {creator}?</h1>
            <p className="mt-3 text-[16px] text-muted">
                {enquiry.service ? `About ${enquiry.service}. ` : ""}A few honest words help other people decide. {creator} reads it first, then it can appear on their page.
            </p>
            <ReviewForm token={token} name={enquiry.name} creator={creator} username={enquiry.page.username} />
        </>
    );
}
