'use client';

import React from 'react';
import { Star, Heart, CheckCircle2 } from 'lucide-react';

interface Testimonial {
  id: number;
  nombre: string;
  ciudad: string;
  estrellas: number;
  comentario: string;
  prenda: string;
  fecha: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    nombre: 'Camila Villarroel',
    ciudad: 'Santa Cruz de la Sierra',
    estrellas: 5,
    comentario:
      '¡Me encantó mi vestido! Llegó súper rápido a mi domicilio y la atención de Angélica fue un 10/10. Lo mejor de todo es que pude apartarlo con solo 100 Bs y pagar el saldo cuando me lo entregaron.',
    prenda: 'Vestido Floral Elegante Boutique',
    fecha: 'Hace 3 días',
  },
  {
    id: 2,
    nombre: 'Valeria Morales',
    ciudad: 'Cochabamba',
    estrellas: 5,
    comentario:
      'Encargué 2 blusas que no encontraba en ninguna tienda de mi ciudad. Me las trajeron en el tiempo pactado, la talla vino exacta y de hermosa calidad. ¡Súper recomendada SO Shopping Online!',
    prenda: 'Blusa Satén & Top Crop',
    fecha: 'Hace 1 semana',
  },
  {
    id: 3,
    nombre: 'Sofía Rocha',
    ciudad: 'La Paz',
    estrellas: 5,
    comentario:
      'Siempre me daba desconfianza dar anticipos en línea, pero con Angélica todo fue transparente. Me mandó fotos reales de la prenda y el número de guía de envío. Ya hice mi tercer pedido.',
    prenda: 'Conjunto Deportivo Rose Gold',
    fecha: 'Hace 2 semanas',
  },
  {
    id: 4,
    nombre: 'Natalia Gutiérrez',
    ciudad: 'Santa Cruz de la Sierra',
    estrellas: 5,
    comentario:
      'La calidad de la ropa que tienen en stock para entrega inmediata es hermosa. Además el detalle de apartar directamente por WhatsApp hace que comprar sea rapidísimo y sin vueltas.',
    prenda: 'Enterizo Casual Boutique',
    fecha: 'Hace 3 semanas',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonios" className="my-16 sm:my-24">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 px-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF1F2] text-[#F43F5E] text-[10px] font-bold uppercase tracking-wider mb-3 border border-[#FCE7F3] rounded-full">
          <Heart className="w-3 h-3 fill-[#F43F5E] text-[#F43F5E]" />
          <span>CLIENTAS REALES EN BOLIVIA</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-[#1F2937] tracking-tight uppercase">
          OPINIONES & CONFIANZA
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-[#6B7280] tracking-wide">
          Más de 500 clientas satisfechas en Santa Cruz, La Paz, Cochabamba y todo el país.
        </p>

        {/* Global Rating Badge */}
        <div className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#FCE7F3] shadow-xs">
          <div className="flex items-center gap-0.5 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
            ))}
          </div>
          <span className="text-xs font-black text-[#1F2937]">4.9 / 5.0</span>
          <span className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold">
            • Calificación Verificada
          </span>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.id}
            className="flex flex-col justify-between bg-white p-6 rounded-2xl border border-rose-200/70 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(t.estrellas)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verificada
                </span>
              </div>

              <p className="text-xs text-[#1F2937] leading-relaxed font-normal">
                &ldquo;{t.comentario}&rdquo;
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-rose-100 flex flex-col gap-1">
              <span className="font-bold text-[#1F2937] text-xs uppercase tracking-wider">
                {t.nombre}
              </span>
              <span className="text-[11px] text-[#F43F5E] font-semibold">{t.ciudad}</span>
              <span className="text-[10px] text-[#6B7280] font-mono bg-rose-50/70 px-2 py-1 mt-1 rounded-lg border border-rose-200/60 truncate uppercase">
                {t.prenda}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
