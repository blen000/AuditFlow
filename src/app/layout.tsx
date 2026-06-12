import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { headers } from 'next/headers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Calling headers() opts every page into dynamic (per-request) rendering.
  // Without this, Next.js pre-renders the layout at build time — no request
  // exists then, so it cannot read x-nonce from middleware and cannot stamp
  // its own <script> tags with the nonce, causing CSP to block everything.
  await headers();

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <title>Nib Audit </title>
        <meta name="description" content="Secure Internal Audit Platform" />
      </head>
      <body
        className={cn(inter.variable, 'font-body antialiased', 'min-h-screen bg-background')}
        suppressHydrationWarning
      >
        <ClientLayout>{children}</ClientLayout>
        <Toaster />
      </body>
    </html>
  );
}
