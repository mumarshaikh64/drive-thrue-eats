import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chefName = searchParams.get('chef');

    const where: any = {};
    if (chefName) {
      where.chef = chefName;
    }

    // Get all orders (optionally filtered by chef)
    const allOrders = await prisma.order.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        orderId: true,
        customerName: true,
        status: true,
        total: true,
        type: true,
        tableNumber: true,
        chef: true,
        timestamp: true,
        items: true,
      }
    });

    const totalOrders = allOrders.length;
    const pending = allOrders.filter(o => o.status === 'Pending').length;
    const preparing = allOrders.filter(o => o.status === 'Preparing').length;
    const ready = allOrders.filter(o => o.status === 'Ready').length;
    const delivered = allOrders.filter(o => o.status === 'Delivered').length;
    const cancelled = allOrders.filter(o => o.status === 'Cancelled').length;
    const completed = delivered; // delivered = completed
    const remaining = pending + preparing + ready; // active orders

    // Parse items for history list
    const historyOrders = allOrders.map(order => {
      let parsedItems: any[] = [];
      try {
        parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch {
        parsedItems = [];
      }
      return { ...order, items: parsedItems };
    });

    return NextResponse.json({
      stats: {
        totalOrders,
        pending,
        preparing,
        ready,
        delivered,
        cancelled,
        completed,
        remaining,
      },
      orders: historyOrders
    });
  } catch (error: any) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
