import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json();
    const correctPasscode = process.env.DASHBOARD_PASSCODE || process.env.NEXT_PUBLIC_DASHBOARD_PASSCODE || 'so2026';

    if (passcode && passcode.trim() === correctPasscode.trim()) {
      return NextResponse.json({ success: true, message: 'Acceso autorizado' });
    }

    return NextResponse.json(
      { success: false, message: 'Código de seguridad incorrecto' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error procesando la solicitud' },
      { status: 500 }
    );
  }
}
