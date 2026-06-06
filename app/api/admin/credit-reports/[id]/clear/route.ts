import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseAdminSessionValue } from '@/lib/admin-session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('dte_admin_session')?.value;
    const session = parseAdminSessionValue(sessionCookie);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const order = await prisma.order.findUnique({
      where: { orderId: id }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.total < 0) {
      return NextResponse.json({ error: 'Payment records cannot be manually cleared.' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { orderId: id },
      data: {
        credit_status: 'cleared',
      }
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Clear credit error:", error);
    return NextResponse.json({ error: 'Failed to clear credit record', detail: error.message }, { status: 500 });
  }
}
