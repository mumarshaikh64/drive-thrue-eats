import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseAdminSessionValue } from '@/lib/admin-session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
import * as XLSX from 'xlsx';

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
    if (!phone) return new Response('Phone required', { status: 400 });

    // Fetch all credit records for this phone (orders + payments)
    const allRecords = await prisma.order.findMany({
      where: {
        payment_type: 'credit',
        credit_phone: phone,
      },
      orderBy: { timestamp: 'asc' },
    });

    if (allRecords.length === 0) {
      return new Response('No records found', { status: 404 });
    }

    const customerName = allRecords[0].credit_customer_name || allRecords[0].customerName;
    const companyName = allRecords[0].credit_company_name || 'N/A';
    const customerPhone = phone;

    let totalOrdered = 0;
    let totalPaid = 0;
    for (const r of allRecords) {
      if (r.total < 0) {
        if (r.credit_status !== 'cleared') {
          totalPaid += Math.abs(r.total);
        }
      } else {
        if (r.credit_status !== 'cleared') {
          totalOrdered += r.total;
        }
      }
    }
    const pendingBalance = Math.max(0, totalOrdered - totalPaid);

    // Customer info metadata
    const customerInfo = [
      { A: 'Customer Name:', B: customerName },
      { A: 'Company Name:', B: companyName },
      { A: 'Phone Number:', B: customerPhone },
      { A: 'Total Ordered (Pending):', B: `₹${totalOrdered.toFixed(2)}` },
      { A: 'Total Paid:', B: `₹${totalPaid.toFixed(2)}` },
      { A: 'Balance Due:', B: `₹${pendingBalance.toFixed(2)}` },
      { A: '', B: '' },
      { A: '', B: '' },
    ];

    // History rows
    const historyRows = allRecords.map((r, index) => {
      let itemsStr = '';
      try {
        const items = typeof r.items === 'string' ? JSON.parse(r.items) : r.items;
        itemsStr = Array.isArray(items)
          ? items.map((it: any) => `${it.quantity}x ${it.name}`).join(', ')
          : '';
      } catch {
        itemsStr = '';
      }

      const dateObj = new Date(r.timestamp);
      const date = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const isPayment = r.total < 0;

      return {
        'S.No': index + 1,
        'Order ID': r.orderId,
        'Date': date,
        'Time': time,
        'Type': isPayment ? 'PAYMENT RECEIVED' : 'ORDER',
        'Items / Note': itemsStr,
        'Amount (₹)': isPayment ? `+${Math.abs(r.total).toFixed(2)} (Payment)` : r.total.toFixed(2),
        'Status': isPayment ? 'PAID' : (r.credit_status?.toUpperCase() || 'PENDING'),
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(customerInfo, { skipHeader: true });
    XLSX.utils.sheet_add_json(worksheet, historyRows, { origin: 'A10' });

    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
      { wch: 50 },
      { wch: 22 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Credit Statement');
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const safeName = customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="credit_statement_${safeName}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Export by customer error:', error);
    return new Response('Failed to export: ' + error.message, { status: 500 });
  }
}
