'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Prenda } from '@/types/database';
import { INITIAL_PRENDAS } from '@/lib/demo-data';
import { Navbar } from '@/components/Navbar';
import { PrendaCard } from '@/components/PrendaCard';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Package,
  Heart,
  MessageCircle,
  Clock,
  ArrowRight,
  Star,
  CheckCircle2,
  Compass,
  Crown,
  ChevronRight,
  Filter,
} from 'lucide-react';

type CategoriaKey = 'TODAS' | 'GALA' | 'SASTRERIA' | 'CONJUNTOS' | 'JOYERIA';

interface CategoriaDef {
  id: CategoriaKey;
  label: string;
  match: (p: Prenda) => boolean;
}

const CATEGORIAS_CONFIG: CategoriaDef[] = [
  { id: 'TODAS', label: 'Todas las Piezas', match: () => true },
  { id: 'GALA', label: 'Vestidos de Gala', match: (p) => p.categoria === 'Vestidos de Gala' || /vestid|gala|capa/i.test(p.nombre) },
  { id: 'SASTRERIA', label: 'Sastrería & Tops', match: (p) => p.categoria === 'Sastrería & Tops' || /blusa|top|pantal|sastre/i.test(p.nombre) },
  { id: 'CONJUNTOS', label: 'Conjuntos Alta Costura', match: (p) => p.categoria === 'Conjuntos Alta Costura' || /conjunto|blazer/i.test(p.nombre) },
  { id: 'JOYERIA', label: 'Bolsos & Joyería', match: (p) => p.categoria === 'Bolsos & Joyería' || /bolso|joya|minaudi/i.test(p.nombre) },
];

