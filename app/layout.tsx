import type { Metadata } from "next";
import "@fontsource/baskervville/latin-400.css";
import "@fontsource/baskervville/latin-400-italic.css";
import "@fontsource/baskervville/latin-500.css";
import "@fontsource-variable/source-sans-3";
import { Footer, Header } from "@/components/site";
import { Analytics } from "@/components/analytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: process.env.APP_URL ? new URL(process.env.APP_URL) : undefined,
  title: { default: "bkr | The Science of Renewal", template: "%s | bkr" },
  description: "Explore bkr, a luxury, science-inspired skincare brand researching skin longevity, visible signs of aging, radiance, and moisture barrier support.",
  openGraph: { type: "website", images: ["/images/fountain-vial.webp"] },
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><a className="skip" href="#main">Skip to content</a><Header /><main id="main">{children}</main><Footer /><Analytics /></body></html>;
}
