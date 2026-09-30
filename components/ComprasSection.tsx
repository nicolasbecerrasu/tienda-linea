'use client';

import React, { useState, useMemo } from 'react';
import { Compra } from '@/types/database';
import { formatCurrency, formatDateOnly } from '@/lib/utils';
import {
  ShoppingBag,
  PlusCircle,
  TrendingUp,
  Receipt,
  DollarSign,
  Trash2,
  Percent,
  CheckCircle,
} from 'lucide-react';

interface ComprasSectionProps {
  compras: Compra[];
  ventasTotales: number;
  onCrearCompra: (compra: Omit<Compra, 'id' | 'created_at'>) => Promise<void>;
  onEliminarCompra?: (id: string) => Promise<void>;
}

export function ComprasSection({
  compras,
  ventasTotales,
  onCrearCompra,
  onEliminarCompra,
}: ComprasSectionProps) {
  const [descripcion, setDescripcion] = useState('');
  const [costoTotal, setCostoTotal] = useState('');
  const [cantidadPrendas, setCantidadPrendas] = useState('1');
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Financial summary
  const comprasTotales = useMemo(() => {
    return compras.reduce((acc, c) => acc + (Number(c.costo_total) || 0), 0);
  }, [compras]);

  const totalPrendasCompradas = useMemo(() => {
    return compras.reduce((acc, c) => acc + (Number(c.cantidad_prendas) || 0), 0);
  }, [compras]);

  const gananciaNeta = ventasTotales - comprasTotales;
  const margenGanancia = ventasTotales > 0 ? ((gananciaNeta / ventasTotales) * 100).toFixed(1) : '0';
  const costoPromedioPrenda = totalPrendasCompradas > 0 ? comprasTotales / totalPrendasCompradas : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const costoNum = parseFloat(costoTotal);
    const cantNum = parseInt(cantidadPrendas, 10);

    if (!descripcion.trim()) {
      alert('Ingresa una descripción para el paquete o compra.');
      return;
    }
    if (isNaN(costoNum) || costoNum <= 0) {
      alert('Ingresa un costo válido mayor a 0 Bs.');
      return;
    }
    if (isNaN(cantNum) || cantNum <= 0) {
      alert('La cantidad de prendas debe ser al menos 1.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await onCrearCompra({
        descripcion: descripcion.trim(),
        costo_total: costoNum,
        cantidad_prendas: cantNum,
        fecha_compra: fechaCompra,
      });

      // Reset form
      setDescripcion('');
      setCostoTotal('');
      setCantidadPrendas('1');
      setMessage('¡Compra registrada exitosamente!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Error al guardar la compra.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Net Profit Overview Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full">
        {/* Ventas Totales */}
        <div className="bg-white rounded-2xl p-3 sm:p-5 border border-rose-200/70 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between min-h-[110px] sm:min-h-[140px] w-full">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Ventas Totales</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 text-[#F43F5E] flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-800 truncate">{formatCurrency(ventasTotales)}</p>
          <span className="text-[9.5px] sm:text-xs text-slate-400 mt-1 block truncate">Facturación activa</span>
        </div>

        {/* Inversión en Lotes */}
        <div className="bg-white rounded-2xl p-3 sm:p-5 border border-rose-200/70 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between min-h-[110px] sm:min-h-[140px] w-full">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Inversión Lotes</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 text-[#F43F5E] flex items-center justify-center flex-shrink-0">
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-800 truncate">{formatCurrency(comprasTotales)}</p>
          <span className="text-[9.5px] sm:text-xs text-slate-400 mt-1 block truncate">{totalPrendasCompradas} prendas en {compras.length} lotes</span>
        </div>

        {/* Ganancia Neta */}
        <div className="bg-white rounded-2xl p-3 sm:p-5 border border-rose-200/70 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between min-h-[110px] sm:min-h-[140px] w-full">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Ganancia Neta</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 text-[#F43F5E] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className={`text-base sm:text-2xl font-black truncate ${gananciaNeta >= 0 ? 'text-[#4E9F76]' : 'text-rose-500'}`}>
            {formatCurrency(gananciaNeta)}
          </p>
          <span className="text-[9.5px] sm:text-xs text-slate-400 mt-1 block truncate">Ventas - Compras</span>
        </div>

        {/* Margen & Promedio */}
        <div className="bg-white rounded-2xl p-3 sm:p-5 border border-rose-200/70 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between min-h-[110px] sm:min-h-[140px] w-full">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Costo Prom / Pza</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 text-[#F43F5E] flex items-center justify-center flex-shrink-0">
              <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-800 truncate">{formatCurrency(costoPromedioPrenda)}</p>
          <span className="text-[9.5px] sm:text-xs text-slate-400 mt-1 block truncate">Margen: {margenGanancia}%</span>
        </div>
      </div>

      {/* Main Content: Form + Purchases Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Registro de Compra */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-4 sm:p-5 border border-rose-200/70 shadow-md h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-[#F43F5E] flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Registrar Compra de Lote</h3>
              <p className="text-xs text-slate-500">Agrega un nuevo paquete o pedido de stock</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha de Compra
              </label>
              <input
                type="date"
                value={fechaCompra}
                onChange={(e) => setFechaCompra(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-rose-200 text-xs text-slate-800 focus:border-rose-400 outline-none bg-rose-50/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Descripción del Paquete / Lote
              </label>
              <input
                type="text"
                placeholder="Ej. Paquete #8821: 5 vestidos y 4 tops"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-rose-200 text-xs text-slate-800 placeholder:text-slate-400 focus:border-rose-400 outline-none bg-rose-50/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Costo Total (Bs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={costoTotal}
                  onChange={(e) => setCostoTotal(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-rose-200 text-xs font-bold text-slate-900 focus:border-rose-400 outline-none bg-rose-50/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cant. Prendas
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={cantidadPrendas}
                  onChange={(e) => setCantidadPrendas(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-rose-200 text-xs font-bold text-slate-900 focus:border-rose-400 outline-none bg-rose-50/20"
                />
              </div>
            </div>

            {message && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{message}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs transition-all shadow-md shadow-rose-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Guardar Compra (Bs)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Tabla de Historial de Compras */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-rose-200/70 shadow-md overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-rose-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Historial de Compras e Inversión</h3>
              <p className="text-xs text-slate-500">Registro de gastos en paquetes para stock o pedidos</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-[#F43F5E] border border-rose-100">
              {compras.length} {compras.length === 1 ? 'paquete' : 'paquetes'}
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-rose-50/40 border-b border-rose-100 text-slate-600 uppercase font-medium text-xs tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Fecha</th>
                  <th className="py-2.5 px-3">Descripción</th>
                  <th className="py-2.5 px-3 text-center">Prendas</th>
                  <th className="py-2.5 px-3 text-right">Costo Total</th>
                  <th className="py-2.5 px-3 text-right">Costo / Pza</th>
                  {onEliminarCompra && <th className="py-2.5 px-4 text-center">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/60 bg-white">
                {compras.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No hay compras de lotes registradas aún.
                    </td>
                  </tr>
                ) : (
                  compras.map((compra) => {
                    const unitCost =
                      compra.cantidad_prendas > 0 ? compra.costo_total / compra.cantidad_prendas : 0;

                    return (
                      <tr key={compra.id} className="hover:bg-rose-50/20 transition-colors">
                        <td className="py-2.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                          {formatDateOnly(compra.fecha_compra)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[220px]">
                          <span className="truncate block" title={compra.descripcion}>
                            {compra.descripcion}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-100">
                            {compra.cantidad_prendas}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(compra.costo_total)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500 font-mono whitespace-nowrap text-[11px]">
                          {formatCurrency(unitCost)}
                        </td>
                        {onEliminarCompra && (
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('¿Deseas eliminar este registro de compra?')) {
                                  onEliminarCompra(compra.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar compra"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
