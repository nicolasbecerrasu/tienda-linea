-- ========================================================
-- SISTEMA DE TIENDA Y GESTIÓN DE PEDIDOS SHEIN
-- Script de Creación de Base de Datos y Storage en Supabase
-- ========================================================

-- Habilitar extensión pgcrypto o uuid-ossp si es necesario
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA PRENDAS
CREATE TABLE IF NOT EXISTS public.prendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    codigo_shein TEXT NOT NULL,
    talla TEXT NOT NULL,
    precio_total NUMERIC(10, 2) NOT NULL CHECK (precio_total >= 0),
    precio_reserva NUMERIC(10, 2) NOT NULL CHECK (precio_reserva >= 0),
    url_foto TEXT,
    storage_path TEXT,
    estado TEXT NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'APARTADO', 'AGOTADO', 'LIQUIDADO')),
    stock_total INTEGER NOT NULL DEFAULT 1 CHECK (stock_total >= 0),
    desglose_tallas JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TABLA PEDIDOS
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT NOT NULL,
    prenda_id UUID REFERENCES public.prendas(id) ON DELETE SET NULL,
    precio_total NUMERIC(10, 2) NOT NULL CHECK (precio_total >= 0),
    anticipo_pagado NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (anticipo_pagado >= 0),
    saldo_pendiente NUMERIC(10, 2) NOT NULL DEFAULT 0,
    fecha_pedido TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    estado TEXT NOT NULL DEFAULT 'POR_CONFIRMAR' CHECK (
        estado IN ('POR_CONFIRMAR', 'APARTADO', 'EN_TRANSITO', 'LISTO_ENTREGA', 'LIQUIDADO', 'CANCELADO')
    ),
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA COMPRAS
CREATE TABLE IF NOT EXISTS public.compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion TEXT NOT NULL,
    costo_total NUMERIC(10, 2) NOT NULL CHECK (costo_total >= 0),
    cantidad_prendas INTEGER NOT NULL DEFAULT 1 CHECK (cantidad_prendas > 0),
    fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA ABONOS_PEDIDOS (Pagos parciales / múltiples por encargo)
CREATE TABLE IF NOT EXISTS public.abonos_pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    monto NUMERIC(10, 2) NOT NULL CHECK (monto > 0),
    metodo TEXT NOT NULL DEFAULT 'Efectivo',
    nota TEXT,
    fecha_pago TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices recomendados para rendimiento
CREATE INDEX IF NOT EXISTS idx_prendas_estado ON public.prendas(estado);
CREATE INDEX IF NOT EXISTS idx_prendas_codigo_shein ON public.prendas(codigo_shein);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON public.pedidos(fecha_pedido DESC);
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON public.compras(fecha_compra DESC);
CREATE INDEX IF NOT EXISTS idx_abonos_pedido_id ON public.abonos_pedidos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_abonos_fecha_pago ON public.abonos_pedidos(fecha_pago DESC);

-- Trigger para calcular automáticamente el saldo_pendiente en pedidos
CREATE OR REPLACE FUNCTION update_saldo_pendiente()
RETURNS TRIGGER AS $$
BEGIN
    NEW.saldo_pendiente := GREATEST(NEW.precio_total - NEW.anticipo_pagado, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_saldo ON public.pedidos;
CREATE TRIGGER trg_calculate_saldo
BEFORE INSERT OR UPDATE OF precio_total, anticipo_pagado ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION update_saldo_pendiente();

-- ========================================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- ========================================================
ALTER TABLE public.prendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonos_pedidos ENABLE ROW LEVEL SECURITY;

-- Catálogo de prendas: lectura pública para clientes
DROP POLICY IF EXISTS "Permitir lectura publica de prendas" ON public.prendas;
CREATE POLICY "Permitir lectura publica de prendas"
ON public.prendas FOR SELECT
USING (true);

-- Permitir todas las operaciones con clave pública/anónima o service_role para simplicidad del dashboard
-- (El dashboard utiliza un código de seguridad en la aplicación para proteger las rutas)
DROP POLICY IF EXISTS "Permitir gestion completa de prendas" ON public.prendas;
CREATE POLICY "Permitir gestion completa de prendas"
ON public.prendas FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir gestion completa de pedidos" ON public.pedidos;
CREATE POLICY "Permitir gestion completa de pedidos"
ON public.pedidos FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir gestion completa de compras" ON public.compras;
CREATE POLICY "Permitir gestion completa de compras"
ON public.compras FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir gestion completa de abonos" ON public.abonos_pedidos;
CREATE POLICY "Permitir gestion completa de abonos"
ON public.abonos_pedidos FOR ALL
USING (true)
WITH CHECK (true);

-- ========================================================
-- CONFIGURACIÓN DE STORAGE: BUCKET 'prendas'
-- ========================================================
-- Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('prendas', 'prendas', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage para el bucket 'prendas'
DROP POLICY IF EXISTS "Permitir acceso publico a imagenes prendas" ON storage.objects;
CREATE POLICY "Permitir acceso publico a imagenes prendas"
ON storage.objects FOR SELECT
USING (bucket_id = 'prendas');

DROP POLICY IF EXISTS "Permitir subir imagenes a prendas" ON storage.objects;
CREATE POLICY "Permitir subir imagenes a prendas"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prendas');

DROP POLICY IF EXISTS "Permitir actualizar imagenes de prendas" ON storage.objects;
CREATE POLICY "Permitir actualizar imagenes de prendas"
ON storage.objects FOR UPDATE
USING (bucket_id = 'prendas');

DROP POLICY IF EXISTS "Permitir eliminar imagenes de prendas" ON storage.objects;
CREATE POLICY "Permitir eliminar imagenes de prendas"
ON storage.objects FOR DELETE
USING (bucket_id = 'prendas');

-- ========================================================
-- DATOS DE EJEMPLO / SEMILLAS INICIALES (OPCIONAL)
-- ========================================================
INSERT INTO public.prendas (nombre, codigo_shein, talla, precio_total, precio_reserva, url_foto, storage_path, estado)
VALUES
('Vestido Floral Ajustado con Espalda Descubierta', 'sw210908819238', 'S, M', 24.50, 10.00, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80', NULL, 'DISPONIBLE'),
('Top Corto Cuello Halter Acanalado', 'sw220315482910', 'XS, S, M', 12.00, 5.00, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80', NULL, 'DISPONIBLE'),
('Pantalón Wide Leg Tiro Alto Elegante', 'sw230111928472', 'M, L', 28.00, 10.00, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80', NULL, 'DISPONIBLE'),
('Conjunto Blazer y Falda Tableada Casual', 'sw221105991823', 'S, M, L', 35.00, 15.00, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80', NULL, 'DISPONIBLE'),
('Camisa Oversize Satén Manga Larga', 'sw230219481729', 'Única', 19.99, 8.00, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80', NULL, 'DISPONIBLE')
ON CONFLICT DO NOTHING;
