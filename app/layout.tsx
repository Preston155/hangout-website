import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://prestonhq.com'),
  title: 'Akron Tire Shop | New & Used Tires in Akron, Ohio',
  description:
    'Akron Tire Shop offers new tires, used tires, tire mounting, tire balancing, and tire repairs in Akron, Ohio.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/assets/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/assets/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Akron Tire Shop | Good Tires. Good Grip.',
    description:
      'Good tires. Good prices. Get back on the road with new and used tires, mounting, balancing, and repairs.',
    url: 'https://prestonhq.com/',
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
    title: 'Akron Tire Shop | Good Tires. Good Grip.',
    description: 'New tires, used tires, mounting, balancing, and tire repairs in Akron, Ohio.',
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
