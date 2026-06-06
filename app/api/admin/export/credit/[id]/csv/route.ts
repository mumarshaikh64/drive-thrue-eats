import { prisma } from '@/lib/prisma';
import { parseAdminSessionValue } from '@/lib/admin-session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('dte_admin_session')?.value;
    const session = parseAdminSessionValue(sessionCookie);
    if (!session) return new Response('Unauthorized', { status: 401 });

    const { id } = params;
    const refOrder = await prisma.order.findUnique({ where: { orderId: id } });
    if (!refOrder) return new Response('Order not found', { status: 404 });

    const customerPhone = refOrder.credit_phone || refOrder.phone || 'N/A';
    const customerName = refOrder.credit_customer_name || refOrder.customerName || 'N/A';
    const companyName = refOrder.credit_company_name || 'Individual';

    const isPayment = refOrder.total < 0;
    const absTotal = Math.abs(refOrder.total);

    // Parse items
    let itemsList: any[] = [];
    try {
      itemsList = typeof refOrder.items === 'string' ? JSON.parse(refOrder.items || '[]') : refOrder.items;
      if (!Array.isArray(itemsList)) itemsList = [];
    } catch {
      itemsList = [];
    }

    // Build CSV rows
    const lines: string[] = [];
    lines.push(`Transaction ID,${refOrder.orderId}`);
    lines.push(`Date & Time,${new Date(refOrder.timestamp).toLocaleString('en-IN')}`);
    lines.push(`Transaction Type,${isPayment ? 'PAYMENT RECEIVED' : `CREDIT ORDER (${refOrder.type || 'Dining'})`}`);
    lines.push(`Customer Name,${customerName}`);
    lines.push(`Company Name,${companyName}`);
    lines.push(`Phone,${customerPhone}`);
    lines.push(`Status,${refOrder.credit_status?.toUpperCase() || 'PENDING'}`);
    lines.push('');
    lines.push('S.No,Item Name,Quantity,Rate (INR),Amount (INR)');

    if (isPayment) {
      lines.push(`1,"${itemsList[0]?.name || 'Payment received'}",1,${absTotal},${absTotal}`);
    } else {
      itemsList.forEach((it: any, i: number) => {
        const rate = it.price != null ? it.price : 0;
        const amount = rate * it.quantity;
        lines.push(`${i + 1},"${it.name}",${it.quantity},${rate},${amount}`);
      });
    }

    lines.push(`,,,Total Amount (INR),${absTotal}`);

    const csv = lines.join('\r\n');
    const safeName = customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const prefix = isPayment ? 'payment' : 'credit';

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${prefix}_${refOrder.orderId}_${safeName}.csv"`
      }
    });
  } catch (err: any) {
    return new Response('Error: ' + err.message, { status: 500 });
  }
}
