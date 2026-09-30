'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Prenda } from '@/types/database';
import { INITIAL_PRENDAS } from '@/lib/demo-data';
import { Navbar } from '@/components/Navbar';
import { PrendaCard } from '@/components/PrendaCard';
import { CustomBoutiqueOrderBanner } from '@/components/CustomSheinOrderBanner';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import {
  Search,
  ShoppingBag,
  Heart,
  SlidersHorizontal,
  X,
} from 'lucide-react';

type CategoriaKey = 'TODAS' | 'VESTIDOS' | 'BLUSAS' | 'CONJUNTOS' | 'PANTALONES' | 'ABRIGOS';

interface CategoriaDef {
  id: CategoriaKey;
  label: string;
  icon: string;
  match: (name: string) => boolean;
}

const CATEGORIAS_CONFIG: CategoriaDef[] = [
  { id: 'TODAS', label: 'Todas las Prendas', icon: '✨', match: () => true },
  { id: 'VESTIDOS', label: 'Vestidos', icon: '👗', match: (n) => /vestid|dress/i.test(n) },
  { id: 'BLUSAS', label: 'Tops & Camisas', icon: '👚', match: (n) => /blusa|top|camisa|remera|crop|polo/i.test(n) },
  { id: 'CONJUNTOS', label: 'Conjuntos & Monos', icon: '🩱', match: (n) => /conjunto|set|mono|enterizo|pijama/i.test(n) },
  { id: 'PANTALONES', label: 'Pantalones & Faldas', icon: '👖', match: (n) => /pantalon|jean|falda|short|legging/i.test(n) },
  { id: 'ABRIGOS', label: 'Chaquetas & Abrigos', icon: '🧥', match: (n) => /chaqueta|cardigan|abrigo|sueter|sweater|saco/i.test(n) },
];

