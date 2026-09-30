'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Prenda, PrendaEstado } from '@/types/database';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingBag,
  Plus,
  Search,
  Tag,
  CheckCircle,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ImageOff,
  Sparkles,
  ExternalLink,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';

interface StockSectionProps {
  prendas: Prenda[];
  onUpdatePrenda: (prenda: Prenda) => Promise<void>;
  onEliminarPrenda?: (prendaId: string) => Promise<void>;
  onOpenUploadModal: () => void;
}

export function StockSection({
  prendas,
  onUpdatePrenda,
  onEliminarPrenda,
  onOpenUploadModal,
}: StockSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'TODOS' | 'DISPONIBLE' | 'AGOTADO'>('TODOS');
  const [editingPrenda, setEditingPrenda] = useState<Prenda | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter garments
  const filteredPrendas = useMemo(() => {
    return prendas.filter((p) => {
      // Estado filter
      if (filterEstado !== 'TODOS' && p.estado !== filterEstado) {
        return false;
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
  }, [prendas, filterEstado, searchTerm]);

  const stockCount = prendas.filter((p) => p.estado === 'DISPONIBLE').length;
  const agotadasCount = prendas.filter((p) => p.estado === 'AGOTADO' || p.estado === 'LIQUIDADO').length;

  // Toggle active/inactive in public catalog
  const handleToggleEstado = async (prenda: Prenda) => {
    const nuevoEstado: PrendaEstado = prenda.estado === 'DISPONIBLE' ? 'AGOTADO' : 'DISPONIBLE';
    const updated: Prenda = { ...prenda, estado: nuevoEstado };
    try {
      await onUpdatePrenda(updated);
      setNotification({
        type: 'success',
        text: `Prenda "${prenda.nombre}" ahora está ${
          nuevoEstado === 'DISPONIBLE' ? 'visible en el catálogo público' : 'pausada / oculta'
        }.`,
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.message || 'Error al actualizar el estado de la prenda.',
      });
    }
  };

  // Save quick edits
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrenda) return;

    setIsSubmitting(true);
    try {
      await onUpdatePrenda(editingPrenda);
      setNotification({
        type: 'success',
        text: `Prenda "${editingPrenda.nombre}" actualizada con éxito.`,
      });
      setEditingPrenda(null);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.message || 'Error al guardar los cambios.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border transition-all ${
            notification.type === 'success'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Action */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-200/70 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#F43F5E] flex items-center justify-center font-bold">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Tienda y Stock Inmediato
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Prendas físicas en stock para entrega inmediata en el catálogo público.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenUploadModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-xs shadow-rose-200 transition-all hover:scale-[1.01] active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Subir Prenda con Foto</span>
        </button>
      </div>

      {/* Filter and Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-rose-200/70 shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total en Catálogo</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{prendas.length} prendas</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-rose-50 text-[#F43F5E] flex items-center justify-center">
            <Tag className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-rose-200/70 shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#065F46] uppercase tracking-wider">Activas / En Stock</p>
            <p className="text-xl font-bold text-[#065F46] mt-0.5">{stockCount} visibles</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#D1FAE5] text-[#065F46] flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-rose-200/70 shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pausadas / Agotadas</p>
            <p className="text-xl font-bold text-slate-600 mt-0.5">{agotadasCount} ocultas</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
            <EyeOff className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-200/70 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#F43F5E] pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-rose-200 bg-white text-xs sm:text-sm text-[#1F2937] placeholder:text-slate-400 focus:bg-white focus:border-rose-400 focus:ring-1 focus:ring-rose-300 outline-none"
            />
          </div>

          {/* Visibility filter buttons */}
          <div className="flex items-center gap-1.5 self-start sm:self-center overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterEstado('TODOS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterEstado === 'TODOS'
                  ? 'bg-[#F43F5E] text-white shadow-xs'
                  : 'bg-[#FFF1F2] text-[#F43F5E] hover:bg-[#FCE7F3]'
              }`}
            >
              Todas ({prendas.length})
            </button>
            <button
              onClick={() => setFilterEstado('DISPONIBLE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterEstado === 'DISPONIBLE'
                  ? 'bg-[#4E9F76] text-white shadow-xs'
                  : 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#A7F3D0]'
              }`}
            >
              En Stock ({stockCount})
            </button>
            <button
              onClick={() => setFilterEstado('AGOTADO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterEstado === 'AGOTADO'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Agotadas ({agotadasCount})
            </button>
          </div>
        </div>

        {/* Desktop Table (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-rose-200/70">
          <table className="w-full text-left text-xs">
            <thead className="bg-rose-50/40 text-slate-600 border-b border-rose-100 font-medium uppercase tracking-wider text-xs">
              <tr>
                <th className="py-2.5 px-4">Prenda / Foto</th>
                <th className="py-2.5 px-3">Código / Referencia</th>
                <th className="py-2.5 px-3">Talla(s)</th>
                <th className="py-2.5 px-3">Precio Total</th>
                <th className="py-2.5 px-3">Anticipo Reserva</th>
                <th className="py-2.5 px-3 text-center">Estado en Tienda</th>
                <th className="py-2.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100/60 bg-white">
              {filteredPrendas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 text-rose-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No hay prendas que coincidan con la búsqueda</p>
                    <p className="text-[11px] mt-0.5">Sube una nueva prenda con foto para nutrir tu tienda.</p>
                  </td>
                </tr>
              ) : (
                filteredPrendas.map((prenda) => (
                  <tr key={prenda.id} className="hover:bg-rose-50/20 transition-colors">
                    {/* Prenda / Foto */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-9 h-11 rounded-lg overflow-hidden bg-rose-50 border border-rose-100 flex-shrink-0">
                          {prenda.url_foto ? (
                            <Image
                              src={prenda.url_foto}
                              alt={prenda.nombre}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-rose-300">
                              <ImageOff className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="font-bold text-slate-900 truncate">{prenda.nombre}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{prenda.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Código Shein */}
                    <td className="py-2.5 px-3">
                      <span className="font-mono bg-rose-50 border border-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        {prenda.codigo_shein}
                      </span>
                    </td>

                    {/* Talla */}
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                        {prenda.talla || 'Única'}
                      </span>
                    </td>

                    {/* Precio Total */}
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 text-xs">
                        {formatCurrency(prenda.precio_total)}
                      </span>
                    </td>

                    {/* Anticipo */}
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md text-xs">
                        {formatCurrency(prenda.precio_reserva)}
                      </span>
                    </td>

                    {/* Estado en Tienda (Toggle) */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleEstado(prenda)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-2xs ${
                          prenda.estado === 'DISPONIBLE'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Haz clic para activar/desactivar visibilidad en la tienda pública"
                      >
                        {prenda.estado === 'DISPONIBLE' ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>En Catálogo (Stock)</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            <span>Pausada / Oculta</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingPrenda(prenda)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Editar detalles"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {onEliminarPrenda && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Seguro que deseas eliminar "${prenda.nombre}" del inventario?`)) {
                                onEliminarPrenda(prenda.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar del catálogo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (block sm:hidden) */}
        <div className="block sm:hidden divide-y divide-rose-100/80 bg-white rounded-2xl border border-rose-200/70 overflow-hidden">
          {filteredPrendas.length === 0 ? (
            <div className="py-10 text-center text-slate-400 p-4">
              <ShoppingBag className="w-8 h-8 text-rose-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">No hay prendas que coincidan con la búsqueda</p>
              <p className="text-[11px] mt-0.5">Sube una nueva prenda con foto para nutrir tu tienda.</p>
            </div>
          ) : (
            filteredPrendas.map((prenda) => (
              <div key={prenda.id} className="p-3.5 space-y-3">
                {/* Fila Superior: Foto a la izquierda, detalles a la derecha */}
                <div className="flex items-start gap-3">
                  {/* Foto Cuadrada y Nítida */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-rose-50 border border-rose-200/80 flex-shrink-0 shadow-2xs">
                    {prenda.url_foto ? (
                      <Image
                        src={prenda.url_foto}
                        alt={prenda.nombre}
                        fill
                        sizes="64px"
                        className="object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-rose-300 bg-rose-50">
                        <ImageOff className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Lado derecho: Nombre, SKU copiable y Tallas */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 leading-snug">
                      {prenda.nombre}
                    </h4>

                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {/* Chip Copiable de Código / Ref */}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(prenda.codigo_shein);
                          setNotification({
                            type: 'success',
                            text: `Código ${prenda.codigo_shein} copiado al portapapeles.`,
                          });
                          setTimeout(() => setNotification(null), 2500);
                        }}
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200/80 transition-colors"
                        title="Copiar código de referencia"
                      >
                        <Tag className="w-2.5 h-2.5 text-[#F43F5E]" />
                        <span>Ref. {prenda.codigo_shein}</span>
                      </button>

                      {/* Chip de Talla */}
                      <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        Talla: {prenda.talla || 'Única'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fila Inferior: Precios (Total + Anticipo) & Switch Visible/Oculto */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-rose-100/60">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Total</span>
                      <span className="font-black text-xs text-slate-900">{formatCurrency(prenda.precio_total)}</span>
                    </div>
                    <div className="h-6 w-px bg-rose-100" />
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-rose-500 font-bold block">Anticipo</span>
                      <span className="font-bold text-xs text-rose-600">{formatCurrency(prenda.precio_reserva)}</span>
                    </div>
                  </div>

                  {/* Botón / Switch de Visibilidad */}
                  <button
                    type="button"
                    onClick={() => handleToggleEstado(prenda)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shadow-2xs ${
                      prenda.estado === 'DISPONIBLE'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 active:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 active:bg-slate-200'
                    }`}
                    title="Alternar visibilidad en la tienda pública"
                  >
                    {prenda.estado === 'DISPONIBLE' ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>En Catálogo</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        <span>Oculta</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Botones de Editar y Eliminar integrados de forma limpia */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-50">
                  <button
                    type="button"
                    onClick={() => setEditingPrenda(prenda)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-200/80 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Editar</span>
                  </button>

                  {onEliminarPrenda && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Seguro que deseas eliminar "${prenda.nombre}" del inventario?`)) {
                          onEliminarPrenda(prenda.id);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Edición Rápida */}
      {editingPrenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-rose-100 bg-rose-50/50">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Editar Prenda en Stock</h3>
              </div>
              <button
                onClick={() => setEditingPrenda(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de la Prenda</label>
                <input
                  type="text"
                  value={editingPrenda.nombre}
                  onChange={(e) => setEditingPrenda({ ...editingPrenda, nombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 outline-none text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código / Referencia (SKU)</label>
                  <input
                    type="text"
                    value={editingPrenda.codigo_shein}
                    onChange={(e) => setEditingPrenda({ ...editingPrenda, codigo_shein: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 outline-none text-slate-800 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tallas</label>
                  <input
                    type="text"
                    value={editingPrenda.talla}
                    onChange={(e) => setEditingPrenda({ ...editingPrenda, talla: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 outline-none text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Precio Total (Bs)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingPrenda.precio_total}
                    onChange={(e) => setEditingPrenda({ ...editingPrenda, precio_total: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 outline-none text-slate-800 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Anticipo Reserva (Bs)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingPrenda.precio_reserva}
                    onChange={(e) => setEditingPrenda({ ...editingPrenda, precio_reserva: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 outline-none text-rose-700 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estado de Disponibilidad</label>
                <select
                  value={editingPrenda.estado}
                  onChange={(e) => setEditingPrenda({ ...editingPrenda, estado: e.target.value as PrendaEstado })}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-400 outline-none text-slate-800 bg-white"
                >
                  <option value="DISPONIBLE">DISPONIBLE (Visible en Catálogo de Tienda)</option>
                  <option value="AGOTADO">AGOTADO (Pausada / Oculta del Catálogo)</option>
                  <option value="APARTADO">APARTADO</option>
                  <option value="LIQUIDADO">LIQUIDADO</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setEditingPrenda(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm transition-all"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
