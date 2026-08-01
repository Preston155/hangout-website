import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Akron Tire Shop | New & Used Tires in Akron, Ohio',
  description:
    'Akron Tire Shop offers new tires, used tires, tire mounting, tire balancing, and tire repairs in Akron, Ohio.',
  openGraph: {
    title: 'Akron Tire Shop',
    description:
      'Good tires. Good prices. Get back on the road with new and used tires, mounting, balancing, and repairs.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