export default function TiendaPage() {
  const [prendas, setPrendas] = useState<Prenda[]>(INITIAL_PRENDAS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaKey>('TODAS');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const whatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '12125558920';

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

  // Filtered garments
  const filteredPrendas = useMemo(() => {
    return prendas.filter((p) => {
      // Category filter
      const activeCat = CATEGORIAS_CONFIG.find((c) => c.id === selectedCategoria);
      if (activeCat && !activeCat.match(p)) return false;

      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        p.nombre.toLowerCase().includes(term) ||
        p.codigo_shein.toLowerCase().includes(term) ||
        (p.categoria && p.categoria.toLowerCase().includes(term))
      );
    });
  }, [prendas, selectedCategoria, searchTerm]);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSuccess(true);
    setTimeout(() => {
      setNewsletterEmail('');
      setNewsletterSuccess(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF1F3]">
      {/* Top Editorial Navbar */}
      <Navbar whatsAppNumber={whatsAppNumber} />

      {/* 1. HERO BANNER: FULL-BLEED EDITORIAL SHOWCASE (SCREEN_2) */}
      <section className="relative overflow-hidden bg-white border-b border-[#F3D8DF]">
        {/* Soft background ambient gradient */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#FFF8F8] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-[#FDE8ED]/50 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 sm:py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FBF1F3] border border-[#F3D8DF] text-[11px] font-semibold tracking-[0.2em] uppercase text-[#E84364]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cápsula Atelier 2026 • Otoño - Invierno</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#1F2937] tracking-tight leading-[1.12]">
                Poesía en Cada Costura & Silueta.
              </h1>

              <p className="text-sm sm:text-lg text-[#6B7280] leading-relaxed max-w-2xl font-light">
                Una oda al patronaje clásico, la seda pura italiana y la confección a medida. Edición numerada de tan solo <strong className="text-[#1F2937] font-semibold">40 piezas por diseño</strong>, entregadas con protocolo de guante blanco y concierge privado en 24/48h.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <a
                  href="#catalogo-section"
                  className="px-6 py-3.5 rounded-lg bg-[#1F2937] hover:bg-[#0F172A] text-white font-semibold text-xs uppercase tracking-widest text-center transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Explorar Cápsula</span>
                  <ArrowRight className="w-4 h-4 text-rose-300" />
                </a>

                <a
                  href={`https://wa.me/${whatsAppNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    'Estimada Concierge de SO Shopping Online, me gustaría coordinar una cita de prueba de ajuste personalizada en atelier.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-lg bg-white border border-[#F3D8DF] text-[#1F2937] hover:bg-[#FBF1F3] hover:text-[#E84364] font-semibold text-xs uppercase tracking-widest text-center transition-all shadow-2xs"
                >
                  Solicitar Cita de Concierge
                </a>
              </div>

              {/* Guarantees Strip */}
              <div className="pt-4 border-t border-[#F3D8DF]/70 grid grid-cols-3 gap-3 max-w-lg text-[11px] text-[#6B7280]">
                <div>
                  <span className="font-serif font-bold text-sm text-[#1F2937] block">40 Pzas</span>
                  <span className="text-[10px] uppercase tracking-wider">Por Modelo</span>
                </div>
                <div>
                  <span className="font-serif font-bold text-sm text-[#1F2937] block">24/48h</span>
                  <span className="text-[10px] uppercase tracking-wider">Despacho VIP</span>
                </div>
                <div>
                  <span className="font-serif font-bold text-sm text-[#1F2937] block">100% Seda</span>
                  <span className="text-[10px] uppercase tracking-wider">& Fibras Puras</span>
                </div>
              </div>
            </div>

            {/* Right Editorial Lookbook Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-elevated border border-[#F3D8DF] bg-[#FBF1F3]">
                <Image
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85"
                  alt="Editorial Lookbook SO Shopping Online"
                  fill
                  priority
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-rose-200">
                    Lookbook No. 04
                  </span>
                  <h3 className="font-serif text-lg font-bold">
                    Capa Imperial en Terciopelo de Seda
                  </h3>
                  <span className="text-xs text-neutral-300 font-mono mt-0.5">$1,450.00 USD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRODUCT SHOWCASE & CATEGORY FILTERS (SCREEN_2) */}
      <section id="catalogo-section" className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 sm:py-16 w-full">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#F3D8DF]">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#E84364] uppercase tracking-widest mb-1">
              <Crown className="w-3.5 h-3.5" />
              <span>Colección Exclusiva de Atelier</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#1F2937]">
              Piezas Icónicas de la Temporada
            </h2>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7280]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por silueta o SKU..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#F3D8DF] bg-white text-xs text-[#1F2937] placeholder:text-neutral-400 focus:border-[#1F2937] outline-none transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIAS_CONFIG.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoria(cat.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap uppercase tracking-wider transition-all ${
                selectedCategoria === cat.id
                  ? 'bg-[#1F2937] text-white shadow-xs'
                  : 'bg-white text-[#1F2937] border border-[#F3D8DF] hover:bg-[#FFF8F8] hover:border-[#E84364]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Garments Grid */}
        <div className="mt-8">
          {filteredPrendas.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-[#F3D8DF] shadow-card max-w-md mx-auto">
              <p className="font-serif text-lg font-bold text-[#1F2937]">No hay piezas con ese criterio</p>
              <p className="text-xs text-[#6B7280] mt-1">Prueba seleccionando otra categoría o limpiando la búsqueda.</p>
              <button
                onClick={() => {
                  setSelectedCategoria('TODAS');
                  setSearchTerm('');
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-[#1F2937] text-white text-xs font-semibold uppercase tracking-wider"
              >
                Ver Todas las Piezas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPrendas.map((prenda) => (
                <PrendaCard
                  key={prenda.id}
                  prenda={prenda}
                  whatsAppNumber={whatsAppNumber}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. ATELIER TRUST PILLARS (LUXURY EXPERIENCE GUARANTEES - SCREEN_2) */}
      <section id="atelier-pillars" className="bg-white border-y border-[#F3D8DF] py-16 sm:py-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-semibold text-[#E84364] uppercase tracking-widest">
              Hospitalidad Haute Couture
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2937] mt-1">
              Garantías de la Experiencia Atelier
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-2">
              Cada pedido refleja la excelencia y el trato exclusivo de las casas de alta costura europeas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-xl border border-[#F3D8DF] bg-[#FFF8F8] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#FBF1F3] text-[#E84364] flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-base text-[#1F2937]">Confección Artesanal</h3>
                <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                  Confección manual por maestras costureras en sedas puras de Como y linos italianos con acabados de alta sastrería.
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#E84364] font-semibold mt-4 block">
                Artesanía Certificada
              </span>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-xl border border-[#F3D8DF] bg-[#FFF8F8] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#FBF1F3] text-[#E84364] flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-base text-[#1F2937]">Concierge Privado 24/7</h3>
                <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                  Asesoría de estilismo personal para galas benéficas y coordinación de citas de fitting presencial en suite privada.
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#E84364] font-semibold mt-4 block">
                Atención Directa VIP
              </span>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-xl border border-[#F3D8DF] bg-[#FFF8F8] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#FBF1F3] text-[#E84364] flex items-center justify-center mb-4">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-base text-[#1F2937]">Packaging Perfumado</h3>
                <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                  Caja rígida de coleccionista forrada en lino marfil con papel de seda aromatizado con peonía silvestre y lacre floral.
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#E84364] font-semibold mt-4 block">
                Unboxing Sensorial
              </span>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-xl border border-[#F3D8DF] bg-[#FFF8F8] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#FBF1F3] text-[#E84364] flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-base text-[#1F2937]">Garantía & Ajustes 30 Días</h3>
                <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                  Devoluciones sin fricción en 30 días y servicio de ajuste de dobladillos o pinzas de cortesía en nuestro taller.
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[#E84364] font-semibold mt-4 block">
                Ajuste a Medida
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE LOOKBOOK & VIP TESTIMONIALS (SCREEN_2) */}
      <section id="lookbook-section" className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16 sm:py-20 w-full">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[11px] font-semibold text-[#E84364] uppercase tracking-widest">
            Patronas & Coleccionistas VIP
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2937] mt-1">
            Testimonios del Círculo Privado
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white border border-[#F3D8DF] shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-[#6B7280] italic leading-relaxed">
                "La caída del vestido de seda dupioni es una escultura viva. El empaque aromático y el trato personalizado de Marcella en concierge redefinieron mi experiencia de compra en línea."
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#F3D8DF]/60 flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-xs text-[#1F2937]">Valentina Cantú</h4>
                <span className="text-[10px] text-[#6B7280]">VIP Private Collector (New York)</span>
              </div>
              <span className="text-[10px] font-serif text-[#E84364] font-bold">Diamante</span>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-[#F3D8DF] shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-[#6B7280] italic leading-relaxed">
                "El conjunto de blazer bar y falda tableada posee una arquitectura impecable. Es confort contemporáneo con la seriedad de una casa de costura parisina."
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#F3D8DF]/60 flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-xs text-[#1F2937]">Carolina Herrera de la T.</h4>
                <span className="text-[10px] text-[#6B7280]">Clienta de Atelier (Madrid)</span>
              </div>
              <span className="text-[10px] font-serif text-[#E84364] font-bold">Diamante</span>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-[#F3D8DF] shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-[#6B7280] italic leading-relaxed">
                "Excelente coordinación en el despacho express con guante blanco. La atención directa por WhatsApp para confirmar medidas hizo toda la diferencia."
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-[#F3D8DF]/60 flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-xs text-[#1F2937]">Beatrice de la Riva</h4>
                <span className="text-[10px] text-[#6B7280]">Patrona de Alta Moda (Ciudad de México)</span>
              </div>
              <span className="text-[10px] font-serif text-[#1F2937] font-bold">Platinum</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRIVATE CIRCLE INVITATION BANNER (SCREEN_2) */}
      <section id="circulo-privado" className="bg-[#1F2937] text-white py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase tracking-widest text-rose-300">
              <Sparkles className="w-3 h-3 text-[#E84364]" />
              <span>Membresía Exclusiva por Invitación</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">
              Únete al Círculo Privado de SO Atelier
            </h2>

            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-light">
              Recibe acceso prioritario de 48 horas a las nuevas colecciones cápsula, invitaciones a trunk shows en París y Madrid, y un privilegio de cortesía del 15% en tu primera adquisición.
            </p>

            <form onSubmit={handleNewsletter} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Ingresa tu correo VIP personal..."
                className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-neutral-400 text-xs outline-none focus:border-rose-400 flex-1"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-[#E84364] hover:bg-[#D63353] text-white text-xs font-semibold uppercase tracking-wider transition-all"
              >
                Solicitar Acceso
              </button>
            </form>

            {newsletterSuccess && (
              <p className="text-xs text-rose-300 font-medium">
                ✨ Solicitud registrada. Recibirás tu invitación privada por correo de cortesía.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* GLOBAL FOOTER */}
      <footer className="bg-white border-t border-[#F3D8DF] py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm text-[#1F2937]">SO Shopping Online</span>
            <span>•</span>
            <span>Haute Couture & Atelier Suite © {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Atelier Central: Madrid • París • New York</span>
            <Link
              href="/dashboard"
              className="font-semibold text-[#1F2937] hover:text-[#E84364] flex items-center gap-1"
            >
              Suite Administrativa →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
