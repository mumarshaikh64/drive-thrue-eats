import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const role = searchParams.get('role');

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const where: any = {};
    if (role === 'Waiter') {
      where.waiter = name;
    } else if (role === 'Kitchen Staff' || role === 'Chef') {
      where.chef = name;
    } else {
      // If role isn't Waiter or Chef, maybe they can do both or it's not applicable
      where.OR = [
        { waiter: name },
        { chef: name }
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    const parsedOrders = orders.map(order => {
      let parsedItems = [];
      try {
        parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        parsedItems = [];
      }
      return { ...order, items: parsedItems };
    });

    const totalOrders = parsedOrders.length;
    const completedOrders = parsedOrders.filter(o => o.status === 'Delivered').length;
    const cancelledOrders = parsedOrders.filter(o => o.status === 'Cancelled').length;

    return NextResponse.json({
      totalOrders,
      completedOrders,
      cancelledOrders,
      orders: parsedOrders,
    });
  } catch (error) {
    console.error("Staff History API Error:", error);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}
