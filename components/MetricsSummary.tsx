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
        label: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
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
    const maxVal = Math.max(...chartData.map((m) => Math.max(m.ventas, m.anticipos)), 1000);

    return {
      anticiposCobrados,
      deudaEnCalle,
      porCobrarListas,
      pedidosListosCount: pedidosListos.length,
      comprasTotales,
      ventasTotales,
      gananciaNeta,
      chartData,
      maxVal,
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
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#F43F5E] flex-shrink-0" />
              <h3 className="text-xs sm:text-base font-black text-[#1F2937] leading-tight">
                Flujo Mensual de Pedidos y Anticipos (Bs)
              </h3>
            </div>
            <p className="text-[10px] sm:text-xs text-[#6B7280] mt-0.5">
              Comparativa de volumen vendido y anticipos recibidos (últimos 6 meses)
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-xs bg-[#1F2937]" />
              <span className="text-[#6B7280] font-medium">Pedidos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-xs bg-[#F43F5E]" />
              <span className="text-[#6B7280] font-medium">Anticipos</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="mt-3 sm:mt-6 w-full max-w-full overflow-x-hidden">
          <div className="h-36 sm:h-52 flex items-end justify-between gap-1.5 sm:gap-6 pt-3 sm:pt-6">
            {metrics.chartData.map((item, idx) => {
              const ventasHeight = Math.max(Math.round((item.ventas / metrics.maxVal) * 100), item.ventas > 0 ? 6 : 2);
              const anticiposHeight = Math.max(Math.round((item.anticipos / metrics.maxVal) * 100), item.anticipos > 0 ? 4 : 2);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group min-w-0">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 mb-1 pointer-events-none text-center hidden sm:block">
                    <span className="text-[10px] font-semibold bg-slate-900 text-white px-2 py-1 rounded-md shadow-md whitespace-nowrap block">
                      Ventas: {formatCurrency(item.ventas)}
                    </span>
                    <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-md shadow-xs whitespace-nowrap block mt-0.5">
                      Anticipos: {formatCurrency(item.anticipos)}
                    </span>
                  </div>

                  {/* Bars side by side */}
                  <div className="w-full flex items-end justify-center gap-0.5 sm:gap-2 h-full max-w-[36px] sm:max-w-[50px]">
                    <div
                      style={{ height: `${ventasHeight}%` }}
                      className="w-1/2 bg-slate-800 rounded-t-sm sm:rounded-t-md hover:bg-slate-700 transition-all duration-300 relative"
                      title={`Total: ${formatCurrency(item.ventas)}`}
                    />
                    <div
                      style={{ height: `${anticiposHeight}%` }}
                      className="w-1/2 bg-rose-500 rounded-t-sm sm:rounded-t-md hover:bg-rose-600 transition-all duration-300 relative"
                      title={`Anticipos: ${formatCurrency(item.anticipos)}`}
                    />
                  </div>

                  {/* Month Label */}
                  <span className="text-[9px] sm:text-[11px] font-medium text-slate-500 mt-1.5 sm:mt-2 text-center truncate w-full">
                    {item.label}
                  </span>
                  <span className="text-[8.5px] sm:text-[10px] text-slate-400 font-mono">
                    {item.count} enc.
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
