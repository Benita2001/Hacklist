import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from 'next';
import { Instrument_Serif, Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Ticker } from '@/components/layout/Ticker';
import { Providers } from './providers';
import { siteConfig } from '@/config/site';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
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
  other: {
    'ory-verify': 'orynth-ad38c33f511b49e5880a3fcb4304201a',
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: 'https://hacklist.io/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HackList — Find AI & Web3 hackathons, bounties, grants, and jobs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    creator: '@0xbeni',
    images: ['https://hacklist.io/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${inter.variable}`}
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
// deploy
