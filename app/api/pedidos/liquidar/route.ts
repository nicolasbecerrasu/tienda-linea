import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pedido_id } = body;

    if (!pedido_id) {
      return NextResponse.json({ error: 'Falta el ID del pedido' }, { status: 400 });
    }

    if (!isSupabaseConfigured && !isServiceRoleConfigured) {
      // Demo mode
      return NextResponse.json({
        success: true,
        message: 'Pedido marcado como LIQUIDADO (Modo demostración). La foto fue desvinculada del registro.',
        isDemo: true,
      });
    }

    // Use admin client with SERVICE_ROLE_KEY for storage deletion
    const admin = isServiceRoleConfigured ? getSupabaseAdmin() : supabase;

    // 1. Fetch pedido to get prenda_id and total
    const { data: pedido, error: pedidoError } = await admin
      .from('pedidos')
      .select('*, prenda:prendas(*)')
      .eq('id', pedido_id)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { error: `No se encontró el pedido: ${pedidoError?.message || 'ID inexistente'}` },
        { status: 404 }
      );
    }

    let photoDeleted = false;
    let storagePathToDelete: string | null = null;

    if (pedido.prenda && pedido.prenda.storage_path) {
      storagePathToDelete = pedido.prenda.storage_path;
    } else if (pedido.prenda_id) {
      const { data: prendaData } = await admin
        .from('prendas')
        .select('storage_path')
        .eq('id', pedido.prenda_id)
        .single();
      if (prendaData?.storage_path) {
        storagePathToDelete = prendaData.storage_path;
      }
    }

    // 2. Delete photo from Supabase Storage using SERVICE_ROLE_KEY
    if (storagePathToDelete) {
      try {
        const { error: deleteStorageError } = await admin.storage
          .from('prendas')
          .remove([storagePathToDelete]);

        if (deleteStorageError) {
          console.warn('Aviso: no se pudo borrar el archivo de storage:', deleteStorageError.message);
        } else {
          photoDeleted = true;
        }
      } catch (err) {
        console.error('Excepción al eliminar archivo en bucket prendas:', err);
      }
    }

    // 3. Update prenda: remove url_foto and storage_path, set estado = 'LIQUIDADO'
    if (pedido.prenda_id) {
      await admin
        .from('prendas')
        .update({
          url_foto: null,
          storage_path: null,
          estado: 'LIQUIDADO',
        })
        .eq('id', pedido.prenda_id);
    }

    // 4. Update pedido: set estado = 'LIQUIDADO', anticipo_pagado = precio_total, saldo_pendiente = 0
    const { error: updatePedidoError } = await admin
      .from('pedidos')
      .update({
        estado: 'LIQUIDADO',
        anticipo_pagado: pedido.precio_total,
        saldo_pendiente: 0,
      })
      .eq('id', pedido_id);

    if (updatePedidoError) {
      return NextResponse.json(
        { error: `Error actualizando el pedido: ${updatePedidoError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: photoDeleted
        ? 'Pedido liquidado y foto borrada del almacenamiento exitosamente.'
        : 'Pedido liquidado y registro actualizado en base de datos.',
      photoDeleted,
    });
  } catch (error: any) {
    console.error('Error en ruta liquidar pedido:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al liquidar pedido' },
      { status: 500 }
    );
  }
}
