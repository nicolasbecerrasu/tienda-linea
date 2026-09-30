'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, MessageCircle } from 'lucide-react';
import { AnnouncementBar } from '@/components/AnnouncementBar';

interface NavbarProps {
  whatsAppNumber?: string;
}

export function Navbar({ whatsAppNumber = '59179010395' }: NavbarProps) {
  const cleanPhone = whatsAppNumber.replace(/[^0-9]/g, '') || '59179010395';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#FCE7F3] shadow-xs">
      {/* Dynamic Animated Marquee */}
      <AnnouncementBar />

      <div className="max-w-[1440px] mx-auto px-3 sm:px-8">
        <div className="flex h-14 sm:h-20 items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Logo in Rose Gold Boutique Style */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-xl overflow-hidden border border-rose-200/60 bg-rose-50/70 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 ease-out shadow-2xs">
              <Image
                src="/logo.png"
                alt="SO Shopping Online Logo"
                fill
                priority
                className="object-contain p-0.5 sm:p-1"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-2xl font-black tracking-tight text-[#1F2937] uppercase leading-none font-sans truncate">
                SO <span className="font-light tracking-wide sm:tracking-widest text-[#F43F5E]">SHOPPING ONLINE</span>
              </span>
              <span className="text-[9px] sm:text-[11px] uppercase tracking-wider text-[#6B7280] font-semibold mt-0.5 truncate">
                Boutique Femenina • Angélica Melgar
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-[#1F2937]">
            <Link
              href="/"
              className="py-2 text-[#F43F5E] border-b-2 border-[#F43F5E] transition-colors"
            >
              MUJER
            </Link>
            <Link
              href="#catalogo-section"
              className="py-2 text-[#6B7280] hover:text-[#1F2937] transition-colors"
            >
              STOCK INMEDIATO
            </Link>
            <Link
              href="#pedidos-encargo"
              className="py-2 text-[#6B7280] hover:text-[#1F2937] transition-colors"
            >
              POR ENCARGO
            </Link>
            <Link
              href="#testimonios"
              className="py-2 text-[#6B7280] hover:text-[#1F2937] transition-colors"
            >
              CLIENTAS FELICES
            </Link>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
            {/* WhatsApp Contact Button with Verde Salvia Pastel #4E9F76 */}
            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                '¡Hola Angélica! Me comunico desde SO Shopping Online para consultar sobre las prendas disponibles.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#4E9F76] hover:bg-[#3D8361] text-white shadow-sm hover:shadow-md hover:shadow-emerald-950/15 active:scale-95 hover:-translate-y-0.5 transition-all duration-300 ease-out"
              title="Contactar a Angélica Melgar (+591 79010395)"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="text-[11px] font-medium hidden md:inline">• 79010395</span>
            </a>

            {/* Admin Gate Button */}
            <Link
              href="/dashboard"
              className="p-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-[#1F2937] border border-rose-200/70 hover:bg-[#FFF1F2] hover:text-[#F43F5E] active:scale-95 transition-all duration-300 ease-out shadow-xs inline-flex items-center gap-1.5"
              title="Panel Administrativo"
            >
              <Lock className="w-3.5 h-3.5 text-[#F43F5E]" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
