// Sends one plain-text email through Brevo's free plan (300 a day, no card needed): one HTTP
// call, so no mail package. Without BREVO_API_KEY (on your own computer) the email is printed
// to the terminal instead, so the reset and verify links still work while developing.
// `replyTo`: where pressing Reply goes, e.g. the visitor who wrote through a contact form
export async function sendEmail({ to, subject, text, replyTo }: { to: string; subject: string; text: string; replyTo?: { email: string; name?: string } }) {
    const key = process.env.BREVO_API_KEY;
    const from = process.env.MAIL_FROM;

    if (!key || !from) {
        console.log(`\n--- email to ${to}: ${subject} ---\n${text}\n---\n`);
        return;
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ sender: { email: from, name: "Roselle" }, to: [{ email: to }], subject, textContent: text, ...(replyTo && { replyTo }) }),
    });

    if (!response.ok) throw new Error(`Brevo answered ${response.status}: ${await response.text()}`);
}
