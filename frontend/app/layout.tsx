import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinOS | Smart Predictive Cash Flow for India',
  description: 'AI-Powered Financial Operating System for Predictive Cash Flow Management. Real-time Monte Carlo liquidity modeling, DPDP Act compliance, and smart spending recommendations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F7F5FA] text-[#17152D] min-h-screen antialiased selection:bg-[#F3EDFA] selection:text-[#17152D] font-sans">
        {children}
      </body>
    </html>
  );
}
