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
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone') || '';
    if (!phone) {
      return new Response('Phone number required', { status: 400 });
    }

    // Fetch all credit records for this customer (orders + payments)
    const allRecords = await prisma.order.findMany({
      where: {
        payment_type: 'credit',
        OR: [
          { credit_phone: phone },
          { phone: phone }
        ]
      },
      orderBy: { timestamp: 'asc' } // chronological for calculation
    });

    if (allRecords.length === 0) {
      return new Response('No records found', { status: 404 });
    }

    const customerName = allRecords[0].credit_customer_name || allRecords[0].customerName || 'N/A';
    const companyName = allRecords[0].credit_company_name || 'Individual';

    const totalCredit = allRecords.filter(o => o.total > 0).reduce((s, o) => s + o.total, 0);
    const totalPaid = allRecords.filter(o => o.total < 0).reduce((s, o) => s + Math.abs(o.total), 0);
    const pendingBalance = Math.max(0, totalCredit - totalPaid);

    // Build CSV lines
    const lines: string[] = [];
    lines.push(`Customer Name,${customerName}`);
    lines.push(`Company Name,${companyName}`);
    lines.push(`Phone,${phone}`);
    lines.push(`Total Credit Allowed,${totalCredit.toFixed(2)}`);
    lines.push(`Total Paid,${totalPaid.toFixed(2)}`);
    lines.push(`Balance Due,${pendingBalance.toFixed(2)}`);
    lines.push('');
    lines.push('S.No,Order/Log ID,Date,Time,Type,Details / Items,Amount (INR),Running Balance (INR),Status');

    let runningBalance = 0;
    allRecords.forEach((r, i) => {
      let itemsStr = '';
      try {
        const items = typeof r.items === 'string' ? JSON.parse(r.items) : r.items;
        itemsStr = Array.isArray(items)
          ? items.map((it: any) => `${it.quantity}x ${it.name}`).join(' | ')
          : '';
      } catch {
        itemsStr = '';
      }

      const dateObj = new Date(r.timestamp);
      const date = dateObj.toLocaleDateString('en-IN');
      const time = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const isPayment = r.total < 0;
      const type = isPayment ? 'PAYMENT' : 'ORDER';
      const status = r.credit_status?.toUpperCase() || 'PENDING';

      runningBalance += r.total;

      lines.push(`${i + 1},"${r.orderId}","${date}","${time}","${type}","${itemsStr.replace(/"/g, '""')}",${r.total},${runningBalance.toFixed(2)},"${status}"`);
    });

    // Join with CRLF for standard CSV
    const csv = lines.join('\r\n');
    const safeName = customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="credit_statement_${safeName}.csv"`
      }
    });
  } catch (err: any) {
    console.error("Export credit statement CSV error:", err);
    return new Response('Failed to export statement: ' + err.message, { status: 500 });
  }
}
