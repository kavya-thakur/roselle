// Where Roselle lives: "https://roselle.vercel.app", and the same without https:// for showing
// people their address ("roselle.vercel.app/ada"). Comes from APP_URL via next.config.ts.
export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
