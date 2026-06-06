import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseAdminSessionValue } from '@/lib/admin-session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('dte_admin_session')?.value;
    const session = parseAdminSessionValue(sessionCookie);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'All'; // 'All' | 'Pending' | 'Cleared'
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {
      payment_type: 'credit',
      is_deleted_credit: false,
    };

    if (search) {
      where.OR = [
        { credit_customer_name: { contains: search } },
        { credit_company_name: { contains: search } },
        { credit_phone: { contains: search } },
      ];
    }

    if (status !== 'All') {
      where.credit_status = status.toLowerCase();
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(new Date(startDate).setHours(0, 0, 0, 0));
      }
      if (endDate) {
        where.timestamp.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      }
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const parsedOrders = orders.map(order => {
      let parsedItems = [];
      try {
        parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        parsedItems = [];
      }

      const dateObj = new Date(order.timestamp);
      const order_date = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const order_time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      return {
        ...order,
        items: parsedItems,
        order_date,
        order_time,
      };
    });

    return NextResponse.json({
      orders: parsedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error: any) {
    console.error("Credit reports fetch error:", error);
    return NextResponse.json({ error: 'Failed to fetch credit reports', detail: error.message }, { status: 500 });
  }
}
