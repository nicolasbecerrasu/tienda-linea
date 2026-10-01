import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Pedido, PedidoEstado, Prenda, VipTier } from '@/types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency: 'USD' | 'BOB' = 'USD'): string {
  const val = Number(amount) || 0;
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: val % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(val);
  }
  const formatted = new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(val);
  return `${formatted} Bs`;
}

export function generateInternalSKU(): string {
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SO-${yearSuffix}${randomSuffix}`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export const VIP_TIERS_CONFIG: Record<
  VipTier,
  { label: string; badgeClass: string; icon: string }
> = {
  Diamante: {
    label: 'VIP Diamante',
    badgeClass: 'bg-rose-50 text-[#E84364] border-rose-200 font-semibold',
    icon: '💎',
  },
  Platinum: {
    label: 'VIP Platinum',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-semibold',
    icon: '✨',
  },
  Oro: {
    label: 'VIP Oro',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
    icon: '👑',
  },
};

export const ESTADOS_PEDIDO_CONFIG: Record<
  PedidoEstado,
  { label: string; badgeClass: string; description: string }
> = {
  POR_CONFIRMAR: {
    label: 'Por Confirmar',
    badgeClass: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
    description: 'Solicitud VIP recibida, pendiente de confirmación de reserva',
  },
  APARTADO: {
    label: 'En Atelier / Reservado',
    badgeClass: 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]',
    description: 'Anticipo recibido, asignada a taller para preparación',
  },
  EN_TRANSITO: {
    label: 'Courier VIP en Ruta',
    badgeClass: 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]',
    description: 'En despacho con mensajería de guante blanco',
  },
  LISTO_ENTREGA: {
    label: 'Listo en Boutique',
    badgeClass: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
    description: 'Prenda lista para entrega privada o fitting presencial',
  },
  LIQUIDADO: {
    label: 'Entregado & Liquidado',
    badgeClass: 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]',
    description: '100% cobrado y entregado a la patrona VIP',
  },
  CANCELADO: {
    label: 'Cancelado',
    badgeClass: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]',
    description: 'Pedido anulado por el cliente',
  },
};

export function buildWhatsAppReservationLink(
  prenda: Prenda,
  phoneNumber: string = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '59179010395'
): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

  const message = [
    '✨ *SOLICITUD DE CONCIERGE PRIVADO | SO ATELIER* ✨',
    '',
    'Estimada Concierge, me gustaría consultar la disponibilidad y apartar la siguiente pieza exclusiva:',
    '',
    `👗 *Pieza de Alta Costura:* ${prenda.nombre}`,
    `🏷️ *Código Atelier:* ${prenda.codigo_shein}`,
    `📏 *Tallas solicitadas:* ${prenda.talla}`,
    `💎 *Inversión Total:* ${formatCurrency(prenda.precio_total)}`,
    `💳 *Reserva Atelier (50%):* ${formatCurrency(prenda.precio_reserva)}`,
    prenda.categoria ? `🪡 *Categoría:* ${prenda.categoria}` : '',
    prenda.url_foto ? `📸 *Lookbook:* ${prenda.url_foto}` : '',
    '',
    '--------------------------------------',
    'Agradezco coordinar mi prueba de ajuste personalizada o despacho exclusivo. ¡Gracias! ✨',
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function exportPedidosToCSV(pedidos: Pedido[], filename = 'so_atelier_pedidos_vip.csv'): void {
  if (!pedidos || pedidos.length === 0) {
    alert('No hay pedidos para exportar.');
    return;
  }

  const headers = [
    'ID Pedido',
    'Nivel VIP',
    'Cliente VIP',
    'Celular / WhatsApp',
    'Prenda Atelier',
    'Código SKU',
    'Talla',
    'Precio Total (USD)',
    'Anticipo Pagado (USD)',
    'Saldo Pendiente (USD)',
    'Estado',
    'Courier Logistics',
    'Fecha Pedido',
    'Notas de Estilismo',
  ];

  const rows = pedidos.map((p) => {
    return [
      `"${p.id}"`,
      `"${p.vip_tier || 'Oro'}"`,
      `"${(p.cliente_nombre || '').replace(/"/g, '""')}"`,
      `"${(p.cliente_telefono || '').replace(/"/g, '""')}"`,
      `"${(p.prenda?.nombre || 'Pieza Bespoke').replace(/"/g, '""')}"`,
      `"${(p.prenda?.codigo_shein || '').replace(/"/g, '""')}"`,
      `"${(p.prenda?.talla || '').replace(/"/g, '""')}"`,
      p.precio_total.toFixed(2),
      p.anticipo_pagado.toFixed(2),
      p.saldo_pendiente.toFixed(2),
      `"${p.estado}"`,
      `"${p.courier_status || 'En Atelier'}"`,
      `"${formatDate(p.fecha_pedido)}"`,
      `"${(p.notas || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
