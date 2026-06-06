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
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const paymentType = searchParams.get('paymentType') || 'All'; // 'All' | 'Cash' | 'UPI' | 'Credit'
    const source = searchParams.get('source') || 'All'; // 'All' | 'User Website' | 'Waiter'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // --- AGGREGATES ---
    const totalSalesQuery = await prisma.order.aggregate({
      _sum: { total: true },
      _count: { id: true }
    });

    const cashReceivedQuery = await prisma.order.aggregate({
      where: {
        OR: [
          { payment_type: 'cash' },
          { paymentMethod: { contains: 'cash' } }
        ]
      },
      _sum: { total: true }
    });

    const upiReceivedQuery = await prisma.order.aggregate({
      where: {
        OR: [
          { payment_type: 'upi' },
          { paymentMethod: { contains: 'upi' } },
          { paymentMethod: { contains: 'g-pay' } },
          { paymentMethod: { contains: 'online' } },
          { paymentMethod: { contains: 'm-pay' } },
        ]
      },
      _sum: { total: true }
    });

    const creditGivenQuery = await prisma.order.aggregate({
      where: {
        OR: [
          { payment_type: 'credit' },
          { paymentMethod: { contains: 'credit' } }
        ]
      },
      _sum: { total: true }
    });

    const pendingCreditQuery = await prisma.order.aggregate({
      where: {
        AND: [
          {
            OR: [
              { payment_type: 'credit' },
              { paymentMethod: { contains: 'credit' } }
            ]
          },
          {
            OR: [
              { credit_status: { not: 'cleared' } },
              { credit_status: null }
            ]
          }
        ]
      },
      _sum: { total: true }
    });

    const clearedCreditQuery = await prisma.order.aggregate({
      where: {
        AND: [
          {
            OR: [
              { payment_type: 'credit' },
              { paymentMethod: { contains: 'credit' } }
            ]
          },
          { credit_status: 'cleared' }
        ]
      },
      _sum: { total: true }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaySalesQuery = await prisma.order.aggregate({
      where: {
        timestamp: { gte: startOfToday }
      },
      _sum: { total: true }
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthSalesQuery = await prisma.order.aggregate({
      where: {
        timestamp: { gte: startOfMonth }
      },
      _sum: { total: true }
    });

    // --- DETAILED TABLE WITH FILTERS ---
    const andConditions: any[] = [];

    if (startDate || endDate) {
      const timeCond: any = {};
      if (startDate) timeCond.gte = new Date(new Date(startDate).setHours(0, 0, 0, 0));
      if (endDate) timeCond.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      andConditions.push({ timestamp: timeCond });
    }

    if (paymentType !== 'All') {
      if (paymentType === 'Cash') {
        andConditions.push({
          OR: [
            { payment_type: 'cash' },
            { paymentMethod: { contains: 'cash' } }
          ]
        });
      } else if (paymentType === 'UPI') {
        andConditions.push({
          OR: [
            { payment_type: 'upi' },
            { paymentMethod: { contains: 'upi' } },
            { paymentMethod: { contains: 'g-pay' } },
            { paymentMethod: { contains: 'online' } },
            { paymentMethod: { contains: 'm-pay' } }
          ]
        });
      } else if (paymentType === 'Credit') {
        andConditions.push({
          OR: [
            { payment_type: 'credit' },
            { paymentMethod: { contains: 'credit' } }
          ]
        });
      }
    }

    if (source !== 'All') {
      if (source === 'Waiter') {
        andConditions.push({
          OR: [
            { waiter: { not: null } },
            { type: 'dining' }
          ]
        });
      } else if (source === 'User Website') {
        andConditions.push({
          waiter: null,
          type: { not: 'dining' }
        });
      }
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    const [totalCount, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      })
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

      // Determine Source
      const orderSource = (order.waiter || order.type === 'dining') ? 'Waiter' : 'User Website';

      // Standardize payment type display
      let normalizedPayment = 'Cash';
      const pmStr = order.paymentMethod?.toLowerCase() || '';
      
      if (order.payment_type === 'credit' || pmStr.includes('credit')) {
        normalizedPayment = 'Credit';
      } else if (order.payment_type === 'upi' || pmStr.includes('upi') || pmStr.includes('online') || pmStr.includes('g-pay') || pmStr.includes('m-pay')) {
        normalizedPayment = 'UPI';
      }

      return {
        ...order,
        items: parsedItems,
        order_date,
        order_time,
        source: orderSource,
        normalizedPayment,
      };
    });

    return NextResponse.json({
      summary: {
        totalSales: totalSalesQuery._sum.total || 0,
        totalOrders: totalSalesQuery._count.id || 0,
        totalCash: cashReceivedQuery._sum.total || 0,
        totalUPI: upiReceivedQuery._sum.total || 0,
        totalCredit: creditGivenQuery._sum.total || 0,
        pendingCredit: pendingCreditQuery._sum.total || 0,
        clearedCredit: clearedCreditQuery._sum.total || 0,
        todaySales: todaySalesQuery._sum.total || 0,
        monthSales: monthSalesQuery._sum.total || 0
      },
      orders: parsedOrders,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    console.error("Main report fetch error:", error);
    return NextResponse.json({ error: 'Failed to fetch main report', detail: error.message }, { status: 500 });
  }
}