export default function TiendaPage() {
  const [prendas, setPrendas] = useState<Prenda[]>(INITIAL_PRENDAS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaKey>('TODAS');
  const [selectedTalla, setSelectedTalla] = useState<string>('TODAS');
  const [gridDensity, setGridDensity] = useState<2 | 3 | 4>(4);

  const whatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '59179010395';

  // Load garments from Supabase if configured, otherwise use initial seed/demo data
  useEffect(() => {
    async function fetchPrendas() {
      try {
        const { supabase, isSupabaseConfigured } = await import('@/lib/supabase/client');
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('prendas')
            .select('*')
            .eq('estado', 'DISPONIBLE')
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            setPrendas(data);
            return;
          }
        }
      } catch (err) {
        console.warn('Usando catálogo local / demo:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrendas();
  }, []);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoriaKey, number> = {
      TODAS: 0,
      VESTIDOS: 0,
      BLUSAS: 0,
      CONJUNTOS: 0,
      PANTALONES: 0,
      ABRIGOS: 0,
    };

    const disponibles = prendas.filter((p) => p.estado === 'DISPONIBLE');
    counts.TODAS = disponibles.length;

    disponibles.forEach((p) => {
      CATEGORIAS_CONFIG.forEach((cat) => {
        if (cat.id !== 'TODAS' && cat.match(p.nombre)) {
          counts[cat.id] = (counts[cat.id] || 0) + 1;
        }
      });
    });

    return counts;
  }, [prendas]);

  // Filtered garments (Only active DISPONIBLE items)
  const filteredPrendas = useMemo(() => {
    return prendas
      .filter((p) => p.estado === 'DISPONIBLE')
      .filter((p) => {
        // Category filter
        if (selectedCategoria !== 'TODAS') {
          const catDef = CATEGORIAS_CONFIG.find((c) => c.id === selectedCategoria);
          if (catDef && !catDef.match(p.nombre)) {
            return false;
          }
        }

        // Size filter
        if (selectedTalla !== 'TODAS') {
          const sizesInPrenda = p.talla.toUpperCase().split(',').map((s) => s.trim());
          if (!sizesInPrenda.includes(selectedTalla.toUpperCase())) {
            return false;
          }
        }

        // Search term
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          p.nombre.toLowerCase().includes(term) ||
          p.codigo_shein.toLowerCase().includes(term) ||
          p.talla.toLowerCase().includes(term)
        );
      });
  }, [prendas, selectedCategoria, selectedTalla, searchTerm]);

  const tallasDisponibles = ['TODAS', 'XS', 'S', 'M', 'L', 'XL', 'Única'];

  // Grid classes according to column density toggle (mobile-first 2 columns always)
  const gridClasses = useMemo(() => {
    switch (gridDensity) {
      case 2:
        return 'grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-6';
      case 3:
        return 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6';
      case 4:
      default:
        return 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6';
    }
  }, [gridDensity]);

  const hasActiveFilters = selectedCategoria !== 'TODAS' || selectedTalla !== 'TODAS' || searchTerm.trim() !== '';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategoria('TODAS');
    setSelectedTalla('TODAS');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF0F2] text-[#1F2937] overflow-x-hidden">
      {/* 1. Header Superior Compacto & Elegante */}
      <Navbar whatsAppNumber={whatsAppNumber} />

      {/* 2. Sub-Barra de Categorías Boutique (Sticky) */}
      <div className="sticky top-14 sm:top-20 z-30 w-full bg-white/95 backdrop-blur-md border-b border-rose-200/70 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar whitespace-nowrap">
            {CATEGORIAS_CONFIG.map((cat) => {
              const isSelected = selectedCategoria === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoria(cat.id)}
                  className={`flex-shrink-0 text-xs font-bold uppercase tracking-wider transition-all duration-300 ease-out py-1 px-2.5 rounded-lg flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#FFF1F2] text-[#F43F5E] border border-rose-200 shadow-2xs'
                      : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-rose-50/50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 rounded-full font-mono ${isSelected ? 'bg-[#F43F5E] text-white' : 'bg-slate-100 text-[#6B7280]'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Filtros Rápidos, Buscador & Conmutador de Columnas */}
      <div id="catalogo-section" className="max-w-[1440px] w-full mx-auto px-3 sm:px-8 pt-3 sm:pt-4 pb-2 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Buscador y Tallas */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full md:w-auto">
          {/* Barra de Búsqueda Rápida: 100% de ancho en móvil con esquinas suaves */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o código de prenda..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#FCE7F3] rounded-xl focus:border-[#F43F5E] focus:ring-2 focus:ring-[#FFF1F2] outline-none tracking-wide placeholder:text-[#6B7280] text-[#1F2937] shadow-2xs transition-all"
            />
            <Search className="w-4 h-4 text-[#F43F5E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Chips de filtro rápido por tallas: deslizables horizontalmente con touch fluido */}
          <div className="flex items-center overflow-x-auto no-scrollbar gap-2 py-2 px-1 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mr-1 flex-shrink-0 hidden sm:inline">
              Talla:
            </span>
            {tallasDisponibles.map((t) => {
              const isSelected = selectedTalla === t;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTalla(t)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all duration-300 ease-out active:scale-95 ${
                    isSelected
                      ? 'bg-[#F43F5E] text-white shadow-xs'
                      : 'bg-white text-[#1F2937] border border-[#FCE7F3] hover:bg-[#FFF1F2] hover:text-[#F43F5E]'
                  }`}
                >
                  {t}
                </button>
              );
            })}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex-shrink-0 text-[11px] font-bold text-[#F43F5E] hover:underline flex items-center gap-1 ml-1"
              >
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Contador de Prendas & Selector de Columnas */}
        <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto">
          <div className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">
            <strong className="text-[#1F2937] font-black">{filteredPrendas.length}</strong>{' '}
            {filteredPrendas.length === 1 ? 'prenda disponible' : 'prendas disponibles'}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#6B7280] uppercase tracking-wider hidden sm:inline">
              Columnas:
            </span>
            <div className="flex items-center border border-[#FCE7F3] rounded-xl overflow-hidden bg-white shadow-2xs">
              {[2, 3, 4].map((cols) => (
                <button
                  key={cols}
                  onClick={() => setGridDensity(cols as 2 | 3 | 4)}
                  className={`px-3 py-1 text-xs font-bold transition-all duration-300 ease-out ${
                    gridDensity === cols
                      ? 'bg-[#F43F5E] text-white shadow-2xs'
                      : 'text-[#1F2937] hover:bg-[#FFF1F2] hover:text-[#F43F5E]'
                  }`}
                  title={`Ver en ${cols} columnas`}
                >
                  {cols}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Cuadrícula de Prendas (Comienza Inmediatamente) */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {filteredPrendas.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-[#FCE7F3] shadow-sm max-w-lg mx-auto my-8">
            <ShoppingBag className="w-12 h-12 text-[#F43F5E]/60 mx-auto mb-3" />
            <h3 className="text-base font-bold uppercase tracking-wider text-[#1F2937]">
              No encontramos prendas disponibles
            </h3>
            <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto leading-relaxed">
              Prueba cambiando la categoría o la talla seleccionada, o consúltanos por WhatsApp para pedir tu prenda por encargo.
            </p>
            <button
              onClick={resetFilters}
              className="mt-6 px-6 py-2.5 bg-[#F43F5E] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-rose-600 active:scale-95 transition-all duration-300 ease-out shadow-sm"
            >
              Ver Todo el Stock
            </button>
          </div>
        ) : (
          <div className={gridClasses}>
            {filteredPrendas.map((prenda) => (
              <PrendaCard
                key={prenda.id}
                prenda={prenda}
                whatsAppNumber={whatsAppNumber}
              />
            ))}
          </div>
        )}

        {/* 5. Banner de Encargos Personalizados Boutique */}
        <CustomBoutiqueOrderBanner whatsAppNumber={whatsAppNumber} />

        {/* 6. Guía en 3 Pasos con Paleta Rose Gold */}
        <section className="my-10 sm:my-20 bg-white rounded-3xl p-5 sm:p-12 border border-[#FCE7F3] shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF1F2] text-[#F43F5E] text-[10px] font-bold uppercase tracking-wider mb-2 border border-[#FCE7F3] rounded-full">
              <Heart className="w-3 h-3 fill-[#F43F5E] text-[#F43F5E]" />
              <span>COMPRAS SEGURAS & CONFIABLES</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black uppercase text-[#1F2937] tracking-tight">
              ¿CÓMO APARTAR EN 3 PASOS?
            </h2>
            <p className="text-[11px] sm:text-xs text-[#6B7280] mt-1.5 tracking-wider uppercase font-semibold">
              Coordinación directa por WhatsApp con Angélica Melgar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 sm:p-7 bg-white rounded-2xl border border-rose-200/70 shadow-md hover:shadow-lg flex flex-col items-start transition-all duration-300 ease-out">
              <span className="text-xl sm:text-2xl font-black text-[#F43F5E] mb-2 font-mono">01</span>
              <h3 className="font-bold text-[#1F2937] text-xs sm:text-sm uppercase tracking-wider">
                Elige tu Prenda Favorita
              </h3>
              <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">
                Explora el catálogo en stock con precios en Bolivianos (Bs) y selecciona tu talla deseada.
              </p>
            </div>

            <div className="p-5 sm:p-7 bg-white rounded-2xl border border-rose-200/70 shadow-md hover:shadow-lg flex flex-col items-start transition-all duration-300 ease-out">
              <span className="text-xl sm:text-2xl font-black text-[#F43F5E] mb-2 font-mono">02</span>
              <h3 className="font-bold text-[#1F2937] text-xs sm:text-sm uppercase tracking-wider">
                Escribe a WhatsApp
              </h3>
              <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">
                Toca el botón verde para abrir el chat con Angélica Melgar (+591 79010395) con los datos y la foto listos.
              </p>
            </div>

            <div className="p-5 sm:p-7 bg-white rounded-2xl border border-rose-200/70 shadow-md hover:shadow-lg flex flex-col items-start transition-all duration-300 ease-out">
              <span className="text-xl sm:text-2xl font-black text-[#F43F5E] mb-2 font-mono">03</span>
              <h3 className="font-bold text-[#1F2937] text-xs sm:text-sm uppercase tracking-wider">
                Aparta y Recibe
              </h3>
              <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">
                Abona tu anticipo de 100 Bs para apartar y cancela el saldo restante al momento de la entrega en Santa Cruz o Bolivia.
              </p>
            </div>
          </div>
        </section>

        {/* 7. Opiniones de Clientas Reales */}
        <TestimonialsSection />
      </main>

      {/* 8. Footer Boutique */}
      <footer className="mt-auto border-t border-rose-200/70 bg-white py-8 sm:py-10 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-rose-100">
            {/* Brand Logo & Description */}
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 rounded-xl overflow-hidden border border-rose-200/70 bg-[#FAF0F2] flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="SO Shopping Online Logo"
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div>
                <h4 className="text-base font-black text-[#1F2937] uppercase tracking-tight">
                  SO SHOPPING ONLINE
                </h4>
                <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                  Boutique Femenina • Angélica Melgar (+591 79010395)
                </p>
              </div>
            </div>

            {/* Delivery cities badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#1F2937]">
              <span className="bg-rose-50/70 px-3 py-1 rounded-full border border-rose-200/60">SANTA CRUZ</span>
              <span className="bg-rose-50/70 px-3 py-1 rounded-full border border-rose-200/60">COCHABAMBA</span>
              <span className="bg-rose-50/70 px-3 py-1 rounded-full border border-rose-200/60">LA PAZ</span>
              <span className="bg-rose-50/70 px-3 py-1 rounded-full border border-rose-200/60">TARIJA</span>
              <span className="bg-[#FFF1F2] text-[#F43F5E] px-3 py-1 rounded-full border border-rose-200/60">TODA BOLIVIA 🇧🇴</span>
            </div>

            {/* Admin Link */}
            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1F2937] bg-white border border-rose-200/70 hover:bg-[#FFF1F2] hover:text-[#F43F5E] rounded-xl active:scale-95 transition-all duration-300 ease-out shadow-xs"
              >
                <span>Acceso Administrativo</span>
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280] uppercase tracking-wider font-semibold">
            <p>© {new Date().getFullYear()} SO SHOPPING ONLINE • TODOS LOS DERECHOS RESERVADOS.</p>
            <p className="text-[#1F2937] flex items-center gap-1 font-bold">
              HECHO CON <Heart className="w-3.5 h-3.5 fill-[#F43F5E] text-[#F43F5E]" /> PARA ANGÉLICA MELGAR
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
