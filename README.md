# 🛍️ SO Shopping Online - Boutique & Sistema de Gestión de Pedidos

Una aplicación web completa construida con **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS** y **Supabase** para la exhibición de prendas exclusivas en stock y pedidos por encargo, reservas automatizadas por WhatsApp y administración de pedidos, caja y compras.

---

## 🌟 Características Principales

### 👗 1. Tienda Pública (`/`)
- **Catálogo de Prendas**: Muestra fotos, nombre, código de referencia (SKU), tallas disponibles, precio total y precio de reserva (anticipo de 100 Bs).
- **Copiado Rápido de Código de Prenda**: Copia el código en un clic para verificación.
- **Botón "Apartar por WhatsApp"**: Abre WhatsApp automáticamente con un mensaje formateado y personalizado con todos los datos de la prenda y el enlace de la foto.
- **Filtros y Búsqueda en Vivo**: Búsqueda por texto y filtrado por tallas (`XS`, `S`, `M`, `L`, `XL`, `Única`).
- **Diseño Responsive Móvil**: Optimizado para que las clientas reserven directamente desde sus teléfonos inteligentes.

### 📊 2. Dashboard Privado (`/dashboard`)
- **Acceso Protegido**: Pantalla de ingreso con código de seguridad. Código predeterminado: `so2026`.
- **A. Resumen de Caja (Métricas en Tiempo Real)**:
  - Total de anticipos recaudados (prendas en tránsito y apartadas).
  - Total por cobrar contra entrega (prendas listas en bodega).
  - Prendas liquidadas hoy y dinero ingresado.
  - Balance de ganancia neta (Ventas - Inversión en Mercadería).
  - **Gráfico Mensual de Ventas**: Visualización interactiva de volumen de ventas vs anticipos recaudados.
- **B. Gestión de Pedidos por Encargo y Deudas (Tabla Principal)**:
  - Columnas: Clienta, WhatsApp, Prenda Encargada, Talla, Código / Modelo, Precio Total, Anticipo, Saldo Deuda, Fecha, Estado, Acciones.
  - Estados: `POR_CONFIRMAR`, `APARTADO`, `EN_TRANSITO`, `LISTO_ENTREGA`, `LIQUIDADO`, `CANCELADO`.
  - Cambio de estado con 1 clic.
  - **Botón "Liquidar"**: Marca el pedido como pagado y elimina automáticamente la foto de la prenda del almacenamiento de Supabase Storage mediante la `SERVICE_ROLE_KEY`, manteniendo todo el registro histórico y contable en la base de datos.
  - Búsqueda en tiempo real y filtrado por pestañas de estado.
  - **Exportar a CSV**: Descarga inmediata de todos los pedidos filtrados para Excel o Google Sheets (`pedidos_so_boutique.csv`).
  - Botón de WhatsApp directo para contactar a cada clienta.
- **C. Compras e Inversión de Lotes**:
  - Registro de compras de mercancía (fecha, descripción del lote, costo total y cantidad de prendas).
  - Cálculo automático de costo promedio por pieza y ganancia neta en tiempo real.
- **Subir Prendas con Foto**:
  - Carga directa de imágenes al bucket `prendas` de Supabase Storage con previsualización en vivo.

---

## 🗄️ Estructura de la Base de Datos (Supabase)

El script SQL completo se encuentra en [`supabase/schema.sql`](./supabase/schema.sql). Incluye:

1. **Tabla `prendas`**:
   - `id` (UUID, Primary Key)
   - `nombre` (TEXT)
   - `codigo_shein` (TEXT)
   - `talla` (TEXT)
   - `precio_total` (NUMERIC)
   - `precio_reserva` (NUMERIC)
   - `url_foto` (TEXT)
   - `storage_path` (TEXT)
   - `estado` (`DISPONIBLE`, `APARTADO`, `AGOTADO`, `LIQUIDADO`)
   - `created_at` (TIMESTAMPTZ)

2. **Tabla `pedidos`**:
   - `id` (UUID, Primary Key)
   - `cliente_nombre` (TEXT)
   - `cliente_telefono` (TEXT)
   - `prenda_id` (UUID FK -> prendas)
   - `precio_total` (NUMERIC)
   - `anticipo_pagado` (NUMERIC)
   - `saldo_pendiente` (NUMERIC, auto-calculado)
   - `fecha_pedido` (TIMESTAMPTZ)
   - `estado` (`POR_CONFIRMAR`, `APARTADO`, `EN_TRANSITO`, `LISTO_ENTREGA`, `LIQUIDADO`, `CANCELADO`)
   - `notas` (TEXT)
   - `created_at` (TIMESTAMPTZ)

3. **Tabla `compras`**:
   - `id` (UUID, Primary Key)
   - `descripcion` (TEXT)
   - `costo_total` (NUMERIC)
   - `cantidad_prendas` (INTEGER)
   - `fecha_compra` (DATE)
   - `created_at` (TIMESTAMPTZ)

4. **Bucket de Storage**:
   - `prendas`: Almacenamiento público de fotos de prendas.

---

## 🚀 Instalación y Puesta en Marcha

### 1. Variables de Entorno
Copia `.env.example` a `.env.local` y coloca tus claves de Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Código de acceso al Dashboard
DASHBOARD_PASSCODE=so2026
NEXT_PUBLIC_DASHBOARD_PASSCODE=so2026

# WhatsApp de tu tienda (Angélica Melgar: +591 79010395)
NEXT_PUBLIC_WHATSAPP_NUMBER=59179010395
```

> **Nota:** La aplicación incluye un modo demostración inteligente: si aún no configuras Supabase, funciona inmediatamente con datos de prueba realistas para probar todas las funciones visualmente.

### 2. Configurar Base de Datos en Supabase
1. Ingresa a tu panel en [supabase.com](https://supabase.com).
2. Ve al **SQL Editor**.
3. Pega y ejecuta el contenido del archivo [`supabase/schema.sql`](./supabase/schema.sql).
4. El script creará las tablas, los triggers de cálculo automático, el bucket `prendas` y las políticas de acceso.

### 3. Ejecutar el Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la tienda pública, o [http://localhost:3000/dashboard](http://localhost:3000/dashboard) para el panel administrativo.
