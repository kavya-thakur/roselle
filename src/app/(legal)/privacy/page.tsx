import type { Metadata } from "next";
import Link from "next/link";
import { Contact, Prose } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy policy" };

// Written from what the code actually does: if what's stored or who sees it changes, change this too
export default function PrivacyPage() {
    return (
        <Prose title="Privacy policy">
            <p>
                Roselle lets you make a public page for your links and work. This explains what we keep about you and about the people who visit your page, why, and
                what you can do about it. Questions: <Contact />.
            </p>

            <h2>If you have an account</h2>
            <ul>
                <li><strong>Your email address</strong>, to sign you in and to send you account emails (confirming your address, resetting your password, telling you if your page is taken down). We don&apos;t send marketing emails.</li>
                <li><strong>Your password</strong>, stored only as a scrambled one-way hash. Nobody at Roselle can read it.</li>
                <li><strong>Your username and your page</strong>: your name, bio, photos, links, blocks and design. What you publish is public: anyone with the link can see it, and search engines may list it.</li>
                <li><strong>Images you upload</strong>, kept in our database. Once on your page, anyone can view them.</li>
                <li><strong>Your plan</strong> (Free or Pro) and when you confirmed your email.</li>
            </ul>

            <h2>If you visit someone&apos;s page</h2>
            <p>So the page&apos;s owner can see how it&apos;s doing, we count each visit and each tap on a link. For each one we keep:</p>
            <ul>
                <li>which page or link, and when;</li>
                <li>the website you came from (just its name, like instagram.com) or a campaign tag in the link;</li>
                <li>whether you&apos;re on a phone, tablet or computer;</li>
                <li>
                    a visitor code, made by scrambling your IP address and browser together with the date and a secret. It lets us count you once per day. It
                    can&apos;t be turned back into your IP address, and it changes every day, so you can&apos;t be followed over time. <strong>We never store your IP address.</strong>
                </li>
            </ul>
            <p>Only the page&apos;s owner sees these numbers, and only added up. Search engines and link-preview robots aren&apos;t counted.</p>

            <h2>Cookies</h2>
            <p>
                Signing in puts one cookie in your browser, so you stay signed in for up to 30 days. That&apos;s all. Visitors get no cookies from us, and there are no
                advertising or tracking cookies.
            </p>

            <h2>Other services a page can include</h2>
            <p>
                Creators can add YouTube or Vimeo videos, Spotify, Apple Music or SoundCloud players, Google Maps, and pictures hosted elsewhere. When you open a page
                with one of these, your browser loads it straight from that company, which may set its own cookies and collect data under its own privacy policy. YouTube
                videos use its privacy-enhanced mode.
            </p>
            <p>
                Tip and payment buttons take you to the creator&apos;s own PayPal, Ko-fi, UPI app or similar. The payment happens there. Roselle never sees your card,
                bank details or how much you paid.
            </p>

            <h2>Who helps us run Roselle</h2>
            <p>These companies process data for us, only to provide the service:</p>
            <ul>
                <li>Vercel: hosts the website.</li>
                <li>Neon: hosts the database.</li>
                <li>Brevo: sends our emails.</li>
            </ul>
            <p>They may store data in other countries, including the United States and the European Union. We don&apos;t sell your data or share it with advertisers.</p>

            <h2>Reports</h2>
            <p>
                If you report a page, we keep what you wrote and, if you gave it, your email address, so we can look into it and reply. The page&apos;s owner isn&apos;t told who
                reported them.
            </p>

            <h2>How long we keep it</h2>
            <p>
                Everything about your account stays until you delete it. Deleting your account (Settings → Delete account) removes your account, your page, your images and
                its visit counts straight away. Copies can remain in our hosting provider&apos;s backups for a short time before they&apos;re overwritten.
            </p>

            <h2>Your rights</h2>
            <p>
                You can see and change your page in the editor and delete everything in Settings. For a copy of your data, or anything else, write to <Contact />. Depending on
                where you live (for example under the GDPR in Europe and the UK, India&apos;s Digital Personal Data Protection Act, or California&apos;s privacy laws), you may also
                have the right to correct your data, object to how it&apos;s used, or complain to your data protection authority.
            </p>

            <h2>Children</h2>
            <p>Roselle isn&apos;t for children. You must be at least 13 to have an account, or older if the law where you live says so.</p>

            <h2>Keeping it safe</h2>
            <p>Everything travels over HTTPS. Passwords and sign-in codes are only stored as one-way hashes, and sign-in attempts are limited to stop guessing.</p>

            <h2>Changes</h2>
            <p>
                If this policy changes, we&apos;ll update the date at the top, and for important changes we&apos;ll email account holders first. See also our{" "}
                <Link href="/terms" className="font-semibold text-ink underline underline-offset-2">terms</Link>.
            </p>
        </Prose>
    );
}
