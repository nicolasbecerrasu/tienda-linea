import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Pedido, PedidoEstado, Prenda } from '@/types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  const val = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(val);
  return `${formatted} Bs`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-BO', {
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
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export const ESTADOS_PEDIDO_CONFIG: Record<
  PedidoEstado,
  { label: string; badgeClass: string; description: string }
> = {
  POR_CONFIRMAR: {
    label: 'Por Confirmar',
    badgeClass: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
    description: 'Cliente solicitó apartar pero falta verificar pago de anticipo',
  },
  APARTADO: {
    label: 'Apartado',
    badgeClass: 'bg-[#E0F2FE] text-[#075985] border-[#BAE6FD]',
    description: 'Anticipo recibido, listo para incluir en pedido de mercadería',
  },
  EN_TRANSITO: {
    label: 'En Tránsito',
    badgeClass: 'bg-[#E0F2FE] text-[#075985] border-[#BAE6FD]',
    description: 'Mercadería en tránsito hacia entrega',
  },
  LISTO_ENTREGA: {
    label: 'Listo para Entrega',
    badgeClass: 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]',
    description: 'Prenda recibida, lista para cobrar contra entrega',
  },
  LIQUIDADO: {
    label: 'Liquidado',
    badgeClass: 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]',
    description: 'Entregado y 100% cobrado. Foto eliminada de almacenamiento.',
  },
  CANCELADO: {
    label: 'Cancelado',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Pedido cancelado o devuelto',
  },
};

export function buildWhatsAppReservationLink(
  prenda: Prenda,
  phoneNumber: string = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '59179010395',
  tallaSeleccionada?: string
): string {
  const cleanPhone = (phoneNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '59179010395').replace(/[^0-9]/g, '') || '59179010395';
  const talla = tallaSeleccionada || prenda.talla || 'Única';
  const precioTotal = Number(prenda.precio_total) || 0;
  const precioReserva = Number(prenda.precio_reserva) || 100;
  const saldoContraEntrega = Math.max(precioTotal - precioReserva, 0);

  const rawMessage =
    `¡Hola Angélica! Me interesa esta prenda de SO Shopping Online:\n\n` +
    `👗 Prenda: ${prenda.nombre}\n` +
    `🏷️ Código de Referencia: ${prenda.codigo_shein || 'N/A'}\n` +
    `📏 Talla: ${talla}\n` +
    `💰 Precio Total: ${precioTotal} Bs\n` +
    `💵 Reserva: ${precioReserva} Bs (Saldo contra entrega: ${saldoContraEntrega} Bs)\n\n` +
    (prenda.url_foto ? `📸 Foto: ${prenda.url_foto}\n\n` : '') +
    `¿Sigue disponible para coordinar la reserva?`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawMessage)}`;
}


export function exportPedidosToCSV(pedidos: Pedido[], filename = 'pedidos_so_boutique.csv'): void {
  if (!pedidos || pedidos.length === 0) {
    alert('No hay pedidos para exportar.');
    return;
  }

  const headers = [
    'ID Pedido',
    'Cliente',
    'Teléfono',
    'Prenda',
    'Código / Referencia',
    'Talla',
    'Precio Total (Bs)',
    'Anticipo Pagado (Bs)',
    'Saldo Pendiente (Bs)',
    'Estado',
    'Fecha Pedido',
    'Notas',
  ];

  // Helper para escapar celdas y envolver en comillas dobles
  const escapeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    // Escapar comillas dobles duplicándolas y sanitizar saltos de línea para mantener 1 fila por registro
    const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(';');

  const rows = pedidos.map((p) => {
    const total = Number(p.precio_total) || 0;
    const anticipo = Number(p.anticipo_pagado) || 0;
    const saldo = Number(p.saldo_pendiente) ?? Math.max(total - anticipo, 0);
    const estadoNombre = ESTADOS_PEDIDO_CONFIG[p.estado]?.label || p.estado;

    return [
      escapeCell(p.id),
      escapeCell(p.cliente_nombre || ''),
      escapeCell(p.cliente_telefono || ''),
      escapeCell(p.prenda?.nombre || 'Sin prenda asignada'),
      escapeCell(p.prenda?.codigo_shein || ''),
      escapeCell(p.prenda?.talla || ''),
      escapeCell(total.toFixed(2)),
      escapeCell(anticipo.toFixed(2)),
      escapeCell(saldo.toFixed(2)),
      escapeCell(estadoNombre),
      escapeCell(formatDate(p.fecha_pedido)),
      escapeCell(p.notas || ''),
    ].join(';');
  });

  // sep=;\r\n indica a Microsoft Excel que use punto y coma como delimitador de columnas
  const csvContent = 'sep=;\r\n' + headerLine + '\r\n' + rows.join('\r\n');

  // \uFEFF antepone el Byte Order Mark (BOM) UTF-8 para visualización perfecta de tildes y caracteres en español
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
