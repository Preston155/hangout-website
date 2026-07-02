import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'PrestonHQ ER:LC Moderation OS',
  description: 'A premium ER:LC moderation dashboard for server owners, staff permissions, player management, command dispatch, and audit logs.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}