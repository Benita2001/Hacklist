import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Ticker } from '@/components/layout/Ticker';
import { Providers } from './providers';
import { siteConfig } from '@/config/site';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600'],
  style: ['italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  icons: {
    icon: '/hacklist-logo.png',
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    creator: '@0xbeni',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-dvh">
        <Providers>
          {/* Sticky top bar: ticker + header */}
          <div className="sticky top-0 z-[var(--z-sticky)]">
            <Ticker />
            <Header />
          </div>
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
// deploy
// deploy
