'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Pedido, PedidoEstado, AbonoPedido } from '@/types/database';
import {
  formatCurrency,
  formatDate,
  formatDateOnly,
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
  PlusCircle,
  FileText,
  DollarSign,
  Calendar,
  Tag,
  Wallet,
  ArrowRight,
  User,
} from 'lucide-react';

interface PedidosTableProps {
  pedidos: Pedido[];
  onUpdateEstado: (pedidoId: string, nuevoEstado: PedidoEstado) => Promise<void>;
  onLiquidar: (pedidoId: string) => Promise<void>;
  onNuevoPedidoClick?: () => void;
  onRegistrarAbono?: (
    pedidoId: string,
    abonoData: { monto: number; metodo: string; fecha_pago: string; nota?: string }
  ) => Promise<void>;
}

export function PedidosTable({
  pedidos,
  onUpdateEstado,
  onLiquidar,
  onNuevoPedidoClick,
  onRegistrarAbono,
}: PedidosTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [liquidatingId, setLiquidatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [selectedPedidoForFicha, setSelectedPedidoForFicha] = useState<Pedido | null>(null);
  const [selectedPedidoForAbono, setSelectedPedidoForAbono] = useState<Pedido | null>(null);

  // Abono Form State
  const [abonoMonto, setAbonoMonto] = useState('');
  const [abonoMetodo, setAbonoMetodo] = useState('Efectivo');
  const [abonoFecha, setAbonoFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [abonoNota, setAbonoNota] = useState('');
  const [savingAbono, setSavingAbono] = useState(false);

  // Keep selectedPedidoForFicha synced with latest pedidos state
  const activeFichaPedido = useMemo(() => {
    if (!selectedPedidoForFicha) return null;
    return pedidos.find((p) => p.id === selectedPedidoForFicha.id) || selectedPedidoForFicha;
  }, [pedidos, selectedPedidoForFicha]);

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
      if (selectedPedidoForFicha?.id === pedido.id) {
        setSelectedPedidoForFicha(null);
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Error al liquidar el pedido.',
      });
    } finally {
      setLiquidatingId(null);
    }
  };

  // Open Abono Modal for a specific order
  const handleOpenAbonoModal = (pedido: Pedido) => {
    setSelectedPedidoForAbono(pedido);
    setAbonoMonto('');
    setAbonoMetodo('Efectivo');
    setAbonoFecha(new Date().toISOString().split('T')[0]);
    setAbonoNota('');
  };

  // Submit New Abono
  const handleGuardarAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPedidoForAbono) return;

    const montoNum = parseFloat(abonoMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      alert('Ingresa un monto de abono válido mayor a 0 Bs.');
      return;
    }

    setSavingAbono(true);
    try {
      if (onRegistrarAbono) {
        await onRegistrarAbono(selectedPedidoForAbono.id, {
          monto: montoNum,
          metodo: abonoMetodo,
          fecha_pago: new Date(abonoFecha).toISOString(),
          nota: abonoNota.trim() || undefined,
        });
      }

      const nuevoSaldo = Math.max(Number(selectedPedidoForAbono.saldo_pendiente) - montoNum, 0);

      setActionMessage({
        type: 'success',
        text:
          nuevoSaldo === 0
            ? `¡Abono registrado! El pedido de ${selectedPedidoForAbono.cliente_nombre} ha quedado 100% pagado y se marcó como Liquidado.`
            : `Abono de ${formatCurrency(montoNum)} registrado para ${selectedPedidoForAbono.cliente_nombre}. Saldo restante: ${formatCurrency(nuevoSaldo)}.`,
      });
      setTimeout(() => setActionMessage(null), 5000);

      setSelectedPedidoForAbono(null);
    } catch (err: any) {
      console.error('Error al registrar abono:', err);
      alert(err?.message || 'Error al registrar el abono.');
    } finally {
      setSavingAbono(false);
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
            Gestión simplificada de clientas, historial de abonos parciales y cobro contra entrega.
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
        {/* Search bar & Status Filter Tabs */}
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

        {/* 1. DESKTOP TABLE VIEW: EXACT 7 COLUMNS */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-rose-50/40 border-b border-rose-100 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Clienta</th>
                <th className="py-3 px-3">Prenda</th>
                <th className="py-3 px-3 text-right">Precio Total</th>
                <th className="py-3 px-3 text-right">Total Pagado</th>
                <th className="py-3 px-3 text-right">Saldo Deuda</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100/60 bg-white">
              {filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 text-rose-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No se encontraron pedidos con estos filtros.</p>
                  </td>
                </tr>
              ) : (
                filteredPedidos.map((pedido) => {
                  const saldoNum = Number(pedido.saldo_pendiente) || 0;
                  const debe = saldoNum > 0;

                  return (
                    <tr key={pedido.id} className="hover:bg-rose-50/20 transition-colors group">
                      {/* 1. Clienta (Avatar + Nombre, clic abre ficha) */}
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedPedidoForFicha(pedido)}
                          className="flex items-center gap-2.5 text-left group/name hover:opacity-85 transition-opacity"
                        >
                          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs flex-shrink-0 group-hover/name:bg-rose-200 transition-colors">
                            {pedido.cliente_nombre ? pedido.cliente_nombre[0].toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover/name:text-rose-600 transition-colors underline-offset-2 group-hover/name:underline">
                              {pedido.cliente_nombre}
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Ver detalles y ficha
                            </span>
                          </div>
                        </button>
                      </td>

                      {/* 2. Prenda (Miniatura + Nombre) */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-10 rounded-lg overflow-hidden bg-rose-50 flex-shrink-0 relative border border-rose-100">
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

                      {/* 3. Precio Total */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(pedido.precio_total)}
                      </td>

                      {/* 4. Total Pagado (Abonos acumulados) */}
                      <td className="py-3 px-3 text-right font-bold text-rose-700 whitespace-nowrap">
                        {formatCurrency(pedido.anticipo_pagado)}
                      </td>

                      {/* 5. Saldo Deuda (Etiqueta amarilla si debe, verde si 0) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            debe
                              ? 'text-amber-800 bg-amber-50 border-amber-200'
                              : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          {debe ? formatCurrency(saldoNum) : '0.00 Bs'}
                        </span>
                      </td>

                      {/* 6. Estado (Píldora con selector) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={pedido.estado}
                          onChange={(e) => onUpdateEstado(pedido.id, e.target.value as PedidoEstado)}
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 border transition-colors outline-none cursor-pointer whitespace-nowrap shadow-2xs ${
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

                      {/* 7. Acciones: Botón "+ Abono" y "Ver Ficha" */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenAbonoModal(pedido)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 shadow-2xs transition-all active:scale-95"
                            title="Registrar nuevo abono parcial para este pedido"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span>+ Abono</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPedidoForFicha(pedido)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition-all active:scale-95"
                            title="Ver ficha completa de la clienta, SKU y WhatsApp"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>Ver Ficha</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 2. MOBILE CARD VIEW: COMPACTA Y DIRECTA */}
        <div className="lg:hidden divide-y divide-rose-100">
          {filteredPedidos.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No se encontraron pedidos con estos filtros.
            </div>
          ) : (
            filteredPedidos.map((pedido) => {
              const saldoNum = Number(pedido.saldo_pendiente) || 0;
              const debe = saldoNum > 0;

              return (
                <div key={pedido.id} className="p-4 space-y-3">
                  {/* Fila 1: Clienta & Estado */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPedidoForFicha(pedido)}
                      className="flex items-center gap-2.5 text-left min-w-0"
                    >
                      <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs flex-shrink-0">
                        {pedido.cliente_nombre ? pedido.cliente_nombre[0].toUpperCase() : 'C'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {pedido.cliente_nombre}
                        </h4>
                        <span className="text-[10px] text-rose-600 block">
                          Tocar para ver ficha completa
                        </span>
                      </div>
                    </button>

                    <select
                      value={pedido.estado}
                      onChange={(e) => onUpdateEstado(pedido.id, e.target.value as PedidoEstado)}
                      className={`text-xs font-semibold rounded-full px-2 py-0.5 border transition-colors outline-none cursor-pointer whitespace-nowrap shadow-2xs flex-shrink-0 ${
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

                  {/* Fila 2: Prenda */}
                  <div className="flex items-center gap-2.5 bg-rose-50/30 p-2 rounded-xl border border-rose-100">
                    <div className="w-9 h-11 rounded-lg overflow-hidden bg-rose-100 flex-shrink-0 relative border border-rose-200">
                      {pedido.prenda?.url_foto ? (
                        <Image
                          src={pedido.prenda.url_foto}
                          alt={pedido.prenda.nombre}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-rose-300 bg-rose-50">
                          <ImageOff className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {pedido.prenda?.nombre || 'Prenda no vinculada'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Talla: {pedido.prenda?.talla || '-'} • Ref: {pedido.prenda?.codigo_shein || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Fila 3: Montos Financieros (Total, Pagado, Saldo) */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-rose-50/20 p-2.5 rounded-xl border border-rose-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Total</span>
                      <span className="font-bold text-slate-900">{formatCurrency(pedido.precio_total)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-600 block font-medium">Pagado</span>
                      <span className="font-bold text-rose-700">{formatCurrency(pedido.anticipo_pagado)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Saldo Deuda</span>
                      <span
                        className={`font-bold inline-block px-1.5 py-0.2 rounded-full text-xs ${
                          debe ? 'text-amber-800 bg-amber-50' : 'text-emerald-800 bg-emerald-50'
                        }`}
                      >
                        {formatCurrency(pedido.saldo_pendiente)}
                      </span>
                    </div>
                  </div>

                  {/* Fila 4: Botones Acciones ("+ Abono" y "Ver Ficha") */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleOpenAbonoModal(pedido)}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 shadow-2xs active:scale-95 transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>+ Abono</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPedidoForFicha(pedido)}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs active:scale-95 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ver Ficha</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: FICHA DE LA CLIENTA Y DETALLE DEL PEDIDO */}
      {/* ========================================================= */}
      {activeFichaPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden my-6">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#FCE7F3] bg-[#FFF1F2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-[#FCE7F3] text-rose-600 flex items-center justify-center font-black text-sm shadow-xs">
                  {activeFichaPedido.cliente_nombre ? activeFichaPedido.cliente_nombre[0].toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">
                    Ficha de {activeFichaPedido.cliente_nombre}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registrado el {formatDate(activeFichaPedido.fecha_pedido)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPedidoForFicha(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido de la Ficha */}
            <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Sección 1: Clienta & WhatsApp + Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Contacto WhatsApp */}
                <div className="p-3.5 rounded-2xl bg-rose-50/20 border border-rose-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Contacto Directo
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-800">
                      {activeFichaPedido.cliente_telefono || 'Sin teléfono'}
                    </p>
                  </div>
                  {activeFichaPedido.cliente_telefono && (
                    <a
                      href={`https://wa.me/${activeFichaPedido.cliente_telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `¡Hola ${activeFichaPedido.cliente_nombre}! Te contactamos de SO Shopping Online sobre tu encargo (${activeFichaPedido.prenda?.nombre || 'Prenda'}, Ref: ${activeFichaPedido.prenda?.codigo_shein || 'N/A'}). Total: ${formatCurrency(activeFichaPedido.precio_total)}, Total pagado: ${formatCurrency(activeFichaPedido.anticipo_pagado)}, Saldo pendiente: ${formatCurrency(activeFichaPedido.saldo_pendiente)}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#D1FAE5] hover:bg-[#A7F3D0] text-[#065F46] text-xs font-bold border border-[#A7F3D0] transition-colors shadow-2xs"
                    >
                      <MessageCircle className="w-4 h-4 fill-[#065F46]" />
                      <span>Abrir Chat de WhatsApp</span>
                    </a>
                  )}
                </div>

                {/* Estado del Pedido */}
                <div className="p-3.5 rounded-2xl bg-rose-50/20 border border-rose-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Estado Actual
                    </span>
                    <p className="text-xs text-slate-600 mb-2">
                      Cambia el estado de entrega o preparación:
                    </p>
                  </div>
                  <select
                    value={activeFichaPedido.estado}
                    onChange={(e) => onUpdateEstado(activeFichaPedido.id, e.target.value as PedidoEstado)}
                    className={`w-full text-xs font-bold rounded-xl px-3 py-2 border transition-colors outline-none cursor-pointer shadow-xs ${
                      ESTADOS_PEDIDO_CONFIG[activeFichaPedido.estado]?.badgeClass || 'bg-white text-slate-800'
                    }`}
                  >
                    {allEstadosList.map((st) => (
                      <option key={st} value={st} className="bg-white text-slate-900 font-normal">
                        {ESTADOS_PEDIDO_CONFIG[st].label} - {ESTADOS_PEDIDO_CONFIG[st].description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sección 2: Datos de la Prenda Encargada */}
              <div className="p-4 rounded-2xl bg-white border border-rose-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Prenda Encargada
                </span>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Foto ampliada */}
                  <div className="w-32 h-40 sm:w-28 sm:h-36 rounded-2xl overflow-hidden bg-rose-50 flex-shrink-0 relative border border-rose-200 shadow-sm">
                    {activeFichaPedido.prenda?.url_foto ? (
                      <Image
                        src={activeFichaPedido.prenda.url_foto}
                        alt={activeFichaPedido.prenda.nombre}
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-rose-300 p-2 text-center">
                        <ImageOff className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">Sin foto</span>
                      </div>
                    )}
                  </div>

                  {/* Detalles Prenda */}
                  <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                    <h4 className="text-sm font-bold text-slate-900">
                      {activeFichaPedido.prenda?.nombre || 'Prenda no vinculada'}
                    </h4>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Talla: {activeFichaPedido.prenda?.talla || 'Única'}
                      </span>

                      {activeFichaPedido.prenda?.codigo_shein && (
                        <button
                          type="button"
                          onClick={() => copyCode(activeFichaPedido.prenda!.codigo_shein, activeFichaPedido.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 transition-colors"
                          title="Copiar código al portapapeles"
                        >
                          <Tag className="w-3 h-3 text-rose-400" />
                          <span>Ref: {activeFichaPedido.prenda.codigo_shein}</span>
                          {copiedCodeId === activeFichaPedido.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      )}
                    </div>

                    {activeFichaPedido.notas && (
                      <div className="pt-2 text-left">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                          Notas / Observaciones del pedido:
                        </span>
                        <p className="text-xs text-slate-700 bg-rose-50/30 p-2.5 rounded-xl border border-rose-100 mt-1">
                          {activeFichaPedido.notas}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección 3: Historial Cronológico de Abonos & Cobranza */}
              <div className="p-4 rounded-2xl bg-white border border-rose-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Historial de Abonos y Pagos
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenAbonoModal(activeFichaPedido)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-xs shadow-rose-200 transition-all active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Registrar Abono</span>
                  </button>
                </div>

                {/* Resumen Financiero de la Ficha */}
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-rose-50/20 border border-rose-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Precio Total</span>
                    <span className="text-sm sm:text-base font-black text-slate-900">
                      {formatCurrency(activeFichaPedido.precio_total)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-600 font-semibold uppercase block">Total Pagado</span>
                    <span className="text-sm sm:text-base font-black text-rose-700">
                      {formatCurrency(activeFichaPedido.anticipo_pagado)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">Saldo Restante</span>
                    <span
                      className={`text-sm sm:text-base font-black ${
                        Number(activeFichaPedido.saldo_pendiente) > 0 ? 'text-amber-800' : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrency(activeFichaPedido.saldo_pendiente)}
                    </span>
                  </div>
                </div>

                {/* Lista de Abonos Cronológicos */}
                <div className="space-y-2">
                  {(!activeFichaPedido.abonos || activeFichaPedido.abonos.length === 0) &&
                  Number(activeFichaPedido.anticipo_pagado) <= 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      <Wallet className="w-6 h-6 mx-auto mb-1.5 text-rose-200" />
                      No se han registrado abonos todavía para este pedido.
                    </div>
                  ) : (
                    <div className="divide-y divide-rose-100/70 border border-rose-100 rounded-2xl overflow-hidden bg-rose-50/10">
                      {/* Si no hay lista explícita pero tiene anticipo_pagado registrado */}
                      {(!activeFichaPedido.abonos || activeFichaPedido.abonos.length === 0) &&
                        Number(activeFichaPedido.anticipo_pagado) > 0 && (
                          <div className="p-3 flex items-center justify-between text-xs hover:bg-rose-50/30 transition-colors">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-[10px]">
                                1
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">
                                  {formatDateOnly(activeFichaPedido.fecha_pedido)}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  Anticipo inicial registrado
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-rose-700 text-sm">
                                {formatCurrency(activeFichaPedido.anticipo_pagado)}
                              </span>
                            </div>
                          </div>
                        )}

                      {/* Lista de abonos reales */}
                      {activeFichaPedido.abonos &&
                        activeFichaPedido.abonos.map((abono, idx) => (
                          <div
                            key={abono.id || idx}
                            className="p-3 flex items-center justify-between text-xs hover:bg-rose-50/30 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">
                                  {formatDate(abono.fecha_pago)}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-white border border-rose-200 text-slate-600 font-semibold">
                                    {abono.metodo || 'Efectivo'}
                                  </span>
                                  {abono.nota && (
                                    <span className="text-[10px] text-slate-500">
                                      • {abono.nota}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-emerald-700 text-sm">
                                + {formatCurrency(abono.monto)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Resumen al pie del historial */}
                  <div className="pt-2 flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                    <span>
                      Total pagado: <strong className="text-slate-800">{formatCurrency(activeFichaPedido.anticipo_pagado)}</strong>
                    </span>
                    <span>
                      Saldo restante:{' '}
                      <strong className={Number(activeFichaPedido.saldo_pendiente) > 0 ? 'text-amber-800' : 'text-emerald-700'}>
                        {formatCurrency(activeFichaPedido.saldo_pendiente)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Botón Cobrar & Liquidar si no está liquidado */}
                {activeFichaPedido.estado !== 'LIQUIDADO' && (
                  <div className="pt-2 border-t border-rose-100">
                    <button
                      type="button"
                      onClick={() => handleLiquidarClick(activeFichaPedido)}
                      disabled={liquidatingId === activeFichaPedido.id}
                      className="w-full py-2.5 rounded-2xl bg-[#4E9F76] hover:bg-[#3D8361] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                    >
                      {liquidatingId === activeFichaPedido.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span>Cobrar Saldo Total y Liquidar Pedido</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer de Ficha */}
            <div className="p-4 sm:p-5 border-t border-[#FCE7F3] bg-[#FFF1F2] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedPedidoForFicha(null)}
                className="px-5 py-2 rounded-2xl bg-white border border-[#FCE7F3] text-slate-700 text-xs font-bold hover:bg-rose-50 transition-colors"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: REGISTRAR NUEVO ABONO */}
      {/* ========================================================= */}
      {selectedPedidoForAbono && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden my-6">
            {/* Header del Modal Abono */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#FCE7F3] bg-[#FFF1F2]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Registrar Abono</h3>
                  <p className="text-xs text-slate-500">Clienta: {selectedPedidoForAbono.cliente_nombre}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPedidoForAbono(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario Rápido de Abono */}
            <form onSubmit={handleGuardarAbono} className="p-4 sm:p-6 space-y-4">
              {/* Tarjeta de Saldo Pendiente Actual */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider block">
                    Saldo Pendiente Actual
                  </span>
                  <p className="text-lg font-black text-amber-900">
                    {formatCurrency(selectedPedidoForAbono.saldo_pendiente)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAbonoMonto(Number(selectedPedidoForAbono.saldo_pendiente).toFixed(2))}
                  className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold transition-colors"
                >
                  Pagar Saldo Completo
                </button>
              </div>

              {/* Monto del Abono */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monto del Abono (Bs) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-rose-500 font-bold text-sm">Bs</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={Number(selectedPedidoForAbono.saldo_pendiente) > 0 ? Number(selectedPedidoForAbono.saldo_pendiente) : undefined}
                    placeholder="0.00"
                    value={abonoMonto}
                    onChange={(e) => setAbonoMonto(e.target.value)}
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-rose-200 text-base font-black text-slate-900 focus:border-rose-400 outline-none bg-rose-50/10"
                  />
                </div>
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Método de Pago *
                </label>
                <select
                  value={abonoMetodo}
                  onChange={(e) => setAbonoMetodo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-rose-200 text-xs sm:text-sm font-semibold text-slate-800 focus:border-rose-400 outline-none bg-rose-50/10"
                >
                  <option value="Efectivo">💵 Efectivo en mano</option>
                  <option value="QR / Transferencia">📱 QR / Transferencia Bancaria</option>
                  <option value="Tigo Money">📲 Tigo Money</option>
                  <option value="Otro">💳 Otro método</option>
                </select>
              </div>

              {/* Fecha del Abono */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha del Pago *
                </label>
                <input
                  type="date"
                  value={abonoFecha}
                  onChange={(e) => setAbonoFecha(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-rose-200 text-xs sm:text-sm font-semibold text-slate-800 focus:border-rose-400 outline-none bg-rose-50/10"
                />
              </div>

              {/* Nota / Concepto */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Concepto / Nota (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Seña inicial, Abono semana 1, Saldo final"
                  value={abonoNota}
                  onChange={(e) => setAbonoNota(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-rose-200 text-xs text-slate-800 focus:border-rose-400 outline-none bg-rose-50/10"
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#FCE7F3]">
                <button
                  type="button"
                  onClick={() => setSelectedPedidoForAbono(null)}
                  className="px-4 py-2 rounded-2xl border border-rose-100 text-slate-600 text-xs font-semibold hover:bg-rose-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingAbono}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-md shadow-rose-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {savingAbono ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-white" />
                      <span>Guardar Abono</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
