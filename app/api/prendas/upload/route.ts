import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo de imagen' }, { status: 400 });
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen válida' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const storagePath = `prendas/${fileName}`;

    // If Supabase is configured, upload to storage bucket 'prendas'
    if (isSupabaseConfigured || isServiceRoleConfigured) {
      const client = isServiceRoleConfigured ? getSupabaseAdmin() : supabase;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data, error: uploadError } = await client.storage
        .from('prendas')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error('Error al subir a Supabase Storage:', uploadError);
        return NextResponse.json(
          { error: `Error de almacenamiento: ${uploadError.message}` },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = client.storage
        .from('prendas')
        .getPublicUrl(storagePath);

      return NextResponse.json({
        success: true,
        url_foto: urlData.publicUrl,
        storage_path: storagePath,
      });
    }

    // Demo / fallback mode (convert to base64 data URI for immediate preview)
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url_foto: dataUrl,
      storage_path: `demo/${fileName}`,
      isDemo: true,
    });
  } catch (error: any) {
    console.error('Error en upload route:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al procesar la imagen' },
      { status: 500 }
    );
  }
}
