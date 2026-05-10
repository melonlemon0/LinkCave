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
  title: "LinkFridge — Chill your links",
  description:
    "Save links in the cloud with Gmail. Gentle reminders so saved links do not get forgotten.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logogo.png",
    apple: "/logogo.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "LinkFridge" },
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
