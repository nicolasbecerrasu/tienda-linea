'use client';

import React from 'react';

export function AnnouncementBar() {
  const announcements = [
    'SO SHOPPING ONLINE',
    'MODA BOUTIQUE EN STOCK',
    'APARTA TU PRENDA CON SOLO 100 BS',
    'ENVÍOS A TODO EL PAÍS 🇧🇴',
    'ATENCIÓN DIRECTA CON ANGÉLICA MELGAR (+591 79010395)',
    'ENTREGA INMEDIATA EN SANTA CRUZ',
    'CATÁLOGO EXCLUSIVO POR ENCARGO',
  ];

  return (
    <div className="relative w-full bg-[#1F2937] text-white text-[11px] font-bold tracking-widest py-2 overflow-hidden select-none border-b border-[#FCE7F3]/20">
      <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
        {[...announcements, ...announcements].map((item, idx) => (
          <span key={idx} className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-white hover:text-rose-300 transition-colors uppercase tracking-wider">
              {item}
            </span>
            <span className="text-[#F43F5E] font-bold">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
