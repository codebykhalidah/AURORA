import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Aurora Maritime | Reserve Your Voyage',
  description: 'Book boutique luxury cruise voyages aboard Aurora Maritime.',
  metadataBase: new URL(appUrl),
  openGraph: {
    title: 'Aurora Maritime Booking',
    description: 'Reserve your private voyage with Aurora Maritime.',
    url: appUrl,
    siteName: 'Aurora Maritime',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
