import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdminSessionValue } from '@/lib/admin-session';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    const user = await prisma.user.findUnique({ 
      where: { email } 
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.role.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access only' }, { status: 403 });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const response = NextResponse.json({
      success: true, 
      user: safeUser,
    });

    response.cookies.set('dte_admin_session', createAdminSessionValue(safeUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ 
      error: 'Login failed', 
      detail: error.message 
    }, { status: 500 });
  }
}
