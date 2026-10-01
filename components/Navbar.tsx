'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, MessageCircle, Sparkles, Shield, Compass, ShoppingBag } from 'lucide-react';

interface NavbarProps {
  whatsAppNumber?: string;
  bagCount?: number;
}

export function Navbar({ whatsAppNumber = '12125558920', bagCount = 0 }: NavbarProps) {
  const cleanPhone = whatsAppNumber.replace(/[^0-9]/g, '') || '12125558920';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#F3D8DF] shadow-xs">
      {/* Editorial Luxury Top Bar */}
      <div className="bg-[#1F2937] text-white text-[11px] py-2 px-4 border-b border-black/10">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between font-sans">
          <div className="flex items-center gap-2 tracking-widest uppercase text-[10px] text-rose-200">
            <Sparkles className="w-3 h-3 text-[#E84364]" />
            <span>Colección Cápsula Atelier 2026 • Edición Limitada (40 Pzas por Diseño)</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-[10px] tracking-wider uppercase text-neutral-300">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[#E84364]" />
              Confección Artesanal Certificada
            </span>
            <span className="text-neutral-500">•</span>
            <span>Moneda: <strong className="text-white font-serif">USD ($)</strong></span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          {/* Brand Logo & Editorial Title */}
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-lg overflow-hidden border border-[#F3D8DF] bg-white flex-shrink-0 group-hover:scale-105 transition-transform duration-300 ease-out shadow-xs">
              <Image
                src="/logo.png"
                alt="SO Shopping Online Atelier Logo"
                fill
                priority
                className="object-contain p-1"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#1F2937] leading-none">
                  SO
                </span>
                <span className="text-[12px] sm:text-[14px] font-sans font-light tracking-[0.25em] text-[#E84364] uppercase">
                  SHOPPING ONLINE
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#6B7280] font-medium mt-1 truncate">
                Luxury Atelier & Haute Couture Suite
              </span>
            </div>
          </Link>

          {/* Center Editorial Links */}
          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1F2937]">
            <Link
              href="#catalogo-section"
              className="py-1 text-[#E84364] border-b-2 border-[#E84364] transition-colors"
            >
              Colección
            </Link>
            <Link
              href="#lookbook-section"
              className="py-1 text-[#6B7280] hover:text-[#1F2937] transition-colors"
            >
              Lookbook
            </Link>
            <Link
              href="#atelier-pillars"
              className="py-1 text-[#6B7280] hover:text-[#1F2937] transition-colors"
            >
              Pilares Atelier
            </Link>
            <Link
              href="#circulo-privado"
              className="py-1 text-[#6B7280] hover:text-[#1F2937] transition-colors"
            >
              Círculo Privado
            </Link>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Currency Pill */}
            <div className="hidden md:flex items-center px-2.5 py-1 rounded-md bg-[#FBF1F3] border border-[#F3D8DF] text-[11px] font-semibold text-[#1F2937]">
              <span>USD $</span>
            </div>

            {/* VIP Concierge WhatsApp Button */}
            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                'Estimada Concierge de SO Shopping Online, deseo solicitar asesoría privada de estilismo para la colección atelier.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase bg-[#1F2937] hover:bg-[#0F172A] text-white shadow-sm hover:shadow-md active:scale-95 transition-all duration-300"
              title="Concierge Privado 24/7"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#E84364]" />
              <span className="hidden sm:inline">Concierge</span>
              <span className="text-[10px] text-rose-300 hidden md:inline">24/7</span>
            </a>

            {/* Admin Gate Button */}
            <Link
              href="/dashboard"
              className="px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase bg-[#FFF8F8] text-[#1F2937] border border-[#F3D8DF] hover:bg-[#FBF1F3] hover:text-[#E84364] active:scale-95 transition-all duration-300 shadow-2xs inline-flex items-center gap-1.5"
              title="Acceso a la Suite Administrativa"
            >
              <Lock className="w-3.5 h-3.5 text-[#E84364]" />
              <span className="hidden sm:inline">Suite Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
