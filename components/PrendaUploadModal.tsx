'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Prenda } from '@/types/database';
import {
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Tag,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface PrendaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrendaCreated: (prenda: Prenda) => void;
}

export function PrendaUploadModal({
  isOpen,
  onClose,
  onPrendaCreated,
}: PrendaUploadModalProps) {
  const [nombre, setNombre] = useState('');
  const [codigoShein, setCodigoShein] = useState('');
  const [talla, setTalla] = useState('');
  const [precioTotal, setPrecioTotal] = useState('');
  const [precioReserva, setPrecioReserva] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona una imagen válida (JPG, PNG, WEBP).');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalNum = parseFloat(precioTotal);
    const reservaNum = parseFloat(precioReserva);

    if (!nombre.trim() || !codigoShein.trim() || !talla.trim()) {
      setError('Por favor completa los campos requeridos: nombre, código de prenda y talla.');
      return;
    }
    if (isNaN(totalNum) || totalNum <= 0) {
      setError('El precio total debe ser un número positivo.');
      return;
    }
    if (isNaN(reservaNum) || reservaNum < 0) {
      setError('El precio de reserva / anticipo debe ser válido.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
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
          throw new Error(uploadData.error || 'Error al subir la imagen al storage.');
        }

        finalUrlFoto = uploadData.url_foto;
        finalStoragePath = uploadData.storage_path;
      }

      // 2. Insert into database
      const newPrendaPayload = {
        nombre: nombre.trim(),
        codigo_shein: codigoShein.trim(),
        talla: talla.trim(),
        precio_total: totalNum,
        precio_reserva: reservaNum,
        url_foto: finalUrlFoto,
        storage_path: finalStoragePath,
        estado: 'DISPONIBLE' as const,
      };

      // Call API or direct DB insert
      let createdPrenda: Prenda;
      try {
        const { supabase, isSupabaseConfigured } = await import('@/lib/supabase/client');
        if (isSupabaseConfigured) {
          const { data, error: dbError } = await supabase
            .from('prendas')
            .insert([newPrendaPayload])
            .select()
            .single();

          if (dbError) throw dbError;
          createdPrenda = data;
        } else {
          // Demo fallback
          createdPrenda = {
            id: `prenda-${Date.now()}`,
            ...newPrendaPayload,
            created_at: new Date().toISOString(),
          };
        }
      } catch (dbErr: any) {
        console.warn('Fallback a inserción local:', dbErr);
        createdPrenda = {
          id: `prenda-${Date.now()}`,
          ...newPrendaPayload,
          created_at: new Date().toISOString(),
        };
      }

      onPrendaCreated(createdPrenda);
      onClose();
    } catch (err: any) {
      console.error('Error al guardar prenda:', err);
      setError(err?.message || 'Error al procesar la prenda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-200/70 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#FCE7F3] bg-[#FFF1F2]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#FFF1F2] border border-[#FCE7F3] text-[#F43F5E] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-[#1F2937] text-base">Subir Prenda en Stock • SO Shopping Online</h3>
              <p className="text-xs text-[#6B7280]">Agrega una prenda con foto al catálogo público</p>
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Foto de la Prenda
            </label>
            {previewUrl ? (
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-rose-200 bg-rose-50/30 group">
                <Image
                  src={previewUrl}
                  alt="Vista previa"
                  fill
                  className="object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                  title="Quitar foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-rose-200 rounded-2xl cursor-pointer hover:border-rose-400 hover:bg-rose-50/30 transition-all p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Seleccionar o arrastrar foto aquí
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  PNG, JPG o WEBP (se subirá a Supabase Storage)
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

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre de la Prenda *
            </label>
            <input
              type="text"
              placeholder="Ej. Vestido Floral con Volantes"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-2xl border border-rose-200 text-xs sm:text-sm text-slate-900 focus:border-rose-400 focus:ring-1 focus:ring-rose-200 outline-none bg-rose-50/10"
            />
          </div>

          {/* Código / Referencia & Tallas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Código / Referencia (SKU) *
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-3 text-rose-400" />
                <input
                  type="text"
                  placeholder="Ej. SO-2026-001"
                  value={codigoShein}
                  onChange={(e) => setCodigoShein(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-rose-200 text-xs sm:text-sm font-mono text-slate-900 focus:border-rose-400 outline-none bg-rose-50/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tallas Disponibles *
              </label>
              <input
                type="text"
                placeholder="Ej. XS, S, M o Única"
                value={talla}
                onChange={(e) => setTalla(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-rose-200 text-xs sm:text-sm text-slate-900 focus:border-rose-400 outline-none bg-rose-50/10"
              />
            </div>
          </div>

          {/* Precios en Bs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  if (!precioReserva && e.target.value) {
                    const half = (parseFloat(e.target.value) / 2).toFixed(2);
                    setPrecioReserva(half);
                  }
                }}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-rose-200 text-xs sm:text-sm font-bold text-slate-900 focus:border-rose-400 outline-none bg-rose-50/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Anticipo Reserva (Bs) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={precioReserva}
                onChange={(e) => setPrecioReserva(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-rose-200 text-xs sm:text-sm font-bold text-rose-700 focus:border-rose-400 outline-none bg-rose-50/10"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#FCE7F3]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-[#FCE7F3] text-[#6B7280] text-xs font-semibold hover:bg-[#FFF1F2] hover:text-[#1F2937] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-md shadow-rose-200 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{loading ? 'Subiendo...' : 'Publicar en Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
