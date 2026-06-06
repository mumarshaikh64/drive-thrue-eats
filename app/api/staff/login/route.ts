import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { sid, pin } = await req.json();
    const staff = await prisma.staff.findFirst({
      where: { 
        sid: { equals: sid.toUpperCase() },
        pin 
      }
    });

    if (staff) {
      return NextResponse.json({ success: true, staff });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid ID or PIN' }, { status: 401 });
    }
  } catch (error: any) {
    console.error("LOGIN_ERROR:", error);
    return NextResponse.json({ error: 'Login failed', details: error.message }, { status: 500 });
  }
}
