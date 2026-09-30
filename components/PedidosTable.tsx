'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Pedido, PedidoEstado } from '@/types/database';
import {
  formatCurrency,
  formatDate,
  ESTADOS_PEDIDO_CONFIG,
  exportPedidosToCSV,
} from '@/lib/utils';
import {
  Search,
  Download,
  CheckCircle,
  Copy,
  Check,
  MessageCircle,
  Phone,
  AlertCircle,
  ImageOff,
  Sparkles,
  ShoppingBag,
  CreditCard,
  X,
} from 'lucide-react';

interface PedidosTableProps {
  pedidos: Pedido[];
  onUpdateEstado: (pedidoId: string, nuevoEstado: PedidoEstado) => Promise<void>;
  onLiquidar: (pedidoId: string) => Promise<void>;
  onNuevoPedidoClick?: () => void;
}

export function PedidosTable({
  pedidos,
  onUpdateEstado,
  onLiquidar,
  onNuevoPedidoClick,
}: PedidosTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [liquidatingId, setLiquidatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Filtered pedidos
  const filteredPedidos = useMemo(() => {
    return pedidos.filter((pedido) => {
      // Estado filter
      if (selectedEstado !== 'TODOS' && pedido.estado !== selectedEstado) {
        return false;
      }

      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      const cliente = pedido.cliente_nombre?.toLowerCase() || '';
      const telefono = pedido.cliente_telefono?.toLowerCase() || '';
      const prendaNombre = pedido.prenda?.nombre?.toLowerCase() || '';
      const codigoShein = pedido.prenda?.codigo_shein?.toLowerCase() || '';
      const notas = pedido.notas?.toLowerCase() || '';

      return (
        cliente.includes(term) ||
        telefono.includes(term) ||
        prendaNombre.includes(term) ||
        codigoShein.includes(term) ||
        notas.includes(term)
      );
    });
  }, [pedidos, selectedEstado, searchTerm]);

  // Counts by status
  const countsByEstado = useMemo(() => {
    const counts: Record<string, number> = { TODOS: pedidos.length };
    pedidos.forEach((p) => {
      counts[p.estado] = (counts[p.estado] || 0) + 1;
    });
    return counts;
  }, [pedidos]);

  // Debt totals
  const totalDeudaEnCalle = useMemo(() => {
    return pedidos
      .filter((p) => p.estado !== 'LIQUIDADO' && p.estado !== 'CANCELADO')
      .reduce((acc, p) => acc + (Number(p.saldo_pendiente) || 0), 0);
  }, [pedidos]);

  const totalAnticiposCobrados = useMemo(() => {
    return pedidos
      .filter((p) => p.estado !== 'CANCELADO')
      .reduce((acc, p) => acc + (Number(p.anticipo_pagado) || 0), 0);
  }, [pedidos]);

  const handleLiquidarClick = async (pedido: Pedido) => {
    const confirmText = `¿Confirmas liquidar el pedido de "${pedido.cliente_nombre}"?\n\nAcción contable y de almacenamiento:\n1. Se marcará como LIQUIDADO con saldo $0 Bs.\n2. La foto de la prenda se eliminará permanentemente de Supabase Storage para liberar tu espacio gratuito.\n3. El registro de la clienta, monto e historial quedarán guardados intactos.`;

    if (!window.confirm(confirmText)) return;

    setLiquidatingId(pedido.id);
    setActionMessage(null);
    try {
      await onLiquidar(pedido.id);
      setActionMessage({
        type: 'success',
        text: `Pedido de ${pedido.cliente_nombre} liquidado exitosamente. La foto fue purgada de Supabase Storage.`,
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Error al liquidar el pedido.',
      });
    } finally {
      setLiquidatingId(null);
    }
  };

  const allEstadosList: PedidoEstado[] = [
    'POR_CONFIRMAR',
    'APARTADO',
    'EN_TRANSITO',
    'LISTO_ENTREGA',
    'LIQUIDADO',
    'CANCELADO',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border transition-all ${
            actionMessage.type === 'success'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Quick Counters */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-200/70 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#F43F5E] flex items-center justify-center font-bold">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Pedidos por Encargo y Control de Deudas
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Control de clientas, anticipos cobrados, saldos pendientes y purga automática al liquidar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportPedidosToCSV(filteredPedidos, 'encargos_so_shopping_online.csv')}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200/70 bg-white hover:bg-rose-50 hover:text-[#F43F5E] text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-95"
            title="Descargar lista de pedidos en formato CSV compatible con Microsoft Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#F43F5E]" />
            <span>Exportar CSV</span>
          </button>

          {onNuevoPedidoClick && (
            <button
              onClick={onNuevoPedidoClick}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-xs shadow-rose-200 transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Nuevo Encargo</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Mini Badges for Orders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-rose-200/70 shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Anticipos Recibidos</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{formatCurrency(totalAnticiposCobrados)}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-rose-50 text-[#F43F5E] flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-rose-200/70 shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Deuda en Calle (Por Cobrar)</p>
            <p className="text-xl font-bold text-[#B45309] mt-0.5">{formatCurrency(totalDeudaEnCalle)}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-rose-200/70 shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Clientas</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{pedidos.length} pedidos</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-rose-50 text-[#F43F5E] flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-rose-200/70 shadow-md overflow-hidden">
        {/* Search bar & Status Filter Pills */}
        <div className="p-4 sm:p-5 border-b border-rose-100 space-y-3.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-rose-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar clienta, teléfono, prenda o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-rose-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-rose-400 focus:ring-1 focus:ring-rose-200 outline-none transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedEstado('TODOS')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedEstado === 'TODOS'
                  ? 'bg-[#F43F5E] text-white shadow-xs'
                  : 'bg-[#FFF1F2] text-[#F43F5E] hover:bg-[#FCE7F3]'
              }`}
            >
              Todos ({countsByEstado['TODOS'] || 0})
            </button>

            {allEstadosList.map((estado) => {
              const count = countsByEstado[estado] || 0;
              const isSelected = selectedEstado === estado;
              return (
                <button
                  key={estado}
                  type="button"
                  onClick={() => setSelectedEstado(estado)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#F43F5E] text-white shadow-xs'
                      : 'bg-[#FFF1F2] text-[#F43F5E] hover:bg-[#FCE7F3]'
                  }`}
                >
                  <span>{ESTADOS_PEDIDO_CONFIG[estado].label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#FCE7F3] text-[#F43F5E]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-rose-50/40 border-b border-rose-100 text-slate-600 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Clienta</th>
                <th className="py-2.5 px-3">WhatsApp</th>
                <th className="py-2.5 px-3">Prenda Encargada</th>
                <th className="py-2.5 px-3">Talla</th>
                <th className="py-2.5 px-3">Código / Modelo</th>
                <th className="py-2.5 px-3 text-right">Precio Total</th>
                <th className="py-2.5 px-3 text-right">Anticipo</th>
                <th className="py-2.5 px-3 text-right">Saldo Deuda</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100/60 bg-white">
              {filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 text-rose-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No se encontraron pedidos con estos filtros.</p>
                  </td>
                </tr>
              ) : (
                filteredPedidos.map((pedido) => {
                  const cleanPhone = (pedido.cliente_telefono || '').replace(/[^0-9]/g, '');
                  const isLiquidating = liquidatingId === pedido.id;
                  const isLiquidado = pedido.estado === 'LIQUIDADO';

                  return (
                    <tr key={pedido.id} className="hover:bg-rose-50/20 transition-colors group">
                      {/* Clienta */}
                      <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {pedido.cliente_nombre ? pedido.cliente_nombre[0].toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{pedido.cliente_nombre}</div>
                            {pedido.notas && (
                              <span className="text-[10px] text-slate-400 font-normal line-clamp-1 max-w-[140px]" title={pedido.notas}>
                                {pedido.notas}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Celular + WhatsApp */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                              `¡Hola ${pedido.cliente_nombre}! Te contactamos de SO Shopping Online sobre tu encargo (${pedido.prenda?.nombre || ''}). Saldo restante por pagar: ${formatCurrency(pedido.saldo_pendiente)}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-[#065F46] bg-[#D1FAE5]/80 hover:bg-[#A7F3D0] border border-[#A7F3D0]/70 transition-colors"
                            title="Abrir chat de WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-[#065F46]" />
                            <span className="font-mono">{cleanPhone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">{pedido.cliente_telefono || '-'}</span>
                        )}
                      </td>

                      {/* Prenda + thumbnail */}
                      <td className="py-2.5 px-3 max-w-[180px]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-9 rounded-lg overflow-hidden bg-rose-50 flex-shrink-0 relative border border-rose-100">
                            {pedido.prenda?.url_foto ? (
                              <Image
                                src={pedido.prenda.url_foto}
                                alt={pedido.prenda.nombre}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-rose-300 bg-rose-50">
                                <ImageOff className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                          <span className="truncate font-semibold text-slate-800" title={pedido.prenda?.nombre}>
                            {pedido.prenda?.nombre || 'Prenda no vinculada'}
                          </span>
                        </div>
                      </td>

                      {/* Talla */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-100">
                          {pedido.prenda?.talla || '-'}
                        </span>
                      </td>

                      {/* Código / Modelo */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {pedido.prenda?.codigo_shein ? (
                          <button
                            type="button"
                            onClick={() => copyCode(pedido.prenda!.codigo_shein, pedido.id)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors"
                            title="Click para copiar código"
                          >
                            <span>{pedido.prenda.codigo_shein}</span>
                            {copiedCodeId === pedido.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Precio Total */}
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(pedido.precio_total)}
                      </td>

                      {/* Anticipo Pagado */}
                      <td className="py-2.5 px-3 text-right font-bold text-rose-700 whitespace-nowrap">
                        {formatCurrency(pedido.anticipo_pagado)}
                      </td>

                      {/* Saldo Pendiente */}
                      <td className="py-2.5 px-3 text-right font-bold whitespace-nowrap">
                        <span
                          className={
                            pedido.saldo_pendiente > 0
                              ? 'text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-semibold'
                              : 'text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold'
                          }
                        >
                          {formatCurrency(pedido.saldo_pendiente)}
                        </span>
                      </td>

                      {/* Fecha Pedido */}
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                        {formatDate(pedido.fecha_pedido)}
                      </td>

                      {/* Estado Dropdown */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <select
                          value={pedido.estado}
                          onChange={(e) => onUpdateEstado(pedido.id, e.target.value as PedidoEstado)}
                          className={`text-xs font-semibold rounded-full px-2.5 py-0.5 border transition-colors outline-none cursor-pointer whitespace-nowrap ${
                            ESTADOS_PEDIDO_CONFIG[pedido.estado]?.badgeClass || 'bg-slate-100'
                          }`}
                        >
                          {allEstadosList.map((st) => (
                            <option key={st} value={st} className="bg-white text-slate-900 font-normal">
                              {ESTADOS_PEDIDO_CONFIG[st].label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Acciones */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        {!isLiquidado ? (
                          <button
                            type="button"
                            onClick={() => handleLiquidarClick(pedido)}
                            disabled={isLiquidating}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#4E9F76] hover:bg-[#3D8361] text-white font-semibold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-95 disabled:opacity-50"
                            title="Cobrar y marcar como liquidado (purgará foto de almacenamiento)"
                          >
                            {isLiquidating ? (
                              <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5 text-white" />
                            )}
                            <span>Cobrar & Liquidar</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-[#F3E8FF] border border-[#E9D5FF] px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3 text-purple-600" />
                            Liquidado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE / TABLET CARD VIEW */}
        <div className="lg:hidden divide-y divide-rose-100">
          {filteredPedidos.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No se encontraron pedidos.
            </div>
          ) : (
            filteredPedidos.map((pedido) => {
              const cleanPhone = (pedido.cliente_telefono || '').replace(/[^0-9]/g, '');
              const isLiquidating = liquidatingId === pedido.id;
              const isLiquidado = pedido.estado === 'LIQUIDADO';

              return (
                <div key={pedido.id} className="p-4 space-y-3">
                  {/* Header: Clienta, Estado y WhatsApp */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {pedido.cliente_nombre ? pedido.cliente_nombre[0].toUpperCase() : 'C'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">
                          {pedido.cliente_nombre}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {cleanPhone ? (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                `¡Hola ${pedido.cliente_nombre}! Te contactamos de SO Shopping Online sobre tu encargo (#${pedido.prenda?.codigo_shein || ''}). Saldo pendiente: ${formatCurrency(pedido.saldo_pendiente)}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-[#065F46] font-medium bg-[#D1FAE5]/80 px-2.5 py-0.5 rounded-full border border-[#A7F3D0]/70 hover:bg-[#A7F3D0] transition-colors"
                            >
                              <MessageCircle className="w-3 h-3 fill-[#065F46]" />
                              <span className="font-mono">{cleanPhone}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono">
                              {pedido.cliente_telefono || '-'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <select
                      value={pedido.estado}
                      onChange={(e) => onUpdateEstado(pedido.id, e.target.value as PedidoEstado)}
                      className={`text-xs font-semibold rounded-full px-2.5 py-0.5 border transition-colors outline-none cursor-pointer whitespace-nowrap ${
                        ESTADOS_PEDIDO_CONFIG[pedido.estado]?.badgeClass || 'bg-slate-100'
                      }`}
                    >
                      {allEstadosList.map((st) => (
                        <option key={st} value={st} className="bg-white text-slate-900 font-normal">
                          {ESTADOS_PEDIDO_CONFIG[st].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Prenda & Code */}
                  <div className="flex items-center gap-3 bg-rose-50/40 p-2.5 rounded-2xl border border-rose-100">
                    <div className="w-12 h-14 rounded-xl overflow-hidden bg-rose-100 flex-shrink-0 relative border border-rose-200">
                      {pedido.prenda?.url_foto ? (
                        <Image
                          src={pedido.prenda.url_foto}
                          alt={pedido.prenda.nombre}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-rose-300 bg-rose-50">
                          <ImageOff className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {pedido.prenda?.nombre || 'Prenda no vinculada'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] bg-white border border-rose-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          Talla: {pedido.prenda?.talla || '-'}
                        </span>
                        {pedido.prenda?.codigo_shein && (
                          <button
                            type="button"
                            onClick={() => copyCode(pedido.prenda!.codigo_shein, pedido.id)}
                            className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600 bg-white border border-rose-100 px-1.5 py-0.5 rounded-md"
                          >
                            <span>{pedido.prenda.codigo_shein}</span>
                            {copiedCodeId === pedido.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-rose-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Details Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-rose-50/20 p-2.5 rounded-2xl border border-rose-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Total</span>
                      <span className="font-bold text-slate-900">{formatCurrency(pedido.precio_total)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-600 block font-medium">Anticipo</span>
                      <span className="font-bold text-rose-700">{formatCurrency(pedido.anticipo_pagado)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-600 block font-medium">Saldo Deuda</span>
                      <span className="font-bold text-amber-800">{formatCurrency(pedido.saldo_pendiente)}</span>
                    </div>
                  </div>

                  {/* Footer: Date & Liquidar Button */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      {formatDate(pedido.fecha_pedido)}
                    </span>

                    {!isLiquidado ? (
                      <button
                        type="button"
                        onClick={() => handleLiquidarClick(pedido)}
                        disabled={isLiquidating}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4E9F76] hover:bg-[#3D8361] text-white font-bold text-xs shadow-xs hover:shadow-md hover:shadow-emerald-950/15 transition-all duration-300 ease-out active:scale-95 disabled:opacity-50"
                      >
                        {isLiquidating ? (
                          <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        )}
                        <span>Cobrar & Liquidar</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-[#F3E8FF] border border-[#E9D5FF] px-3 py-1 rounded-lg">
                        <Check className="w-3.5 h-3.5 text-purple-600" />
                        Liquidado
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
