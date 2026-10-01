import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SO Shopping Online — Luxury Atelier & Administrative Suite',
  description: 'Digital haute couture atelier, bespoke seasonal capsules and executive management console for VIP clientele and atelier operations.',
  keywords: ['SO Shopping Online', 'Haute Couture', 'Atelier Luxury', 'Bespoke Fashion', 'VIP Concierge', 'High Fashion'],
  icons: {
    icon: '/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#E84364',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${plusJakarta.variable} scroll-smooth`}>
      <body className="min-h-screen bg-[#FBF1F3] text-[#1F2937] font-sans antialiased selection:bg-[#E84364] selection:text-white">
        {children}
      </body>
    </html>
  );
}
