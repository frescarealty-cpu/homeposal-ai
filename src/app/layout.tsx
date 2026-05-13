import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GoogleMapsProvider } from "@/components/GoogleMapsProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GpcOptOutSignal } from "@/components/GpcOptOutSignal";
import { CookieConsent } from "@/components/CookieConsent";
import { MobileOwnerAlertBar } from "@/components/MobileOwnerAlertBar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HomePosal - SoCal's Public Property Proposal Bulletin Board",
  description: "Find and place offers on properties with a Kalshi-style trading experience.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider>
          <GoogleMapsProvider>
            <div className="flex min-h-screen flex-col overflow-x-hidden">
              <div className="mx-auto flex min-h-screen w-full max-w-[95%] flex-col bg-white md:max-w-7xl md:min-w-0">
                <MobileOwnerAlertBar />
                <Suspense fallback={<div className="kalshi-border min-h-[80px] border-x-0 border-t-0 bg-[var(--background-elevated)] md:min-h-[120px]" aria-hidden />}>
                  <Header />
                </Suspense>
                <main className="min-w-0 flex-auto px-3 sm:px-6">{children}</main>
                <Footer />
              </div>
              <GpcOptOutSignal />
              <CookieConsent />
            </div>
          </GoogleMapsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
