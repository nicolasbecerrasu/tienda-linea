export type PrendaEstado = 'DISPONIBLE' | 'APARTADO' | 'AGOTADO' | 'LIQUIDADO';

export type VipTier = 'Diamante' | 'Platinum' | 'Oro';

export type CategoriaAtelier =
  | 'Vestidos de Gala'
  | 'Sastrería & Tops'
  | 'Conjuntos Alta Costura'
  | 'Bolsos & Joyería';

export interface Prenda {
  id: string;
  nombre: string;
  codigo_shein: string; // SKU / Código Atelier
  talla: string;
  precio_total: number;
  precio_reserva: number;
  url_foto: string | null;
  storage_path: string | null;
  estado: PrendaEstado;
  categoria?: CategoriaAtelier;
  swatches?: string[];
  edicion_limitada?: number;
  stock_disponible?: number;
  stock_total?: number;
  alerta_critica?: boolean;
  desglose_tallas?: Record<string, number> | null;
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
  vip_tier?: VipTier;
  courier_tracking?: string;
  courier_status?: string;
}

export interface Compra {
  id: string;
  descripcion: string;
  costo_total: number;
  cantidad_prendas: number;
  fecha_compra: string;
  created_at: string;
}

export interface ConciergeEvent {
  id: string;
  cliente_nombre: string;
  tipo: 'vip_upgrade' | 'bespoke_appointment' | 'private_reservation' | 'high_value_order';
  descripcion: string;
  hora: string;
  vip_tier: VipTier;
}

export interface CriticalStockAlert {
  id: string;
  prenda_id?: string;
  nombre: string;
  codigo: string;
  talla: string;
  stock_actual: number;
  stock_minimo: number;
  urgencia: 'urgente' | 'moderada';
}

export interface DashboardMetrics {
  anticiposEnTransito: number;
  porCobrarListas: number;
  liquidadasHoy: number;
  ventasTotales: number;
  comprasTotales: number;
  gananciaNeta: number;
  aov: number;
  csatScore: number;
  pedidosActivosCount: number;
  ventasPorMes: {
    mes: string;
    total: number;
    anticipos: number;
  }[];
  ventasPorCategoria: {
    categoria: string;
    monto: number;
    porcentaje: number;
  }[];
}
