import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FinOS | Your cash flow, made clearer',
  description: 'Understand your cash flow and plan ahead with FinOS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-finos-background font-sans text-finos-heading antialiased selection:bg-finos-purple-soft selection:text-finos-heading">
        {children}
      </body>
    </html>
  );
}
