import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseAdminSessionValue } from '@/lib/admin-session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

    const updatedOrder = await prisma.order.update({
      where: { orderId: id },
      data: {
        is_deleted_credit: true,
      }
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Delete credit error:", error);
    return NextResponse.json({ error: 'Failed to delete credit record', detail: error.message }, { status: 500 });
  }
}
