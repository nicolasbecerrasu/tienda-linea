'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Compra, Pedido, PedidoEstado, Prenda } from '@/types/database';
import { INITIAL_COMPRAS, INITIAL_PEDIDOS, INITIAL_PRENDAS } from '@/lib/demo-data';
import { PasscodeGate } from '@/components/PasscodeGate';
import { MetricsSummary } from '@/components/MetricsSummary';
import { StockSection } from '@/components/StockSection';
import { PedidosTable } from '@/components/PedidosTable';
import { ComprasSection } from '@/components/ComprasSection';
import { PrendaUploadModal } from '@/components/PrendaUploadModal';
import { NuevoPedidoModal } from '@/components/NuevoPedidoModal';
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Plus,
  Sparkles,
  LogOut,
  ExternalLink,
  Package,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'metricas' | 'stock' | 'pedidos' | 'compras'>('metricas');

  const [pedidos, setPedidos] = useState<Pedido[]>(INITIAL_PEDIDOS);
  const [prendas, setPrendas] = useState<Prenda[]>(INITIAL_PRENDAS);
  const [compras, setCompras] = useState<Compra[]>(INITIAL_COMPRAS);

  const [isPrendaModalOpen, setIsPrendaModalOpen] = useState(false);
  const [isPedidoModalOpen, setIsPedidoModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Check auth session on mount
  useEffect(() => {
    const auth = sessionStorage.getItem('so_dashboard_auth');
    setIsAuthenticated(auth === 'true');
  }, []);

  // Fetch initial data from Supabase
  const loadData = async () => {
    setLoadingData(true);
    try {
      const { supabase, isSupabaseConfigured } = await import('@/lib/supabase/client');
      setIsSupabaseConnected(isSupabaseConfigured);

      if (isSupabaseConfigured) {
        // Fetch Prendas
        const { data: prendasData } = await supabase
          .from('prendas')
          .select('*')
          .order('created_at', { ascending: false });

        if (prendasData && prendasData.length > 0) {
          setPrendas(prendasData);
        }

        // Fetch Pedidos with joined Prenda
        const { data: pedidosData } = await supabase
          .from('pedidos')
          .select('*, prenda:prendas(*)')
          .order('fecha_pedido', { ascending: false });

        if (pedidosData && pedidosData.length > 0) {
          setPedidos(pedidosData);
        }

        // Fetch Compras
        const { data: comprasData } = await supabase
          .from('compras')
          .select('*')
          .order('fecha_compra', { ascending: false });

        if (comprasData && comprasData.length > 0) {
          setCompras(comprasData);
        }
      }
    } catch (err) {
      console.warn('Utilizando datos locales/demostración:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Handle garment updates from Pestaña 2 (Stock)
  const handleUpdatePrenda = async (updatedPrenda: Prenda) => {
    try {
      const { supabase, isSupabaseConfigured } = await import('@/lib/supabase/client');
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('prendas')
          .update({
            nombre: updatedPrenda.nombre,
            codigo_shein: updatedPrenda.codigo_shein,
            talla: updatedPrenda.talla,
            precio_total: updatedPrenda.precio_total,
            precio_reserva: updatedPrenda.precio_reserva,
            estado: updatedPrenda.estado,
          })
          .eq('id', updatedPrenda.id);

        if (error) throw error;
      }

      setPrendas((prev) =>
        prev.map((p) => (p.id === updatedPrenda.id ? updatedPrenda : p))
      );
    } catch (err: any) {
      console.error('Error al actualizar prenda:', err);
      setPrendas((prev) =>
        prev.map((p) => (p.id === updatedPrenda.id ? updatedPrenda : p))
      );
      throw err;
    }
  };

  const handleEliminarPrenda = async (prendaId: string) => {
    try {
      const { supabase, isSupabaseConfigured } = await import('@/lib/supabase/client');
      if (isSupabaseConfigured) {
        await supabase.from('prendas').delete().eq('id', prendaId);
      }
      setPrendas((prev) => prev.filter((p) => p.id !== prendaId));
    } catch (err: any) {
      console.error('Error al eliminar prenda:', err);
      setPrendas((prev) => prev.filter((p) => p.id !== prendaId));
    }
  };

  // Handle order status update
  const handleUpdateEstado = async (pedidoId: string, nuevoEstado: PedidoEstado) => {
    if (nuevoEstado === 'LIQUIDADO') {
      await handleLiquidar(pedidoId);
      return;
    }

    try {
      const { supabase, isSupabaseConfigured } = await import('@/lib/supabase/client');
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('pedidos')
          .update({ estado: nuevoEstado })
          .eq('id', pedidoId);

        if (error) throw error;
      }

      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
      );
    } catch (err: any) {
      console.error('Error al actualizar estado:', err);
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
      );
    }
  };

  // Handle Liquidar Order (deletes photo from storage, keeps DB record)
  const handleLiquidar = async (pedidoId: string) => {
    try {
      const res = await fetch('/api/pedidos/liquidar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedido_id: pedidoId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al liquidar el pedido');
      }

      // Update state locally
      setPedidos((prev) =>
        prev.map((p) => {
          if (p.id === pedidoId) {
            return {
              ...p,
              estado: 'LIQUIDADO',
              anticipo_pagado: p.precio_total,
              saldo_pendiente: 0,
              prenda: p.prenda
                ? {
                    ...p.prenda,
                    url_foto: null,
                    storage_path: null,
                    estado: 'LIQUIDADO',
                  }
                : undefined,
            };
          }
          return p;
        })
      );

      // Also clear photo from prenda catalog state if matched
      const currentOrder = pedidos.find((p) => p.id === pedidoId);
      if (currentOrder?.prenda_id) {
        setPrendas((prev) =>
          prev.map((pr) =>
            pr.id === currentOrder.prenda_id
              ? { ...pr, url_foto: null, storage_path: null, estado: 'LIQUIDADO' }
              : pr
          )
        );
      }
    } catch (err: any) {
      console.error('Error en liquidar:', err);
      throw err;
    }
  };

  // Handle Register Purchase
  const handleCrearCompra = async (compraData: Omit<Compra, 'id' | 'created_at'>) => {
    try {
      const { supabase, isSupabaseConfigured } = await import('@/lib/supabase/client');
      let newCompra: Compra;

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('compras')
          .insert([compraData])
          .select()
          .single();

        if (error) throw error;
        newCompra = data;
      } else {
        newCompra = {
          id: `comp-${Date.now()}`,
          ...compraData,
          created_at: new Date().toISOString(),
        };
      }

      setCompras((prev) => [newCompra, ...prev]);
    } catch (err: any) {
      console.error('Error al registrar compra:', err);
      throw err;
    }
  };

  const handleEliminarCompra = async (id: string) => {
    try {
      const { supabase, isSupabaseConfigured } = await import('@/lib/supabase/client');
      if (isSupabaseConfigured) {
        await supabase.from('compras').delete().eq('id', id);
      }
      setCompras((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setCompras((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('so_dashboard_auth');
    setIsAuthenticated(false);
  };

  // Total active sales for net profit calculation
  const ventasTotales = useMemo(() => {
    return pedidos
      .filter((p) => p.estado !== 'CANCELADO')
      .reduce((acc, p) => acc + (Number(p.precio_total) || 0), 0);
  }, [pedidos]);

  const stockDisponibleCount = useMemo(() => {
    return prendas.filter((p) => p.estado === 'DISPONIBLE').length;
  }, [prendas]);

  // If checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF0F2]">
        <div className="w-8 h-8 border-4 border-[#F43F5E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not authenticated, render the Passcode Gate
  if (!isAuthenticated) {
    return <PasscodeGate onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF0F2] text-[#1F2937] overflow-x-hidden w-full">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-200/70 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-20 items-center justify-between">
            {/* Brand / Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 group min-w-0">
                <div className="relative h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl overflow-hidden border border-rose-200/70 shadow-xs bg-[#FFF1F2] flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <Image
                    src="/logo.png"
                    alt="SO Shopping Online Logo"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-xs sm:text-base font-black text-[#1F2937] leading-tight truncate">
                      SO <span className="text-[#F43F5E] font-serif italic">Shopping Online</span>
                    </h1>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#FFF1F2] border border-[#FCE7F3] text-[#F43F5E] font-bold hidden sm:inline">
                      Panel Boutique
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-[#6B7280] font-medium truncate">
                    Angélica Melgar (+591 79010395)
                  </p>
                </div>
              </Link>

              {/* Status pill */}
              <div
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                  isSupabaseConnected
                    ? 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
                title={
                  isSupabaseConnected
                    ? 'Conectado a la base de datos Supabase en tiempo real'
                    : 'Modo local activo'
                }
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSupabaseConnected ? 'bg-[#4E9F76] animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span>{isSupabaseConnected ? 'Supabase Conectado' : 'Modo Demostración'}</span>
              </div>
            </div>

            {/* Quick Actions & Navigation */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsPrendaModalOpen(true)}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-[11px] sm:text-xs font-bold shadow-sm shadow-rose-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Subir</span> Prenda
              </button>

              <button
                type="button"
                onClick={() => setIsPedidoModalOpen(true)}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-[#FCE7F3] bg-white hover:bg-[#FFF1F2] text-[#F43F5E] text-[11px] sm:text-xs font-bold shadow-xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F43F5E]" />
                <span className="hidden sm:inline">Nuevo</span> Encargo
              </button>

              <Link
                href="/"
                target="_blank"
                className="p-1.5 sm:p-2 rounded-xl text-[#6B7280] hover:text-[#F43F5E] hover:bg-[#FFF1F2] transition-colors"
                title="Ver Tienda Pública"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs: 2x2 Grid on Mobile (<640px) & Single Row on Desktop (sm:) */}
          <div className="py-2.5 mb-2 sm:mb-0">
            <div className="grid grid-cols-2 sm:inline-flex gap-2 sm:gap-1 p-1.5 bg-white border border-rose-100 rounded-2xl shadow-sm w-full sm:w-auto">
              {/* Fila 1 - Col 1: Métricas */}
              <button
                onClick={() => setActiveTab('metricas')}
                className={`py-2 px-2 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-lg text-xs font-medium sm:font-semibold transition-all whitespace-nowrap active:scale-95 flex items-center justify-center gap-1.5 ${
                  activeTab === 'metricas'
                    ? 'bg-rose-50 text-[#F43F5E] font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-rose-50/50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Métricas</span>
              </button>

              {/* Fila 1 - Col 2: Stock Inmediato */}
              <button
                onClick={() => setActiveTab('stock')}
                className={`py-2 px-2 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-lg text-xs font-medium sm:font-semibold transition-all whitespace-nowrap active:scale-95 flex items-center justify-center gap-1.5 ${
                  activeTab === 'stock'
                    ? 'bg-rose-50 text-[#F43F5E] font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-rose-50/50'
                }`}
              >
                <Package className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Stock Inmediato</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold flex-shrink-0 ${
                    activeTab === 'stock'
                      ? 'bg-[#F43F5E] text-white'
                      : 'bg-rose-100/70 text-[#F43F5E]'
                  }`}
                >
                  {stockDisponibleCount}
                </span>
              </button>

              {/* Fila 2 - Col 1: Pedidos */}
              <button
                onClick={() => setActiveTab('pedidos')}
                className={`py-2 px-2 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-lg text-xs font-medium sm:font-semibold transition-all whitespace-nowrap active:scale-95 flex items-center justify-center gap-1.5 ${
                  activeTab === 'pedidos'
                    ? 'bg-rose-50 text-[#F43F5E] font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-rose-50/50'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Pedidos</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold flex-shrink-0 ${
                    activeTab === 'pedidos'
                      ? 'bg-[#F43F5E] text-white'
                      : 'bg-rose-100/70 text-[#F43F5E]'
                  }`}
                >
                  {pedidos.length}
                </span>
              </button>

              {/* Fila 2 - Col 2: Compras */}
              <button
                onClick={() => setActiveTab('compras')}
                className={`py-2 px-2 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-lg text-xs font-medium sm:font-semibold transition-all whitespace-nowrap active:scale-95 flex items-center justify-center gap-1.5 ${
                  activeTab === 'compras'
                    ? 'bg-rose-50 text-[#F43F5E] font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-rose-50/50'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Compras</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold flex-shrink-0 ${
                    activeTab === 'compras'
                      ? 'bg-[#F43F5E] text-white'
                      : 'bg-rose-100/70 text-[#F43F5E]'
                  }`}
                >
                  {compras.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 overflow-x-hidden">
        {/* PESTAÑA 1: CAJA Y MÉTRICAS */}
        {activeTab === 'metricas' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Resumen Financiero</h2>
              </div>
              <button
                onClick={loadData}
                disabled={loadingData}
                className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-[#F43F5E] bg-white px-3 py-1.5 rounded-xl border border-rose-100 shadow-xs hover:bg-rose-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
                <span>Actualizar Datos</span>
              </button>
            </div>

            <MetricsSummary pedidos={pedidos} compras={compras} />
          </section>
        )}

        {/* PESTAÑA 2: TIENDA / STOCK DISPONIBLE */}
        {activeTab === 'stock' && (
          <section className="space-y-4">
            <StockSection
              prendas={prendas}
              onUpdatePrenda={handleUpdatePrenda}
              onEliminarPrenda={handleEliminarPrenda}
              onOpenUploadModal={() => setIsPrendaModalOpen(true)}
            />
          </section>
        )}

        {/* PESTAÑA 3: PEDIDOS POR ENCARGO Y DEUDAS */}
        {activeTab === 'pedidos' && (
          <section className="space-y-4">
            <PedidosTable
              pedidos={pedidos}
              onUpdateEstado={handleUpdateEstado}
              onLiquidar={handleLiquidar}
              onNuevoPedidoClick={() => setIsPedidoModalOpen(true)}
            />
          </section>
        )}

        {/* PESTAÑA 4: COMPRAS E INVERSIÓN DE LOTES */}
        {activeTab === 'compras' && (
          <section className="space-y-4">
            <ComprasSection
              compras={compras}
              ventasTotales={ventasTotales}
              onCrearCompra={handleCrearCompra}
              onEliminarCompra={handleEliminarCompra}
            />
          </section>
        )}
      </main>

      {/* MODAL: SUBIR PRENDA CON FOTO */}
      <PrendaUploadModal
        isOpen={isPrendaModalOpen}
        onClose={() => setIsPrendaModalOpen(false)}
        onPrendaCreated={(newPrenda) => {
          setPrendas((prev) => [newPrenda, ...prev]);
        }}
      />

      {/* MODAL: NUEVO PEDIDO / ENCARGO */}
      <NuevoPedidoModal
        isOpen={isPedidoModalOpen}
        prendas={prendas}
        onClose={() => setIsPedidoModalOpen(false)}
        onPedidoCreated={(newPedido) => {
          setPedidos((prev) => [newPedido, ...prev]);
        }}
        onPrendaCreated={(newPrenda) => {
          setPrendas((prev) => [newPrenda, ...prev]);
        }}
      />
    </div>
  );
}
