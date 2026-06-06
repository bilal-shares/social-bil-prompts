import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Premium AI Prompts Collection | Social.bil Prompts",
    template: "%s | Social.bil Prompts",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "AI prompts",
    "image generation prompts",
    "AI art prompts",
    "creative prompts",
    "Social.bil",
  ],
  authors: [{ name: "Social.bil" }],
  creator: "Social.bil",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "Premium AI Prompts Collection",
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium AI Prompts Collection",
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
