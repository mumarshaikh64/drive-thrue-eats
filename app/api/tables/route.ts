import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let tables = await prisma.table.findMany();
    
    if (tables.length === 0) {
      // Seed default tables if DB is fresh/empty
      const defaultTables = [
        { number: 1, seats: 2, type: 'window' },
        { number: 2, seats: 4, type: 'regular' },
        { number: 3, seats: 4, type: 'regular' },
        { number: 4, seats: 6, type: 'vip' },
        { number: 5, seats: 2, type: 'regular' }
      ];
      
      await Promise.all(defaultTables.map(t => 
        prisma.table.create({ data: { id: `T-${t.number}`, ...t, status: 'available' } })
      ));
      
      tables = await prisma.table.findMany();
    }
    
    return NextResponse.json(tables);
  } catch (err) {
    console.error("Tables API Error:", err);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const table = await prisma.table.create({
      data: {
        id: 'TBL-' + Date.now(),
        number: data.number,
        seats: data.seats,
        type: data.type,
        status: 'available'
      }
    });
    return NextResponse.json(table);
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, number, seats, type, status } = await req.json();
    const updated = await prisma.table.update({
      where: { id },
      data: {
        number: number !== undefined ? Number(number) : undefined,
        seats: seats !== undefined ? Number(seats) : undefined,
        type,
        status
      }
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("Tables PATCH Error:", err);
    return NextResponse.json({ error: 'Update failed', details: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.table.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Tables DELETE Error:", err);
    return NextResponse.json({ error: 'Delete failed', details: err.message }, { status: 500 });
  }
}
