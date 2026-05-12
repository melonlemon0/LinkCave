import type { CapacitorConfig } from "@capacitor/cli";

/**
 * iOS/Android shell loads the hosted Next.js app (API routes + Firebase stay on the server).
 *
 * Default origin is production. Override when pointing at another deploy or local dev, e.g.:
 *   CAPACITOR_SERVER_URL=http://127.0.0.1:3005 npm run ios:sync
 *
 * Apple review: ship the same HTTPS origin users get in production.
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() || "https://linkfridge.app";

const config: CapacitorConfig = {
  appId: "app.linkfridge.mobile",
  appName: "Link Fridge",
  webDir: "native-www",
  server: {
    url: serverUrl,
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
