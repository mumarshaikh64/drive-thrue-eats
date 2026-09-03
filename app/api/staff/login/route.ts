import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { sid, pin, directLogin, bypassPin } = await req.json();

    if (!sid) {
      return NextResponse.json({ success: false, error: 'Staff ID is required' }, { status: 400 });
    }

    const cleanSid = String(sid).trim();
    const whereClause: any = {
      OR: [
        { sid: { equals: cleanSid } },
        { sid: { equals: cleanSid.toUpperCase() } },
        { id: { equals: cleanSid } },
        { id: { equals: cleanSid.toUpperCase() } }
      ]
    };

    if (!directLogin && !bypassPin) {
      whereClause.pin = pin;
    }

    const staff = await prisma.staff.findFirst({
      where: whereClause
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
