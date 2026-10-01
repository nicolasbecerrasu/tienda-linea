'use client';

import React, { useState } from 'react';
import { ConciergeEvent, CriticalStockAlert } from '@/types/database';
import {
  MessageSquare,
  AlertTriangle,
  Sparkles,
  Crown,
  Calendar,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { VIP_TIERS_CONFIG } from '@/lib/utils';

interface ConciergeStreamProps {
  events: ConciergeEvent[];
  alerts: CriticalStockAlert[];
  onRestockClick?: (alertId: string) => void;
}

export function ConciergeStream({ events, alerts, onRestockClick }: ConciergeStreamProps) {
  const [restockedIds, setRestockedIds] = useState<string[]>([]);

  const handleRestock = (id: string) => {
    setRestockedIds((prev) => [...prev, id]);
    if (onRestockClick) onRestockClick(id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. REAL-TIME CONCIERGE ACTIVITY STREAM (SCREEN_4) */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#F3D8DF] shadow-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#F3D8DF]/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FBF1F3] text-[#E84364] flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#1F2937]">
                  Concierge Live Stream
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Hitos de clientas VIP y solicitudes en tiempo real
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> En Vivo
            </span>
          </div>

          {/* Event Stream List */}
          <div className="mt-4 divide-y divide-[#F3D8DF]/50">
            {events.map((evt) => {
              const tierBadge = VIP_TIERS_CONFIG[evt.vip_tier];
              return (
                <div key={evt.id} className="py-3 flex items-start justify-between gap-3 group">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FBF1F3] text-[#E84364] font-serif font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#F3D8DF]">
                      {evt.cliente_nombre[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#1F2937]">
                          {evt.cliente_nombre}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full border font-serif ${tierBadge?.badgeClass || 'bg-slate-100 text-slate-700'}`}
                        >
                          {tierBadge?.icon} {evt.vip_tier}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5 leading-snug">
                        {evt.descripcion}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono whitespace-nowrap flex-shrink-0">
                    {evt.hora}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F3D8DF]/60 flex items-center justify-between text-xs text-[#6B7280]">
          <span>Canal Concierge: WhatsApp & Suite VIP</span>
          <span className="font-semibold text-[#E84364]">SLA de Respuesta: &lt; 4 min</span>
        </div>
      </div>

      {/* 2. CRITICAL INVENTORY ALERTS & REPLENISHMENT (SCREEN_4) */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#F3D8DF] shadow-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#F3D8DF]/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#1F2937]">
                  Alertas Críticas de Stock
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Piezas de alta demanda por debajo del umbral mínimo de atelier
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
              {alerts.length} Críticos
            </span>
          </div>

          {/* Critical Stock List */}
          <div className="mt-4 space-y-3">
            {alerts.map((alert) => {
              const isRestocked = restockedIds.includes(alert.id);
              return (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-xl border border-[#F3D8DF] bg-[#FFF8F8] flex items-center justify-between gap-3 group hover:border-[#E84364] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#1F2937] truncate">
                        {alert.nombre}
                      </span>
                      <span className="text-[9px] font-mono text-[#6B7280] bg-white px-1.5 py-0.5 rounded border border-neutral-200">
                        {alert.codigo}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-[#6B7280]">
                      <span>Talla: <strong>{alert.talla}</strong></span>
                      <span>
                        Stock actual:{' '}
                        <strong className="text-red-600 font-mono">{alert.stock_actual} pza</strong>{' '}
                        (Mín: {alert.stock_minimo})
                      </span>
                    </div>
                  </div>

                  {/* Restock Action Button */}
                  <div className="flex-shrink-0">
                    {isRestocked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Solicitado
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRestock(alert.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#1F2937] hover:bg-[#E84364] text-white transition-all shadow-xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reponer</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F3D8DF]/60 flex items-center justify-between text-xs text-[#6B7280]">
          <span>Reposición conectada con Taller de Corte & Confección</span>
          <span className="font-semibold text-[#1F2937]">Lead Time: 48 Horas</span>
        </div>
      </div>
    </div>
  );
}
