'use client';

import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PasscodeGateProps {
  onSuccess: () => void;
}

export function PasscodeGate({ onSuccess }: PasscodeGateProps) {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) {
      setError('Por favor ingresa el código de acceso.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem('so_dashboard_auth', 'true');
        onSuccess();
      } else {
        const defaultCode = process.env.NEXT_PUBLIC_DASHBOARD_PASSCODE || 'so2026';
        if (passcode.trim() === defaultCode || passcode.trim() === 'so2026') {
          sessionStorage.setItem('so_dashboard_auth', 'true');
          onSuccess();
        } else {
          setError(data.message || 'Código incorrecto. Verifica e intenta de nuevo.');
        }
      }
    } catch (err) {
      const defaultCode = process.env.NEXT_PUBLIC_DASHBOARD_PASSCODE || 'so2026';
      if (passcode.trim() === defaultCode || passcode.trim() === 'so2026') {
        sessionStorage.setItem('so_dashboard_auth', 'true');
        onSuccess();
      } else {
        setError('Error al verificar el código. Código predeterminado: so2026');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#FAF0F2]">
      <div className="w-full max-w-md bg-white rounded-3xl border border-rose-200/70 shadow-xl p-6 sm:p-8 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#FFF1F2] rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#FDF4F5] rounded-full blur-2xl pointer-events-none" />

        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 rounded-2xl overflow-hidden border border-rose-200/70 shadow-xs mb-4 bg-[#FAF0F2]">
            <Image
              src="/logo.png"
              alt="SO Shopping Online Logo"
              fill
              className="object-contain p-1"
            />
          </div>

          <h2 className="text-2xl font-black text-[#1F2937] tracking-tight">
            SO Shopping Online
          </h2>
          <p className="mt-1 text-xs text-[#F43F5E] font-bold uppercase tracking-wider">
            Panel Administrativo • Boutique
          </p>
          <p className="mt-2 text-xs text-[#6B7280]">
            Ingresa tu código de seguridad para gestionar métricas, stock y pedidos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-2">
              Código de Seguridad
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ingresa tu clave..."
                autoFocus
                className="w-full pl-11 pr-11 py-3 rounded-2xl border border-rose-200/70 bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-[#1F2937] placeholder:text-[#6B7280] text-sm font-medium tracking-wide"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6B7280] hover:text-[#1F2937]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#F43F5E] hover:bg-rose-600 active:scale-95 hover:-translate-y-0.5 text-white font-bold text-sm transition-all duration-300 ease-out shadow-sm hover:shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : (
                <>
                  <span>Entrar al Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-[#FCE7F3] flex items-center justify-between text-xs text-[#6B7280]">
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-[#F43F5E] transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a la tienda
          </Link>
          <span className="text-[11px] text-[#6B7280]">
            Clave: <strong className="font-mono text-[#1F2937]">so2026</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
