'use client';

import React from 'react';
import { MessageCircle, ArrowRight, Heart, ShoppingBag, ShieldCheck } from 'lucide-react';

interface CustomBoutiqueOrderBannerProps {
  whatsAppNumber?: string;
}

export function CustomBoutiqueOrderBanner({ whatsAppNumber = '59179010395' }: CustomBoutiqueOrderBannerProps) {
  const cleanPhone = whatsAppNumber.replace(/[^0-9]/g, '') || '59179010395';

  const message =
    `¡Hola Angélica! Quiero cotizar y encargar una prenda que vi en catálogo:\n\n` +
    `👗 Enlace, Foto o Referencia:\n` +
    `📏 Talla:\n` +
    `🎨 Color:\n\n` +
    `¿Me confirmas el costo en Bolivianos (Bs) y la reserva de 100 Bs por favor?`;

  const orderUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  return (
    <section id="pedidos-encargo" className="relative overflow-hidden bg-white rounded-3xl border border-rose-200/70 shadow-lg p-5 sm:p-12 my-10 sm:my-12 transition-all duration-300 ease-out">
      {/* Subtle Rose Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#FFF1F2] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#FDF4F5] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 max-w-[1440px] mx-auto">
        <div className="max-w-2xl text-center lg:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFF1F2] text-[#F43F5E] text-[11px] font-bold uppercase tracking-wider mb-4 border border-rose-200 rounded-full">
            <span>ENCARGOS EXCLUSIVOS • BOUTIQUE</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-[#1F2937] leading-tight">
            ¿Buscas una prenda que no está en stock?
          </h2>

          <p className="mt-3 text-xs sm:text-sm text-[#6B7280] font-normal leading-relaxed tracking-wide">
            Nosotras te la traemos directo a Bolivia. Envíanos una captura de pantalla, foto o enlace de la prenda que deseas por WhatsApp. Aparta tu pedido con solo <strong className="text-[#F43F5E] font-bold">100 Bs de anticipo</strong> y cancela el saldo restante contra entrega.
          </p>

          {/* Quick value props */}
          <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs font-bold uppercase tracking-wider text-[#1F2937]">
            <div className="flex items-center gap-1.5 bg-rose-50/70 px-3 py-1.5 border border-rose-200/60 rounded-xl">
              <ShoppingBag className="w-3.5 h-3.5 text-[#F43F5E]" />
              <span>Cualquier Modelo o Talla</span>
            </div>
            <div className="flex items-center gap-1.5 bg-rose-50/70 px-3 py-1.5 border border-rose-200/60 rounded-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F43F5E]" />
              <span>Anticipo Seguro de 100 Bs</span>
            </div>
            <div className="flex items-center gap-1.5 bg-rose-50/70 px-3 py-1.5 border border-rose-200/60 rounded-xl">
              <Heart className="w-3.5 h-3.5 fill-[#F43F5E] text-[#F43F5E]" />
              <span>Envíos a toda Bolivia 🇧🇴</span>
            </div>
          </div>
        </div>

        {/* CTA Button Box with Verde Salvia Pastel #4E9F76 */}
        <div className="flex-shrink-0 w-full sm:w-auto text-center">
          <a
            href={orderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#4E9F76] hover:bg-[#3D8361] text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-sm hover:shadow-md hover:shadow-emerald-950/15 active:scale-95 hover:-translate-y-0.5 transition-all duration-300 ease-out group"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>Encargar por WhatsApp</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <p className="text-[11px] text-[#6B7280] mt-2 font-medium tracking-wide">
            Angélica Melgar • +591 79010395
          </p>
        </div>
      </div>
    </section>
  );
}

export const CustomSheinOrderBanner = CustomBoutiqueOrderBanner;
