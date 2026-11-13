import type { Metadata } from "next";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = {
    title: "Choose a new password",
};

// The link in the reset email: /reset?token=...
export default async function ResetPage({ searchParams }: PageProps<"/reset">) {
    const { token } = await searchParams;
    return <ResetForm token={typeof token === "string" ? token : ""} />;
}
