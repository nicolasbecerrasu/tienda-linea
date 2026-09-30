export type PrendaEstado = 'DISPONIBLE' | 'APARTADO' | 'AGOTADO' | 'LIQUIDADO';

export interface Prenda {
  id: string;
  nombre: string;
  codigo_shein: string;
  talla: string;
  precio_total: number;
  precio_reserva: number;
  url_foto: string | null;
  storage_path: string | null;
  estado: PrendaEstado;
  created_at: string;
}

export type PedidoEstado =
  | 'POR_CONFIRMAR'
  | 'APARTADO'
  | 'EN_TRANSITO'
  | 'LISTO_ENTREGA'
  | 'LIQUIDADO'
  | 'CANCELADO';

export interface AbonoPedido {
  id: string;
  pedido_id: string;
  monto: number;
  metodo: string;
  nota?: string | null;
  fecha_pago: string;
  created_at?: string;
}

export interface Pedido {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  prenda_id: string | null;
  precio_total: number;
  anticipo_pagado: number;
  saldo_pendiente: number;
  fecha_pedido: string;
  estado: PedidoEstado;
  notas: string | null;
  created_at: string;
  prenda?: Prenda | null;
  abonos?: AbonoPedido[];
}

export interface Compra {
  id: string;
  descripcion: string;
  costo_total: number;
  cantidad_prendas: number;
  fecha_compra: string;
  created_at: string;
}

export interface DashboardMetrics {
  anticiposEnTransito: number;
  porCobrarListas: number;
  liquidadasHoy: number;
  ventasTotales: number;
  comprasTotales: number;
  gananciaNeta: number;
  ventasPorMes: {
    mes: string;
    total: number;
    anticipos: number;
  }[];
}
