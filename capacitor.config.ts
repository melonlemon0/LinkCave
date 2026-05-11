import type { CapacitorConfig } from "@capacitor/cli";

/**
 * iOS/Android shell loads your hosted Next.js app (API routes + Firebase stay on the server).
 *
 * Before `npx cap sync ios`, set your deployed origin, e.g.:
 *   CAPACITOR_SERVER_URL=https://your-app.vercel.app npx cap sync ios
 *
 * Apple review: the binary must load your real domain; use the same URL you ship to users.
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "app.linkfridge.mobile",
  appName: "Link Fridge",
  webDir: "native-www",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          androidScheme: "https",
        },
      }
    : {}),
  ios: {
    contentInset: "automatic",
  },
};

export default config;
