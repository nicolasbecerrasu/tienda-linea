import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SO Shopping Online - Boutique & Moda Femenina • Angélica Melgar',
  description: 'Catálogo exclusivo de prendas en stock y pedidos por encargo con Angélica Melgar (+591 79010395). Apartados y entregas en Bolivia.',
  keywords: ['SO Shopping Online', 'Ropa por Encargo', 'Moda Femenina', 'Boutique', 'Santa Cruz', 'Angélica Melgar', 'Ropa', 'Apartados'],
  icons: {
    icon: '/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f43f5e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="min-h-screen bg-[#FAF0F2] text-[#1F2937] antialiased selection:bg-[#F43F5E] selection:text-white">
        {children}
      </body>
    </html>
  );
}
