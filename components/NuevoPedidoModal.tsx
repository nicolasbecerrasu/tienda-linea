'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Pedido, PedidoEstado, Prenda } from '@/types/database';
import { ESTADOS_PEDIDO_CONFIG, formatCurrency } from '@/lib/utils';
import {
  X,
  Sparkles,
  User,
  Phone,
  Tag,
  DollarSign,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

interface NuevoPedidoModalProps {
  isOpen: boolean;
  prendas: Prenda[];
  onClose: () => void;
  onPedidoCreated: (pedido: Pedido) => void;
  onPrendaCreated?: (prenda: Prenda) => void;
}

export function NuevoPedidoModal({
  isOpen,
  prendas,
  onClose,
  onPedidoCreated,
  onPrendaCreated,
}: NuevoPedidoModalProps) {
  // Mode: 'catalogo' (seleccionar existente) o 'nueva' (subir foto y crear prenda)
  const [prendaMode, setPrendaMode] = useState<'catalogo' | 'nueva'>('nueva');

  // Customer info
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');

  // Catalog selected garment
  const [selectedPrendaId, setSelectedPrendaId] = useState<string>('');

  // New Garment with photo
  const [nuevaPrendaNombre, setNuevaPrendaNombre] = useState('');
  const [nuevaPrendaCodigo, setNuevaPrendaCodigo] = useState('');
  const [nuevaPrendaTalla, setNuevaPrendaTalla] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Financial & order info
  const [precioTotal, setPrecioTotal] = useState('');
  const [anticipoPagado, setAnticipoPagado] = useState('');
  const [estado, setEstado] = useState<PedidoEstado>('APARTADO');
  const [notas, setNotas] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  // When selecting existing garment from catalog
  const handlePrendaSelect = (prendaId: string) => {
    setSelectedPrendaId(prendaId);
    const prenda = prendas.find((p) => p.id === prendaId);
    if (prenda) {
      setPrecioTotal(prenda.precio_total.toString());
      setAnticipoPagado(prenda.precio_reserva.toString());
      if (!notas) {
        setNotas(`Talla: ${prenda.talla}. Ref: ${prenda.codigo_shein}`);
      }
    }
  };

  const selectedPrendaFromCatalog = prendas.find((p) => p.id === selectedPrendaId);

  const totalNum = parseFloat(precioTotal) || 0;
  const anticipoNum = parseFloat(anticipoPagado) || 0;
  const saldoPendiente = Math.max(totalNum - anticipoNum, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clienteNombre.trim() || !clienteTelefono.trim()) {
      setError('Ingresa el nombre y el celular/WhatsApp del cliente.');
      return;
    }
    if (totalNum <= 0) {
      setError('Ingresa un precio total válido mayor a 0.');
      return;
    }

    setSubmitting(true);
    try {
      let linkedPrendaId: string | null = null;
      let finalPrendaObj: Prenda | null = null;

      // MODE 1: NUEVA PRENDA CON FOTO
      if (prendaMode === 'nueva') {
        let finalUrlFoto: string | null = null;
        let finalStoragePath: string | null = null;

        // 1. Upload photo if selected
        if (selectedFile) {
          const formData = new FormData();
          formData.append('file', selectedFile);

          const uploadRes = await fetch('/api/prendas/upload', {
            method: 'POST',
            body: formData,
          });

          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) {
            throw new Error(uploadData.error || 'Error al subir la foto a Supabase Storage.');
          }

          finalUrlFoto = uploadData.url_foto;
          finalStoragePath = uploadData.storage_path;
        }

        const nombrePrenda = nuevaPrendaNombre.trim() || `Prenda de ${clienteNombre.trim()}`;
        const codigoPrenda = nuevaPrendaCodigo.trim() || `SH-${Date.now().toString().slice(-6)}`;
        const tallaPrenda = nuevaPrendaTalla.trim() || 'Única';

        const nuevaPrendaPayload = {
          nombre: nombrePrenda,
          codigo_shein: codigoPrenda,
          talla: tallaPrenda,
          precio_total: totalNum,
          precio_reserva: anticipoNum,
          url_foto: finalUrlFoto,
          storage_path: finalStoragePath,
          estado: 'APARTADO' as const,
        };

        const { supabase, isSupabaseConfigured } = await import('@/lib/supabase/client');

        if (isSupabaseConfigured) {
          const { data: prendaData, error: prendaErr } = await supabase
            .from('prendas')
            .insert([nuevaPrendaPayload])
            .select()
            .single();

          if (prendaErr) throw prendaErr;
          linkedPrendaId = prendaData.id;
          finalPrendaObj = prendaData;
        } else {
          finalPrendaObj = {
            id: `prenda-${Date.now()}`,
            ...nuevaPrendaPayload,
            created_at: new Date().toISOString(),
          };
          linkedPrendaId = finalPrendaObj.id;
        }

        if (onPrendaCreated && finalPrendaObj) {
          onPrendaCreated(finalPrendaObj);
        }
      } else {
        // MODE 2: PRENDA EXISTENTE DEL CATÁLOGO
        linkedPrendaId = selectedPrendaId || null;
        finalPrendaObj = selectedPrendaFromCatalog || null;
      }

      // 2. Insert into pedidos
      const newPedidoPayload = {
        cliente_nombre: clienteNombre.trim(),
        cliente_telefono: clienteTelefono.trim(),
        prenda_id: linkedPrendaId,
        precio_total: totalNum,
        anticipo_pagado: anticipoNum,
        saldo_pendiente: saldoPendiente,
        fecha_pedido: new Date().toISOString(),
        estado,
        notas: notas.trim() || null,
      };

      let createdPedido: Pedido;
      const { supabase, isSupabaseConfigured } = await import('@/lib/supabase/client');

      if (isSupabaseConfigured) {
        const { data: pedidoData, error: pedidoErr } = await supabase
          .from('pedidos')
          .insert([newPedidoPayload])
          .select('*, prenda:prendas(*)')
          .single();

        if (pedidoErr) throw pedidoErr;
        createdPedido = pedidoData;
      } else {
        createdPedido = {
          id: `ped-${Date.now()}`,
          ...newPedidoPayload,
          created_at: new Date().toISOString(),
          prenda: finalPrendaObj,
        };
      }

      onPedidoCreated(createdPedido);
      onClose();
    } catch (err: any) {
      console.error('Error al registrar pedido:', err);
      setError(err?.message || 'Error al procesar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-200/70 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#FCE7F3] bg-[#FFF1F2]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#FFF1F2] border border-[#FCE7F3] text-[#F43F5E] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-[#1F2937] text-base">Registrar Nuevo Encargo</h3>
              <p className="text-xs text-[#6B7280]">Agrega un pedido por encargo recibido por WhatsApp o tienda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cliente & Celular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de la Clienta *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-rose-400" />
                <input
                  type="text"
                  placeholder="Ej. Valeria Gómez"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border border-rose-200 text-xs sm:text-sm text-slate-900 focus:border-rose-400 outline-none bg-rose-50/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Celular / WhatsApp *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-rose-400" />
                <input
                  type="text"
                  placeholder="Ej. +591 79010395"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border border-rose-200 text-xs sm:text-sm text-slate-900 focus:border-rose-400 outline-none bg-rose-50/10 font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN PRENDA: SELECTOR DE MODO */}
          <div className="pt-2 border-t border-[#FCE7F3]">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                Prenda del Pedido
              </label>
              <div className="flex items-center rounded-xl bg-[#FFF1F2] border border-[#FCE7F3] p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPrendaMode('nueva')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    prendaMode === 'nueva'
                      ? 'bg-white text-[#F43F5E] shadow-2xs font-bold'
                      : 'text-[#6B7280] hover:text-[#1F2937]'
                  }`}
                >
                  📸 Subir Foto
                </button>
                <button
                  type="button"
                  onClick={() => setPrendaMode('catalogo')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    prendaMode === 'catalogo'
                      ? 'bg-white text-[#F43F5E] shadow-2xs font-bold'
                      : 'text-[#6B7280] hover:text-[#1F2937]'
                  }`}
                >
                  🛍️ Del Catálogo
                </button>
              </div>
            </div>

            {/* MODO NUEVA: UPLOAD DE FOTO */}
            {prendaMode === 'nueva' ? (
              <div className="space-y-3 bg-rose-50/20 p-3.5 rounded-2xl border border-[#FCE7F3]">
                {/* Photo Dropzone / Preview */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Foto de la Prenda
                  </label>
                  {previewUrl ? (
                    <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-neutral-200 bg-white group">
                      <Image
                        src={previewUrl}
                        alt="Vista previa"
                        fill
                        className="object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/75 text-white hover:bg-black transition-colors"
                        title="Quitar foto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-neutral-900 hover:bg-white transition-all p-3 text-center">
                      <Upload className="w-6 h-6 text-neutral-400 mb-1" />
                      <span className="text-xs font-semibold text-neutral-800">
                        Toca aquí para subir o tomar foto
                      </span>
                      <span className="text-[10px] text-neutral-400 mt-0.5">
                        JPG, PNG, WEBP (se guardará en Supabase Storage)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Prenda Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Descripción o Nombre de la Prenda
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Vestido rojo ajustado corte sirena"
                    value={nuevaPrendaNombre}
                    onChange={(e) => setNuevaPrendaNombre(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:border-neutral-900 outline-none bg-white"
                  />
                </div>

                {/* Código Shein & Talla */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Código / Referencia (SKU)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. sw210908819238"
                      value={nuevaPrendaCodigo}
                      onChange={(e) => setNuevaPrendaCodigo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono text-neutral-900 focus:border-neutral-900 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Talla
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. S, M o L"
                      value={nuevaPrendaTalla}
                      onChange={(e) => setNuevaPrendaTalla(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:border-neutral-900 outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* MODO CATÁLOGO: SELECCIONAR EXISTENTE */
              <div className="space-y-3 bg-rose-50/20 p-3.5 rounded-2xl border border-[#FCE7F3]">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Selecciona una Prenda Disponible
                  </label>
                  <select
                    value={selectedPrendaId}
                    onChange={(e) => handlePrendaSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 text-xs text-[#1F2937] focus:border-rose-400 outline-none bg-white"
                  >
                    <option value="">-- Elige una prenda del catálogo --</option>
                    {prendas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.codigo_shein}) - {formatCurrency(p.precio_total)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preview of selected catalog item */}
                {selectedPrendaFromCatalog && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#FCE7F3]">
                    <div className="w-12 h-14 rounded-lg overflow-hidden bg-rose-50 flex-shrink-0 relative border border-[#FCE7F3]">
                      {selectedPrendaFromCatalog.url_foto ? (
                        <Image
                          src={selectedPrendaFromCatalog.url_foto}
                          alt={selectedPrendaFromCatalog.nombre}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-rose-300">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#1F2937] truncate">
                        {selectedPrendaFromCatalog.nombre}
                      </p>
                      <p className="text-[11px] text-[#6B7280] font-mono">
                        Ref: {selectedPrendaFromCatalog.codigo_shein} • Tallas: {selectedPrendaFromCatalog.talla}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Precios: Total, Anticipo y Saldo en Bs */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Precio Total (Bs) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={precioTotal}
                onChange={(e) => {
                  setPrecioTotal(e.target.value);
                  if (!anticipoPagado && e.target.value) {
                    const half = (parseFloat(e.target.value) / 2).toFixed(2);
                    setAnticipoPagado(half);
                  }
                }}
                required
                className="w-full px-3 py-2 rounded-2xl border border-rose-200 text-xs sm:text-sm font-bold text-slate-900 focus:border-rose-400 outline-none bg-rose-50/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Anticipo (Bs)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={anticipoPagado}
                onChange={(e) => setAnticipoPagado(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-rose-200 text-xs sm:text-sm font-bold text-rose-700 focus:border-rose-400 outline-none bg-rose-50/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Saldo Deuda (Bs)
              </label>
              <div className="w-full px-3 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm font-bold text-amber-800 flex items-center">
                {formatCurrency(saldoPendiente)}
              </div>
            </div>
          </div>

          {/* Estado Inicial */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Estado Inicial
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as PedidoEstado)}
              className="w-full px-3 py-2 rounded-2xl border border-rose-200 text-xs font-semibold text-slate-900 focus:border-rose-400 outline-none bg-rose-50/10"
            >
              {Object.entries(ESTADOS_PEDIDO_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label} - {config.description}
                </option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notas Adicionales (Dirección, tallas, observaciones)
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Talla M, entrega en punto acordado."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl border border-rose-200 text-xs text-slate-900 focus:border-rose-400 outline-none resize-none bg-rose-50/10"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#FCE7F3]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl border border-[#FCE7F3] text-[#6B7280] text-xs font-semibold hover:bg-[#FFF1F2] hover:text-[#1F2937] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-md shadow-rose-200 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Crear Encargo (Bs)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
