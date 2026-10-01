'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AbonoPedido, Compra, ConciergeEvent, CriticalStockAlert, Pedido, PedidoEstado, Prenda } from '@/types/database';
import { INITIAL_COMPRAS, INITIAL_CONCIERGE_STREAM, INITIAL_CRITICAL_ALERTS, INITIAL_PEDIDOS, INITIAL_PRENDAS } from '@/lib/demo-data';
import { PasscodeGate } from '@/components/PasscodeGate';
import { MetricsSummary } from '@/components/MetricsSummary';
import { StockSection } from '@/components/StockSection';
import { PedidosTable } from '@/components/PedidosTable';
import { ComprasSection } from '@/components/ComprasSection';
import { ConciergeStream } from '@/components/ConciergeStream';
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
  MessageSquare,
  ShieldCheck,
  Crown,
} from 'lucide-react';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<'direccion' | 'concierge'>('direccion');
  const [activeTab, setActiveTab] = useState<'metricas' | 'concierge' | 'pedidos' | 'stock' | 'compras'>('metricas');

  const [pedidos, setPedidos] = useState<Pedido[]>(INITIAL_PEDIDOS);
  const [prendas, setPrendas] = useState<Prenda[]>(INITIAL_PRENDAS);
  const [compras, setCompras] = useState<Compra[]>(INITIAL_COMPRAS);
  const [conciergeEvents, setConciergeEvents] = useState<ConciergeEvent[]>(INITIAL_CONCIERGE_STREAM);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalStockAlert[]>(INITIAL_CRITICAL_ALERTS);

  const [isPrendaModalOpen, setIsPrendaModalOpen] = useState(false);
  const [isPedidoModalOpen, setIsPedidoModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Check auth session on mount
  useEffect(() => {
    const auth = sessionStorage.getItem('so_dashboard_auth');
    const role = (sessionStorage.getItem('so_user_role') as 'direccion' | 'concierge') || 'direccion';
    setIsAuthenticated(auth === 'true');
    setUserRole(role);
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
    } catch (err) {
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
    } catch (err) {
      console.error('Error en liquidar:', err);
      throw err;
    }
  };

  // Handle Restock action
  const handleRestock = (alertId: string) => {
    // Add event to live stream
    const targetAlert = criticalAlerts.find((a) => a.id === alertId);
    if (targetAlert) {
      const newEvt: ConciergeEvent = {
        id: `evt-${Date.now()}`,
        cliente_nombre: 'Atelier Central',
        tipo: 'bespoke_appointment',
        descripcion: `Reposición urgente de 10 unidades de ${targetAlert.nombre} enviada al Taller`,
        hora: 'Justo ahora',
        vip_tier: 'Diamante',
      };
      setConciergeEvents((prev) => [newEvt, ...prev]);
    }
  };

  // Handle update garment stock
  const handleUpdatePrenda = async (updatedPrenda: Prenda) => {
    try {
      const { supabase, isSupabaseConfigured } = await import('@/lib/supabase/client');
      if (isSupabaseConfigured) {
        await supabase
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
      }
      setPrendas((prev) =>
        prev.map((p) => (p.id === updatedPrenda.id ? updatedPrenda : p))
      );
    } catch (err) {
      console.error('Error al actualizar prenda:', err);
      setPrendas((prev) =>
        prev.map((p) => (p.id === updatedPrenda.id ? updatedPrenda : p))
      );
    }
  };

  const handleEliminarPrenda = async (prendaId: string) => {
    try {
      const { supabase, isSupabaseConfigured } = await import('@/lib/supabase/client');
      if (isSupabaseConfigured) {
        await supabase.from('prendas').delete().eq('id', prendaId);
      }
      setPrendas((prev) => prev.filter((p) => p.id !== prendaId));
    } catch (err) {
      console.error('Error al eliminar prenda:', err);
      setPrendas((prev) => prev.filter((p) => p.id !== prendaId));
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
    setCompras((prev) => prev.filter((c) => c.id !== id));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('so_dashboard_auth');
    sessionStorage.removeItem('so_user_role');
    setIsAuthenticated(false);
  };

  const ventasTotales = useMemo(() => {
    return pedidos
      .filter((p) => p.estado !== 'CANCELADO')
      .reduce((acc, p) => acc + (Number(p.precio_total) || 0), 0);
  }, [pedidos]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF1F3]">
        <div className="w-8 h-8 border-4 border-[#E84364] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <PasscodeGate
        onSuccess={(role) => {
          setUserRole(role);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF1F3] text-[#1F2937]">
      {/* Top Haute Administration Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F3D8DF] shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            {/* Brand Logo & Role Badge */}
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="relative h-11 w-11 rounded-lg overflow-hidden border border-[#F3D8DF] bg-white p-1 flex-shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-2xs">
                  <Image
                    src="/logo.png"
                    alt="SO Shopping Online Atelier Logo"
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm sm:text-base font-serif font-bold text-[#1F2937] leading-tight">
                      SO Atelier Suite
                    </h1>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FBF1F3] border border-[#F3D8DF] text-[#E84364] font-semibold uppercase tracking-wider">
                      {userRole === 'direccion' ? 'Dirección General' : 'Concierge & Ventas'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#6B7280] font-sans">
                    Operaciones & Logística White-Glove
                  </p>
                </div>
              </Link>

              {/* Status pill */}
              <div
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                  isSupabaseConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span>{isSupabaseConnected ? 'Supabase Live' : 'Atelier Demo Mode'}</span>
              </div>
            </div>

            {/* Quick Actions & Navigation */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsPrendaModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1F2937] hover:bg-[#0F172A] text-white text-xs font-semibold uppercase tracking-wider shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-rose-300" />
                <span className="hidden sm:inline">Nueva</span> Pieza
              </button>

              <button
                type="button"
                onClick={() => setIsPedidoModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#F3D8DF] bg-[#FFF8F8] hover:bg-[#FBF1F3] text-[#E84364] text-xs font-semibold uppercase tracking-wider shadow-2xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E84364]" />
                <span className="hidden sm:inline">Bespoke</span> Pedido
              </button>

              <Link
                href="/"
                target="_blank"
                className="p-2 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-[#FBF1F3] transition-colors"
                title="Ver Boutique Pública"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Haute Administration Tabs Bar */}
          <div className="py-2.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('metricas')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'metricas'
                    ? 'bg-[#1F2937] text-white shadow-xs'
                    : 'bg-white text-[#1F2937] border border-[#F3D8DF] hover:bg-[#FFF8F8]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#E84364]" />
                <span>KPIs & Caja</span>
              </button>

              <button
                onClick={() => setActiveTab('concierge')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'concierge'
                    ? 'bg-[#1F2937] text-white shadow-xs'
                    : 'bg-white text-[#1F2937] border border-[#F3D8DF] hover:bg-[#FFF8F8]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#E84364]" />
                <span>Concierge & Alertas</span>
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded-full font-bold">
                  {criticalAlerts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('pedidos')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'pedidos'
                    ? 'bg-[#1F2937] text-white shadow-xs'
                    : 'bg-white text-[#1F2937] border border-[#F3D8DF] hover:bg-[#FFF8F8]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#E84364]" />
                <span>Logística & Despacho</span>
                <span className="text-[10px] bg-neutral-200 text-neutral-800 px-1.5 py-0.2 rounded-full font-bold">
                  {pedidos.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('stock')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'stock'
                    ? 'bg-[#1F2937] text-white shadow-xs'
                    : 'bg-white text-[#1F2937] border border-[#F3D8DF] hover:bg-[#FFF8F8]'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-[#E84364]" />
                <span>Catálogo de Atelier</span>
                <span className="text-[10px] bg-neutral-200 text-neutral-800 px-1.5 py-0.2 rounded-full font-bold">
                  {prendas.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('compras')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'compras'
                    ? 'bg-[#1F2937] text-white shadow-xs'
                    : 'bg-white text-[#1F2937] border border-[#F3D8DF] hover:bg-[#FFF8F8]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-[#E84364]" />
                <span>Telas & Compras</span>
                <span className="text-[10px] bg-neutral-200 text-neutral-800 px-1.5 py-0.2 rounded-full font-bold">
                  {compras.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Operations Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* TAB 1: EXECUTIVE METRICS & REVENUE BREAKDOWN (SCREEN_4) */}
        {activeTab === 'metricas' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#1F2937]">
                  Panel de Desempeño Ejecutivo
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Ventas netas, valor de ticket medio y evolución de ingresos de atelier
                </p>
              </div>
              <button
                onClick={loadData}
                disabled={loadingData}
                className="inline-flex items-center gap-1.5 text-xs text-[#1F2937] bg-white px-3 py-1.5 rounded-lg border border-[#F3D8DF] shadow-2xs hover:bg-[#FBF1F3] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
                <span>Actualizar Datos</span>
              </button>
            </div>

            <MetricsSummary pedidos={pedidos} compras={compras} />
          </section>
        )}

        {/* TAB 2: CONCIERGE STREAM & CRITICAL STOCK REPLENISHMENT (SCREEN_4) */}
        {activeTab === 'concierge' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#1F2937]">
                  Concierge Live Stream & Salud de Inventario
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Monitoreo en tiempo real de interacciones VIP y reabastecimiento crítico
                </p>
              </div>
            </div>

            <ConciergeStream
              events={conciergeEvents}
              alerts={criticalAlerts}
              onRestockClick={handleRestock}
            />
          </section>
        )}

        {/* TAB 3: BOUTIQUE LOGISTICS & ORDERS PIPELINE */}
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

        {/* TAB 4: ATELIER CATALOG & STOCK MANAGEMENT */}
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

        {/* TAB 5: FABRIC PURCHASES & ATELIER COSTS */}
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

      {/* MODAL: SUBIR PRENDA CON FOTO A SUPABASE STORAGE */}
      <PrendaUploadModal
        isOpen={isPrendaModalOpen}
        onClose={() => setIsPrendaModalOpen(false)}
        onPrendaCreated={(newPrenda) => {
          setPrendas((prev) => [newPrenda, ...prev]);
        }}
      />

      {/* MODAL: REGISTRAR PEDIDO BESPOKE CON FOTO */}
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
