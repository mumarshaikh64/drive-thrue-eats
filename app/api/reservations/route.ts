import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const res = await prisma.reservation.findMany();
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Check if table is already booked for this date and time
    const existing = await prisma.reservation.findFirst({
      where: {
        tableId: data.tableId,
        date: data.date,
        time: data.time
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This table is already booked for the selected date and time.' },
        { status: 409 }
      );
    }

    const res = await prisma.reservation.create({
      data: {
        id: data.id || Math.random().toString(36).substr(2, 9),
        tableId: data.tableId,
        name: data.name,
        phone: data.phone,
        date: data.date,
        time: data.time,
        guests: data.guests
      }
    });
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
  }
}
