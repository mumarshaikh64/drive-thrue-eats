import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseAdminSessionValue } from '@/lib/admin-session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
import * as XLSX from 'xlsx';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('dte_admin_session')?.value;
    const session = parseAdminSessionValue(sessionCookie);
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = params;

    // Find the reference credit order to get customer phone/name
    const refOrder = await prisma.order.findUnique({
      where: { orderId: id }
    });

    if (!refOrder) {
      return new Response('Reference order not found', { status: 404 });
    }

    const customerPhone = refOrder.credit_phone || refOrder.phone || 'N/A';
    const customerName = refOrder.credit_customer_name || refOrder.customerName || 'N/A';
    const companyName = refOrder.credit_company_name || 'Individual';

    const isPayment = refOrder.total < 0;
    const absTotal = Math.abs(refOrder.total);

    // Prepare Customer Info Metadata rows
    const txInfo = [
      { A: 'Transaction ID:', B: refOrder.orderId },
      { A: 'Date & Time:', B: new Date(refOrder.timestamp).toLocaleString('en-IN') },
      { A: 'Transaction Type:', B: isPayment ? 'PAYMENT RECEIVED' : `CREDIT ORDER (${refOrder.type || 'Dining'})` },
      { A: 'Customer Name:', B: customerName },
      { A: 'Company Name:', B: companyName },
      { A: 'Phone Number:', B: customerPhone },
      { A: 'Status:', B: refOrder.credit_status?.toUpperCase() || 'PENDING' },
      { A: '', B: '' } // blank spacer row
    ];

    // Prepare table data
    let itemsList: any[] = [];
    try {
      itemsList = typeof refOrder.items === 'string' ? JSON.parse(refOrder.items || '[]') : refOrder.items;
      if (!Array.isArray(itemsList)) itemsList = [];
    } catch {
      itemsList = [];
    }

    const itemRows = isPayment
      ? [{
          'S.No': 1,
          'Item Name': itemsList[0]?.name || 'Payment received',
          'Quantity': 1,
          'Rate (INR)': absTotal,
          'Amount (INR)': absTotal
        }]
      : itemsList.map((it: any, index: number) => ({
          'S.No': index + 1,
          'Item Name': it.name,
          'Quantity': it.quantity,
          'Rate (INR)': it.price != null ? it.price : 0,
          'Amount (INR)': it.price != null ? (it.price * it.quantity) : 0
        }));

    const workbook = XLSX.utils.book_new();

    // Convert metadata array
    const worksheet = XLSX.utils.json_to_sheet(txInfo, { skipHeader: true });
    
    // Append table headers and rows starting from row 10 (index 9)
    XLSX.utils.sheet_add_json(worksheet, itemRows, { origin: 'A10' });

    // Append total row
    const totalRowIndex = 10 + itemRows.length + 1;
    XLSX.utils.sheet_add_json(worksheet, [
      { A: '', B: '', C: '', D: 'Total Amount (INR):', E: absTotal }
    ], { origin: `A${totalRowIndex}`, skipHeader: true });

    // Set column widths
    worksheet['!cols'] = [
      { wch: 18 }, // A: S.No or Info Key
      { wch: 30 }, // B: Item Name or Info Val
      { wch: 12 }, // C: Quantity
      { wch: 15 }, // D: Rate
      { wch: 18 }, // E: Amount
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaction Details');

    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const safeName = customerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const prefix = isPayment ? 'payment' : 'credit';
    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${prefix}_${refOrder.orderId}_${safeName}.xlsx"`
      }
    });
  } catch (error: any) {
    console.error("Export credit history error:", error);
    return new Response('Failed to export transaction: ' + error.message, { status: 500 });
  }
}
