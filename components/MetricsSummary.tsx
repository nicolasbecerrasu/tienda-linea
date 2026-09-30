'use client';

import React, { useMemo } from 'react';
import { Pedido, Compra } from '@/types/database';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  PackageCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  AlertCircle,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

interface MetricsSummaryProps {
  pedidos: Pedido[];
  compras: Compra[];
}

function formatTick(tick: number): string {
  if (tick === 0) return '0 Bs';
  if (tick >= 1000) {
    const k = tick / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}k Bs`;
  }
  return `${tick} Bs`;
}

function formatBarAmount(amount: number): string {
  if (amount <= 0) return '';
  if (amount >= 1000) {
    const k = amount / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  return `${amount}`;
}

export function MetricsSummary({ pedidos, compras }: MetricsSummaryProps) {
  const metrics = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 1. Anticipos cobrados (total de dinero ya en mano de pedidos activos)
    const anticiposCobrados = pedidos
      .filter((p) => p.estado !== 'CANCELADO')
      .reduce((acc, p) => acc + (Number(p.anticipo_pagado) || 0), 0);

    // 2. Deuda en calle (saldo pendiente por cobrar de pedidos activos)
    const deudaEnCalle = pedidos
      .filter((p) => p.estado !== 'LIQUIDADO' && p.estado !== 'CANCELADO')
      .reduce((acc, p) => acc + (Number(p.saldo_pendiente) || 0), 0);

    // 3. Prendas listas para entrega (saldo inmediato por cobrar)
    const pedidosListos = pedidos.filter((p) => p.estado === 'LISTO_ENTREGA');
    const porCobrarListas = pedidosListos.reduce((acc, p) => acc + (Number(p.saldo_pendiente) || 0), 0);

    // 4. Inversión en Compras Shein
    const comprasTotales = compras.reduce((acc, c) => acc + (Number(c.costo_total) || 0), 0);

    // 5. Ventas totales (valor comercial de pedidos activos)
    const ventasTotales = pedidos
      .filter((p) => p.estado !== 'CANCELADO')
      .reduce((acc, p) => acc + (Number(p.precio_total) || 0), 0);

    // 6. Ganancia neta estimada
    const gananciaNeta = ventasTotales - comprasTotales;

    // Monthly chart data calculation (last 6 months)
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyMap: Record<string, { label: string; ventas: number; anticipos: number; count: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyMap[key] = {
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        ventas: 0,
        anticipos: 0,
        count: 0,
      };
    }

    pedidos.forEach((p) => {
      if (p.estado === 'CANCELADO') return;
      const d = new Date(p.fecha_pedido || p.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthlyMap[key]) {
        monthlyMap[key].ventas += Number(p.precio_total) || 0;
        monthlyMap[key].anticipos += Number(p.anticipo_pagado) || 0;
        monthlyMap[key].count += 1;
      }
    });

    const chartData = Object.values(monthlyMap);
    const rawMax = Math.max(...chartData.map((m) => Math.max(m.ventas, m.anticipos)), 1000);

    let step = 250;
    if (rawMax <= 1000) step = 250;
    else if (rawMax <= 2000) step = 500;
    else if (rawMax <= 4000) step = 1000;
    else if (rawMax <= 8000) step = 2000;
    else step = Math.ceil(rawMax / 4 / 1000) * 1000;

    const yAxisMax = step * 4;
    const yTicks = [yAxisMax, step * 3, step * 2, step, 0];

    return {
      anticiposCobrados,
      deudaEnCalle,
      porCobrarListas,
      pedidosListosCount: pedidosListos.length,
      comprasTotales,
      ventasTotales,
      gananciaNeta,
      chartData,
      maxVal: yAxisMax,
      yTicks,
    };
  }, [pedidos, compras]);

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* 4 Cards de Métricas Principales: 2 Columnas Ordenadas en Móvil (<640px) y 4 en Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5 w-full">
        {/* Card 1: Anticipos Cobrados */}
        <div className="bg-white border border-rose-200/70 shadow-md hover:shadow-lg rounded-2xl p-3 sm:p-5 transition-shadow duration-200 flex flex-col justify-between min-h-[110px] sm:min-h-[140px] w-full">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 tracking-wider uppercase truncate">
              Anticipos
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-rose-50 text-[#F43F5E] flex-shrink-0">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-1 sm:my-2.5">
            <p className="text-base sm:text-2xl font-black text-slate-800 truncate">
              {formatCurrency(metrics.anticiposCobrados)}
            </p>
          </div>
          <p className="text-[9.5px] sm:text-xs text-slate-400 truncate">
            Cobrado en reservas
          </p>
        </div>

        {/* Card 2: Deudas en Calle */}
        <div className="bg-white border border-rose-200/70 shadow-md hover:shadow-lg rounded-2xl p-3 sm:p-5 transition-shadow duration-200 flex flex-col justify-between min-h-[110px] sm:min-h-[140px] w-full">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 tracking-wider uppercase truncate">
              Deuda Calle
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-rose-50 text-[#F43F5E] flex-shrink-0">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-1 sm:my-2.5">
            <p className="text-base sm:text-2xl font-black text-slate-800 truncate">
              {formatCurrency(metrics.deudaEnCalle)}
            </p>
          </div>
          <p className="text-[9.5px] sm:text-xs text-slate-400 truncate">
            Listas: {formatCurrency(metrics.porCobrarListas)}
          </p>
        </div>

        {/* Card 3: Inversión en Mercadería / Pedidos */}
        <div className="bg-white border border-rose-200/70 shadow-md hover:shadow-lg rounded-2xl p-3 sm:p-5 transition-shadow duration-200 flex flex-col justify-between min-h-[110px] sm:min-h-[140px] w-full">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 tracking-wider uppercase truncate">
              Inversión Lotes
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-rose-50 text-[#F43F5E] flex-shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-1 sm:my-2.5">
            <p className="text-base sm:text-2xl font-black text-slate-800 truncate">
              {formatCurrency(metrics.comprasTotales)}
            </p>
          </div>
          <p className="text-[9.5px] sm:text-xs text-slate-400 truncate">
            {compras.length} lotes de ropa
          </p>
        </div>

        {/* Card 4: Ganancia Neta / Balance */}
        <div className="bg-white border border-rose-200/70 shadow-md hover:shadow-lg rounded-2xl p-3 sm:p-5 transition-shadow duration-200 flex flex-col justify-between min-h-[110px] sm:min-h-[140px] w-full">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 tracking-wider uppercase truncate">
              Balance Neto
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-rose-50 text-[#F43F5E] flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-1 sm:my-2.5">
            <p className={`text-base sm:text-2xl font-black truncate ${metrics.gananciaNeta >= 0 ? 'text-[#4E9F76]' : 'text-rose-500'}`}>
              {formatCurrency(metrics.gananciaNeta)}
            </p>
          </div>
          <p className="text-[9.5px] sm:text-xs text-slate-400 truncate">
            Ventas - Compras
          </p>
        </div>
      </div>

      {/* Gráfico Mensual Compacto & Sin Desborde */}
      <div className="w-full max-w-full overflow-hidden bg-white rounded-2xl p-3.5 sm:p-6 border border-rose-200/70 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 sm:pb-5 border-b border-[#FCE7F3]">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 flex-shrink-0" />
              <h3 className="text-xs sm:text-base font-black text-slate-800 leading-tight">
                Flujo Mensual de Pedidos y Anticipos (Bs)
              </h3>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
              Comparativa de volumen vendido y anticipos recibidos (últimos 6 meses)
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs sm:rounded-sm bg-gradient-to-t from-rose-500 to-rose-400 shadow-xs" />
              <span className="text-slate-600 font-semibold">Total Pedidos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs sm:rounded-sm bg-gradient-to-t from-rose-300 to-pink-200 border border-rose-200 shadow-xs" />
              <span className="text-slate-600 font-semibold">Anticipos</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart with Guidelines & Y-Axis */}
        <div className="mt-4 sm:mt-6 w-full max-w-full overflow-x-hidden">
          <div className="relative h-64 sm:h-72 min-h-[260px] sm:min-h-[280px] flex flex-col">
            {/* Plotting Area with Guidelines + Y Axis + Bars */}
            <div className="relative flex-1 w-full">
              {/* Horizontal Reference Lines & Y-Axis Ticks */}
              {metrics.yTicks.map((tick, idx) => {
                const topPercent = (idx / (metrics.yTicks.length - 1)) * 100;
                return (
                  <div
                    key={idx}
                    className="absolute inset-x-0 flex items-center pointer-events-none"
                    style={{ top: `${topPercent}%` }}
                  >
                    <span className="w-11 sm:w-16 flex-shrink-0 text-right pr-2 sm:pr-3 text-[9px] sm:text-xs font-semibold text-slate-400 select-none tabular-nums truncate -translate-y-1/2">
                      {formatTick(tick)}
                    </span>
                    <div
                      className={`flex-1 border-b ${
                        idx === metrics.yTicks.length - 1 ? 'border-rose-200/90' : 'border-slate-100'
                      }`}
                    />
                  </div>
                );
              })}

              {/* Bars Columns Area */}
              <div className="ml-11 sm:ml-16 h-full flex items-end justify-between gap-1.5 sm:gap-4 relative z-10 px-1 sm:px-2">
                {metrics.chartData.map((item, idx) => {
                  const maxBarPercent = 82;
                  const ventasHeight =
                    item.ventas > 0
                      ? Math.max(Math.round((item.ventas / metrics.maxVal) * maxBarPercent), 6)
                      : 2;
                  const anticiposHeight =
                    item.anticipos > 0
                      ? Math.max(Math.round((item.anticipos / metrics.maxVal) * maxBarPercent), 4)
                      : 2;

                  return (
                    <div
                      key={idx}
                      className="flex-1 h-full flex flex-col items-center justify-end group/col relative min-w-0"
                    >
                      {/* Floating Tooltip on Hover / Focus */}
                      <div className="opacity-0 group-hover/col:opacity-100 transition-opacity duration-200 pointer-events-none text-center absolute -top-3 transform -translate-y-full z-30 bg-slate-900/95 text-white px-2.5 py-1.5 rounded-xl shadow-xl text-xs backdrop-blur-xs whitespace-nowrap hidden sm:block">
                        <p className="font-bold text-rose-300">{item.label}</p>
                        <p className="text-[11px] text-slate-200 mt-0.5">
                          Total Pedidos: <span className="font-semibold text-white">{formatCurrency(item.ventas)}</span>
                        </p>
                        <p className="text-[11px] text-rose-200">
                          Anticipos: <span className="font-semibold text-white">{formatCurrency(item.anticipos)}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {item.count} {item.count === 1 ? 'pedido' : 'pedidos'}
                        </p>
                      </div>

                      {/* Bars Side by Side with Numbers Above */}
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full max-w-[40px] sm:max-w-[56px] pb-0.5">
                        {/* Pedidos Bar (Total) */}
                        <div className="w-1/2 h-full flex flex-col justify-end items-center relative">
                          {item.ventas > 0 && (
                            <span className="text-[8px] sm:text-[10px] font-bold text-rose-600 mb-1 select-none leading-none truncate max-w-full text-center">
                              <span className="hidden sm:inline">Bs </span>{formatBarAmount(item.ventas)}
                            </span>
                          )}
                          <div
                            style={{ height: `${ventasHeight}%` }}
                            className="w-full bg-gradient-to-t from-rose-500 to-rose-400 hover:from-rose-600 hover:to-rose-500 rounded-t-lg shadow-xs transition-all duration-300 cursor-pointer"
                            title={`${item.label} - Total Pedidos: ${formatCurrency(item.ventas)}`}
                          />
                        </div>

                        {/* Anticipos Bar (Recaudado) */}
                        <div className="w-1/2 h-full flex flex-col justify-end items-center relative">
                          {item.anticipos > 0 && (
                            <span className="text-[8px] sm:text-[10px] font-bold text-pink-600 mb-1 select-none leading-none truncate max-w-full text-center">
                              <span className="hidden sm:inline">Bs </span>{formatBarAmount(item.anticipos)}
                            </span>
                          )}
                          <div
                            style={{ height: `${anticiposHeight}%` }}
                            className="w-full bg-gradient-to-t from-rose-300 to-pink-200 hover:from-rose-400 hover:to-pink-300 border border-rose-200/90 rounded-t-lg shadow-xs transition-all duration-300 cursor-pointer"
                            title={`${item.label} - Anticipos Recaudados: ${formatCurrency(item.anticipos)}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-Axis Month & Orders Row (2 Distinct Lines) */}
            <div className="ml-11 sm:ml-16 flex items-start justify-between gap-1.5 sm:gap-4 px-1 sm:px-2 pt-2 h-14 sm:h-16 flex-shrink-0">
              {metrics.chartData.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center justify-start text-center min-w-0">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-700 tracking-tight truncate w-full">
                    {item.label}
                  </span>
                  <span className="text-[9px] sm:text-[11px] font-medium text-slate-400 mt-0.5 truncate w-full">
                    {item.count} {item.count === 1 ? 'pedido' : 'pedidos'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
