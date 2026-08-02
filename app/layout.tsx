import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://pos.prestonhq.com'),
  title: 'Akron Tire Shop POS',
  description:
    'Private Akron Tire Shop point-of-sale, receipt printing, inventory, transaction history, and reporting system.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/assets/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/assets/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Akron Tire Shop POS',
    description:
      'Private tire shop POS for checkout, receipt printing, inventory, and reports.',
    url: 'https://pos.prestonhq.com/',
    siteName: 'Akron Tire Shop',
    type: 'website',
    images: [
      {
        url: '/assets/akron-tire-shop-og.jpg',
        width: 1200,
        height: 800,
        alt: 'Akron Tire Shop logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Akron Tire Shop POS',
    description: 'Private tire shop POS for checkout, receipt printing, inventory, and reports.',
    images: ['/assets/akron-tire-shop-og.jpg'],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
