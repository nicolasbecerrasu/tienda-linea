'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Prenda } from '@/types/database';
import { buildWhatsAppReservationLink, formatCurrency } from '@/lib/utils';
import { MessageCircle, Check, Tag, ShieldCheck, Heart, ImageOff } from 'lucide-react';

interface PrendaCardProps {
  prenda: Prenda;
  whatsAppNumber?: string;
}

export function PrendaCard({ prenda, whatsAppNumber }: PrendaCardProps) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const sizes = prenda.talla ? prenda.talla.split(',').map((s) => s.trim()) : ['Única'];
  const [selectedTalla, setSelectedTalla] = useState<string>(sizes[0] || 'Única');

  const reservaMonto = prenda.precio_reserva || 100;
  const saldoContraEntrega = Math.max(prenda.precio_total - reservaMonto, 0);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(prenda.codigo_shein);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = buildWhatsAppReservationLink(prenda, whatsAppNumber, selectedTalla);

  const getWhatsAppForSize = (talla: string) => {
    return buildWhatsAppReservationLink(prenda, whatsAppNumber, talla);
  };

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-rose-200/70 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {/* 1. Full-Bleed Editorial Image Container (Aspect 3:4) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#FAF0F2]">
        {prenda.url_foto && !imgError ? (
          <Image
            src={prenda.url_foto}
            alt={prenda.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={() => setImgError(true)}
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 sm:p-6 text-center text-[#6B7280] bg-[#FAF0F2]">
            <ImageOff className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.5] mb-2 text-[#F43F5E]/60" />
            <span className="text-[10px] sm:text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Foto no disponible
            </span>
          </div>
        )}

        {/* Top Badge: Stock Inmediato */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col gap-1">
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-[#FFF1F2] text-[#F43F5E] border border-rose-200/80 rounded-full shadow-2xs">
            {prenda.estado === 'DISPONIBLE' ? 'En Stock' : prenda.estado}
          </span>
        </div>

        {/* Wishlist Heart Icon (Top Right) */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          type="button"
          aria-label="Añadir a favoritos"
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1.5 sm:p-2 rounded-full bg-white/90 backdrop-blur-sm text-[#1F2937] hover:scale-110 active:scale-95 transition-all shadow-xs"
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
              isLiked ? 'fill-[#F43F5E] text-[#F43F5E]' : 'text-[#1F2937] stroke-[1.8]'
            }`}
          />
        </button>
      </div>

      {/* 2. Product Meta & Details */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between bg-white border-t border-[#FCE7F3]/70">
        <div>
          {/* Title & Price Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-2 mb-1.5 sm:mb-2">
            <h3 className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-snug" title={prenda.nombre}>
              {prenda.nombre}
            </h3>
            <span className="font-bold text-sm sm:text-base text-slate-800 whitespace-nowrap">
              {formatCurrency(prenda.precio_total)}
            </span>
          </div>

          {/* Color Swatches & SKU Copy */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FCE7EA] border border-[#FCE7F3]" title="Rosa Blush" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#F7F3EE] border border-[#FCE7F3]" title="Marfil" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#1F2937] border border-[#1F2937]" title="Carbón" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#EDF7EE] border border-[#FCE7F3]" title="Salvia" />
            </div>

            {/* Quick SKU copy */}
            <button
              onClick={handleCopyCode}
              type="button"
              className="text-[9px] sm:text-[10px] font-mono text-[#6B7280] hover:text-[#1F2937] flex items-center gap-1 uppercase tracking-wider transition-colors truncate max-w-[95px] sm:max-w-none"
              title="Copiar Código de Prenda"
            >
              {copied ? (
                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" /> Copiado
                </span>
              ) : (
                <span className="flex items-center gap-0.5 truncate">
                  <Tag className="w-2.5 h-2.5 text-[#F43F5E] flex-shrink-0" />
                  Ref. {prenda.codigo_shein}
                </span>
              )}
            </button>
          </div>

          {/* Selector de Tallas Táctil */}
          <div className="mt-2.5 pt-2 border-t border-rose-100/70 flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] sm:text-xs font-semibold text-[#6B7280] uppercase tracking-wider mr-1 flex-shrink-0">
              Talla:
            </span>
            <div className="flex items-center gap-1">
              {sizes.map((s, idx) => {
                const isSelected = selectedTalla === s;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedTalla(s);
                    }}
                    className={`min-w-[24px] sm:min-w-[28px] h-6 sm:h-7 px-1.5 sm:px-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold uppercase transition-all duration-200 active:scale-95 flex items-center justify-center border ${
                      isSelected
                        ? 'bg-[#F43F5E] text-white border-[#F43F5E] shadow-2xs'
                        : 'bg-white text-[#1F2937] border-rose-200/80 hover:bg-[#FFF1F2] hover:text-[#F43F5E]'
                    }`}
                    title={`Seleccionar talla ${s}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Anticipo & Botón WhatsApp Ergonómico */}
        <div className="mt-2.5 pt-2 border-t border-[#FCE7F3]/70 flex flex-col gap-2">
          {/* Reservation pill */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs py-0.5 px-2 bg-rose-50 text-rose-600 rounded-md font-medium border border-rose-200/70">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <ShieldCheck className="w-3 h-3 text-[#F43F5E] flex-shrink-0" />
              Aparta con:
            </span>
            <span className="font-bold text-rose-600">
              {formatCurrency(reservaMonto)}
            </span>
          </div>

          {/* WhatsApp Button: Ancho completo, altura ergonómica h-10 sm:h-11 */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-10 sm:h-11 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2 rounded-xl bg-[#4E9F76] hover:bg-[#3D8361] text-white font-bold text-[10.5px] sm:text-xs uppercase tracking-wide shadow-sm hover:shadow-md active:scale-95 transition-all duration-200"
            title="Apartar por WhatsApp con Angélica Melgar"
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white flex-shrink-0" />
            <span className="truncate">APARTAR POR WHATSAPP</span>
          </a>
        </div>
      </div>
    </div>
  );
}
