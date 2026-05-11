import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const linkFridgeSans = Nunito({
  subsets: ["latin"],
  variable: "--font-linkfridge",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chill your links",
  description:
    "Save links with thumbnails and gentle reminders so nothing gets forgotten.",
  manifest: "/manifest.json",
  icons: {
    icon: "/linkfridge.png",
    apple: "/linkfridge.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Chill your links" },
};

export const viewport: Viewport = {
  themeColor: "#0071e3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={linkFridgeSans.variable}>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
