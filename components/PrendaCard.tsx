'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Prenda } from '@/types/database';
import { buildWhatsAppReservationLink, formatCurrency } from '@/lib/utils';
import { MessageCircle, Check, Tag, ShieldCheck, Heart, ImageOff, Sparkles } from 'lucide-react';

interface PrendaCardProps {
  prenda: Prenda;
  whatsAppNumber?: string;
  onQuickAdd?: (prenda: Prenda, size: string) => void;
}

export function PrendaCard({ prenda, whatsAppNumber, onQuickAdd }: PrendaCardProps) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Available sizes
  const sizesList = prenda.talla ? prenda.talla.split(',').map((s) => s.trim()) : ['Talla Única'];
  const [selectedTalla, setSelectedTalla] = useState<string>(sizesList[0] || 'Talla Única');

  // Swatches
  const swatches = prenda.swatches || ['#1F2937', '#E84364', '#F5E4E8'];
  const [selectedSwatch, setSelectedSwatch] = useState<number>(0);

  const reservaMonto = prenda.precio_reserva || prenda.precio_total * 0.5;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(prenda.codigo_shein);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = buildWhatsAppReservationLink(prenda, whatsAppNumber);

  return (
    <div className="group flex flex-col bg-white rounded-xl overflow-hidden border border-[#F3D8DF] shadow-card hover:shadow-atelier hover:-translate-y-1 transition-all duration-300">
      {/* 1. Full-Bleed Editorial Image Container (Aspect 3:4) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#FBF1F3]">
        {prenda.url_foto && !imgError ? (
          <Image
            src={prenda.url_foto}
            alt={prenda.nombre}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={() => setImgError(true)}
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-[#6B7280] bg-[#FBF1F3]">
            <ImageOff className="w-10 h-10 stroke-[1.5] mb-2 text-[#E84364]/50" />
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              Lookbook no disponible
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/95 backdrop-blur-sm text-[#1F2937] border border-[#F3D8DF] rounded-md shadow-2xs">
            {prenda.categoria || 'Alta Costura'}
          </span>
          {prenda.edicion_limitada && (
            <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-[#1F2937]/90 text-rose-200 rounded-md backdrop-blur-sm">
              Edición {prenda.edicion_limitada} Pzas
            </span>
          )}
        </div>

        {/* Wishlist Heart Icon */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          type="button"
          aria-label="Guardar en lista privada"
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm text-[#1F2937] hover:scale-110 active:scale-95 transition-all shadow-xs"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              isLiked ? 'fill-[#E84364] text-[#E84364]' : 'text-[#1F2937] stroke-[1.8]'
            }`}
          />
        </button>

        {/* Stock Alert Pill if critical */}
        {prenda.alerta_critica && (
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div className="py-1 px-2.5 rounded-md bg-[#1F2937]/85 backdrop-blur-md text-white text-[10px] font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1 text-rose-300">
                <Sparkles className="w-3 h-3 text-[#E84364]" />
                Últimas piezas en atelier
              </span>
              <span className="text-neutral-300">{prenda.stock_disponible || 2} disp.</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Product Meta & Details */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Swatches & SKU */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              {swatches.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedSwatch(idx)}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    selectedSwatch === idx ? 'scale-125 ring-1 ring-[#E84364] ring-offset-1' : 'border-neutral-200'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Color variante ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleCopyCode}
              type="button"
              className="text-[10px] font-mono text-[#6B7280] hover:text-[#1F2937] flex items-center gap-1 uppercase tracking-wider transition-colors"
              title="Copiar Código de Prenda"
            >
              {copied ? (
                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                  <Check className="w-3 h-3 text-emerald-600" /> Copiado
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5 text-[#E84364]" />
                  {prenda.codigo_shein}
                </span>
              )}
            </button>
          </div>

          {/* Title in Editorial Serif */}
          <h3 className="font-serif font-bold text-sm sm:text-base text-[#1F2937] line-clamp-2 leading-snug min-h-[2.5rem]">
            {prenda.nombre}
          </h3>

          {/* Price strip */}
          <div className="mt-2 flex items-baseline justify-between border-b border-[#F3D8DF]/60 pb-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#6B7280] block font-medium">Inversión</span>
              <span className="text-base sm:text-lg font-bold text-[#1F2937]">
                {formatCurrency(prenda.precio_total)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#E84364] block font-semibold">Reserva Atelier</span>
              <span className="text-xs sm:text-sm font-bold text-[#E84364] bg-[#FBF1F3] px-2 py-0.5 rounded">
                {formatCurrency(reservaMonto)}
              </span>
            </div>
          </div>

          {/* Size Selector */}
          <div className="mt-3">
            <span className="text-[10px] uppercase tracking-wider text-[#6B7280] block font-semibold mb-1.5">
              Talla Atelier:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {sizesList.map((sz, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedTalla(sz)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-all ${
                    selectedTalla === sz
                      ? 'bg-[#1F2937] text-white border-[#1F2937]'
                      : 'bg-[#FFF8F8] text-[#1F2937] border-[#F3D8DF] hover:border-[#E84364]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Action Buttons */}
        <div className="mt-5 pt-3 border-t border-[#F3D8DF]/60 flex flex-col gap-2">
          {/* VIP WhatsApp Concierge Reservation */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-lg bg-[#E84364] hover:bg-[#D63353] active:scale-[0.98] text-white font-semibold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-white fill-white" />
            <span>Apartar con Concierge VIP</span>
          </a>
        </div>
      </div>
    </div>
  );
}
