import type { Metadata } from "next";
import Link from "next/link";
import { Contact, Prose } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms" };

const link = "font-semibold text-ink underline underline-offset-2";

export default function TermsPage() {
    return (
        <Prose title="Terms">
            <p>
                These terms are the agreement between you and Roselle when you make a page or visit one. By signing up or using Roselle, you agree to them. They&apos;re
                written to be read, so please do.
            </p>

            <h2>Your account</h2>
            <ul>
                <li>You must be at least 13, or older if the law where you live says so.</li>
                <li>Use an email address you can get to, and keep your password to yourself. You&apos;re responsible for what happens on your account.</li>
                <li>One person per account. Don&apos;t make accounts with scripts or sell them.</li>
            </ul>

            <h2>Your page and what&apos;s on it</h2>
            <p>
                What you put on your page stays yours. You let Roselle store it, show it to visitors and make things from it that help it be seen (like the preview
                image when your link is shared, or your QR code), only to run the service. You&apos;re responsible for your page, and for having the right to use everything on it.
            </p>

            <h2>The rules</h2>
            <p>Your page, links and images must not:</p>
            <ul>
                <li>scam, phish or trick people, including fake giveaways and fake login pages;</li>
                <li>pretend to be another person, brand or organisation;</li>
                <li>spread malware, or link to it;</li>
                <li>harass, threaten or attack people, or promote hate against a group;</li>
                <li>show sexual content involving anyone under 18, ever, or share intimate images of anyone without their consent;</li>
                <li>show graphic violence, or encourage self-harm or terrorism;</li>
                <li>sell or promote illegal goods or services;</li>
                <li>use someone else&apos;s work, brand or trademark without the right to;</li>
                <li>be spam, or try to break, overload or get around Roselle;</li>
                <li>show reviews that aren&apos;t real, or edit what a client wrote (you can approve, hide or delete a review, not change it).</li>
            </ul>

            <h2>Reports and taking pages down</h2>
            <p>
                Anyone can report a page with the Report link at its bottom, or by writing to <Contact />. If a page breaks these rules, we may take it down, remove part of
                it, or close the account, and when we do, we&apos;ll usually email you why. If you think we got it wrong, reply to that email and we&apos;ll look again. We may
                also give a username to someone else if it&apos;s being used to impersonate them or infringe their trademark.
            </p>

            <h2>Tips and payments</h2>
            <p>
                Tip and payment buttons send visitors to the creator&apos;s own PayPal, Ko-fi, UPI app or similar. The payment is between the visitor and the creator, under
                that service&apos;s terms. Roselle isn&apos;t part of it, doesn&apos;t hold the money and can&apos;t give refunds.
            </p>

            <h2>Emails we send for you</h2>
            <p>
                When you ask a client for a review or a payment, we email them on your behalf, with replies going to you. Only send these to people you&apos;ve
                actually worked with.
            </p>

            <h2>Plans and prices</h2>
            <p>
                Roselle is free. If we add paid plans, you&apos;ll see the price before you pay anything, and nothing is ever charged without you choosing it. We may change
                which features are free, and will tell you first if that affects what you use.
            </p>

            <h2>Other services</h2>
            <p>
                Pages can include videos, music players, maps and links from other companies. Those are theirs, under their own terms, and we&apos;re not responsible for them.
            </p>

            <h2>The service as it is</h2>
            <p>
                We work to keep Roselle running and your page safe, but we can&apos;t promise it will always be available or free of mistakes. Roselle is provided &quot;as
                is&quot;. As far as the law allows, we&apos;re not liable for indirect losses, like lost income or lost data, from using it or not being able to. Nothing here
                limits rights you have that the law doesn&apos;t let us limit.
            </p>

            <h2>Leaving</h2>
            <p>
                You can delete your account at any time in Settings, which removes your page and everything in it. We may suspend or close accounts that break these
                rules.
            </p>

            <h2>Changes</h2>
            <p>
                If these terms change, we&apos;ll update the date at the top, and email you first about important changes. Using Roselle after that means you accept them.
            </p>

            <h2>Contact</h2>
            <p>
                Questions, takedown requests or legal notices: <Contact />. How we handle your data is in our{" "}
                <Link href="/privacy" className={link}>privacy policy</Link>.
            </p>
        </Prose>
    );
}
