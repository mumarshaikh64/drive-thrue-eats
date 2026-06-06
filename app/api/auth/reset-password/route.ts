import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Step 1: Verify email exists
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.role.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'No admin account found with this email.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Email verified. You can now set a new password.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error', detail: error.message }, { status: 500 });
  }
}

// Step 2: Update password
export async function PATCH(req: Request) {
  try {
    const { email, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.role.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'No admin account found.' }, { status: 404 });
    }

    await prisma.user.update({
      where: { email },
      data: { password: newPassword },
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Update failed', detail: error.message }, { status: 500 });
  }
}
