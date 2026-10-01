'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PasscodeGateProps {
  onSuccess: (role: 'direccion' | 'concierge') => void;
}

export function PasscodeGate({ onSuccess }: PasscodeGateProps) {
  const [selectedRole, setSelectedRole] = useState<'direccion' | 'concierge'>('direccion');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) {
      setError('Por favor ingresa la contraseña de acceso.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validCodes = ['so2026', 'admin123', 'shein2024'];
      const envCode = process.env.NEXT_PUBLIC_DASHBOARD_PASSCODE || 'so2026';

      let isAuthorized =
        validCodes.includes(passcode.trim()) ||
        passcode.trim().toLowerCase() === envCode.trim().toLowerCase();

      if (!isAuthorized) {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode }),
        });
        const data = await res.json();
        if (res.ok && data.success) isAuthorized = true;
      }

      if (isAuthorized) {
        sessionStorage.setItem('so_dashboard_auth', 'true');
        sessionStorage.setItem('so_user_role', selectedRole);
        onSuccess(selectedRole);
      } else {
        setError('Contraseña incorrecta. Utiliza: so2026');
      }
    } catch {
      setError('Error de autenticación. Utiliza: so2026');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 bg-[#FBF1F3]">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#F3D8DF] shadow-elevated p-6 sm:p-10 relative overflow-hidden">
        {/* Ambient Peony Glows */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#FFF8F8] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#FDE8ED] rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center">
          <div className="relative mx-auto w-14 h-14 rounded-xl overflow-hidden border border-[#F3D8DF] shadow-2xs mb-4 bg-white p-1">
            <Image
              src="/logo.png"
              alt="SO Shopping Online Atelier Logo"
              fill
              className="object-contain p-1"
            />
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2937] tracking-tight">
            SO Shopping Online
          </h2>
          <p className="mt-1 text-[11px] font-sans font-semibold tracking-[0.2em] text-[#E84364] uppercase">
            Haute Administration Suite
          </p>
          <p className="mt-2 text-xs text-[#6B7280]">
            Ingresa tu contraseña para acceder al panel de control.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Role Switcher */}
          <div>
            <label className="block text-[11px] font-semibold text-[#1F2937] uppercase tracking-wider mb-2">
              Perfil de Operaciones
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#FBF1F3] rounded-xl border border-[#F3D8DF]">
              <button
                type="button"
                onClick={() => setSelectedRole('direccion')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === 'direccion'
                    ? 'bg-white text-[#1F2937] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                Dirección General
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('concierge')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === 'concierge'
                    ? 'bg-white text-[#1F2937] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                Concierge & Ventas
              </button>
            </div>
          </div>

          {/* Passcode Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-semibold text-[#1F2937] uppercase tracking-wider">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setPasscode('so2026')}
                className="text-[11px] text-[#E84364] hover:underline font-semibold"
              >
                so2026
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#E84364]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ingresa so2026..."
                autoFocus
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#F3D8DF] bg-white text-[#1F2937] placeholder:text-neutral-400 text-sm font-medium tracking-wide focus:border-[#1F2937] focus:ring-1 focus:ring-[#1F2937] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6B7280] hover:text-[#1F2937]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#E84364] hover:bg-[#D63353] active:scale-[0.99] text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Ingresando...
              </span>
            ) : (
              <>
                <span>Ingresar al Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-5 border-t border-[#F3D8DF]/60 flex items-center justify-between text-[11px] text-[#6B7280]">
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-semibold text-[#1F2937] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a la Boutique
          </Link>

          <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#6B7280] bg-[#FBF1F3] px-2.5 py-1 rounded border border-[#F3D8DF]">
            <Lock className="w-3 h-3 text-[#E84364]" />
            <span>Acceso Seguro</span>
          </div>
        </div>
      </div>
    </div>
  );
}
