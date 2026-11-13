# Roselle

A link-in-bio platform for people with taste: an editorial page for your work, links and story,
a live editor to compose it, and quiet, honest analytics.

- **Marketing site** at `/`
- **Editor** at `/editor`: blocks (links with icons, headings, text, images, video, galleries
  in grid / masonry / carousel, projects with case studies, music players, maps, tips & payments,
  a "Work with me" contact form),
  drag to reorder, hide or schedule any block, templates, colours, fonts, button styles,
  layout, phone and desktop preview, autosave, Publish
- **Public pages** at `/<username>`, with SEO fields and a generated share image
- **Analytics** at `/analytics`: views, unique visitors, clicks, click-through rate, traffic
  sources, devices, per-link clicks, over 7 / 30 / 90 days
- **For photographers and designers**: every photo opens full screen (swipe or arrow keys); a
  project with a story or pictures gets its own case-study page at `/<username>/work/<id>`;
  uploads are resized in the browser (a 20 MB phone photo arrives as ~0.5 MB WebP)
- **Services** with an Enquire button on each, opening the enquiry form with that service chosen
- **Inbox** at `/inbox`: every enquiry (also emailed, Reply goes to the sender), moved along
  New → Replied → Booked → Paid with amounts; "booked this month" and "waiting to be paid" at the top
- **Analytics funnel**: visitors → enquiries → bookings → money, which sources bring paid work,
  how each service sells, and average reply time
- **Grows the business on its own**: a morning email when an enquiry has waited a day, a Monday
  summary of the week, verified client reviews (asked for from a paid job, approved before they
  show), payment requests to booked clients with the creator's own payment link or UPI ID, and a
  monthly goal in the inbox. One daily job (`vercel.json` → `/api/cron/daily`) runs the emails.
- **QR code** of your page (PNG or SVG) from the address bar at the top of the dashboard
- **Accounts**: email confirmation, forgot / reset password, change password, delete account

## Running it

```bash
createdb roselle
cp .env.example .env            # DATABASE_URL, APP_URL, VISITOR_SALT
npm install                     # also generates the Prisma client
npx prisma migrate deploy
npm run dev                     # http://localhost:3000
npm test                        # all 87 tests (needs Postgres running; makes its own roselle_test database)
npm run test:unit               # just the rules and calculations, no database, under a second
```

## Deploying for free

Everything below has a free plan that needs no card. Total cost: $0.

| What | Service | Free limit |
| --- | --- | --- |
| The app | [Vercel](https://vercel.com) Hobby | plenty for a new site; **personal / non-commercial use only** |
| Database | [Neon](https://neon.tech) Postgres | 0.5 GB (uploaded images live here too, at most 4 MB each) |
| Email | [Brevo](https://brevo.com) | 300 emails a day |
| Address | `your-project.vercel.app` | free; a custom domain is the one thing you'd pay for (~$10/year) |

1. **Neon**: create a project and copy two connection strings: the pooled one and the direct one.
2. **Brevo**: sign up, verify one sender address (Senders & IPs → Senders), create an API key (SMTP & API → API keys).
3. **Vercel**: import the repository and set the environment variables from `.env.example`:
   `DATABASE_URL` (Neon pooled), `DIRECT_URL` (Neon direct), `APP_URL` (`https://your-project.vercel.app`),
   `VISITOR_SALT` and `CRON_SECRET` (each `openssl rand -hex 32`), `BREVO_API_KEY`, `MAIL_FROM`, `ADMIN_EMAILS` (your
   own sign-in email), and `CONTACT_EMAIL` if questions should go somewhere other than `MAIL_FROM`.
4. Deploy. `vercel-build` applies the database migrations, then builds.

What's free and what to watch:
- **Payments cost Roselle nothing**: the Tips block links to the creator's own PayPal, Ko-fi, UPI...
  The money never passes through Roselle, so there's no payment provider and no fees.
- **Maps** use Google's keyless embed and **music** uses the players' own embeds: no API keys, no quotas.
- **When you start charging for Pro**, Vercel's free plan no longer allows it (commercial use).
  At that point move to Vercel Pro ($20/month), or to a host whose free plan allows commercial
  use (Netlify, Render).
- Sign-in attempts are counted in each server's memory (`src/lib/api/rateLimit.ts`). On serverless
  that's per instance: fine at first, move it to a shared store (Upstash Redis has a free plan) if abused.

## Reports and take-downs

Every public page has a quiet "Report this page" link at the bottom (`/report`). Reports land at
`/admin`, which only the emails in `ADMIN_EMAILS` can open, and each one is emailed to them too.
From there an admin can take a page down (visitors get a 404, its links stop redirecting, it can't
be published, and the owner is emailed the reason), put it back, or dismiss the report. A page
reported some other way can be taken down by its address at the top of `/admin`.

The terms (`/terms`) and privacy policy (`/privacy`) are written from what the code does. If you
change what's stored or which services are used, update them too. Have them read by a lawyer
before you take money or grow big.

## Plans (Free / Pro)

Everything is free today. `src/lib/plans.ts` lists every feature that could be Pro (photo
backgrounds, patterns, scheduling, SEO, music, maps, tips, 90-day analytics), each with `pro: false`.
Set one to `true` and:
- free accounts can still try it in the editor, but Publish refuses until it's removed;
- the 90-day analytics tab disappears for free accounts (`longAnalytics`);
- the pricing section on the landing page moves it to the Pro card and shows the price.

No payment provider is connected yet. Until one is, upgrade an account by hand:

```sql
UPDATE "User" SET plan = 'PRO' WHERE email = 'someone@example.com';
```

## How it's built

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL + Prisma 7 · Zod ·
React Hook Form · Tabler icons · qrcode. Nothing else: drag and drop, animations and the chart
use the browser's own features, and emails are one HTTP call to Brevo.

```
prisma/schema.prisma          User, Session, Page, Event, Media
src/proxy.ts                  signed-out → /login
src/app/
  (marketing)/                the landing page
  (auth)/                     sign in, sign up
  (dashboard)/                editor/, analytics/, settings/
  [username]/                 a public page, its share image, the view tracker
  go/[pageId]/[blockId]/      counts a click, then redirects
  media/[id]/                 uploaded images
  api/                        auth, page (autosave), publish, username, media, public/views
src/components/               PageRenderer (draws any page), PhoneFrame, Reveal, Button, Field…
src/lib/
  validations/                one Zod schema per action, shared by form and route
  pages/                      templates & fonts, block defaults, link safety, demo pages
  analytics/                  recording events, the numbers for the analytics screen
  auth/  api/  db/  utils/
```

**A page is one JSON document** (profile, SEO, theme, blocks), checked by `pageSchema` in
`src/lib/validations/page.ts` and drawn by `src/components/PageRenderer.tsx`. The editor
autosaves it to `Page.draft`; Publish copies it to `Page.published`, the only version
visitors see. Adding a block type is one schema entry and one case in the renderer.

**Links are made safe when drawn**: only `http(s)`, `mailto` and `tel` reach an `href`
(`safeHref`). Public links go through `/go/<page>/<block>`, which reads the address from the
published page, never from the URL, so it can't be used as an open redirect.

**Analytics are privacy-friendly**: a visitor is a hash of IP + browser + day + a secret salt,
never the IP itself, and it changes daily.
