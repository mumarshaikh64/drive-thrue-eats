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
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // Query orders within optional date range
    const andConditions: any[] = [];
    if (startDate || endDate) {
      const timeCond: any = {};
      if (startDate) timeCond.gte = new Date(new Date(startDate).setHours(0, 0, 0, 0));
      if (endDate) timeCond.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      andConditions.push({ timestamp: timeCond });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const allOrders = await prisma.order.findMany({
      where,
      orderBy: { timestamp: 'desc' }
    });

    // Categorize orders
    const cashOrders = allOrders.filter(o => {
      const pmStr = o.paymentMethod?.toLowerCase() || '';
      return o.payment_type === 'cash' || pmStr.includes('cash');
    });
    const upiOrders = allOrders.filter(o => {
      const pmStr = o.paymentMethod?.toLowerCase() || '';
      return o.payment_type === 'upi' || pmStr.includes('upi') || pmStr.includes('online') || pmStr.includes('g-pay') || pmStr.includes('m-pay');
    });
    const creditOrders = allOrders.filter(o => {
      const pmStr = o.paymentMethod?.toLowerCase() || '';
      return o.payment_type === 'credit' || pmStr.includes('credit');
    });

    // Create summary rows
    const summaryData = [
      { Metric: 'Report Date Range:', Value: (startDate || endDate) ? `${startDate || 'Start'} to ${endDate || 'End'}` : 'All Time' },
      { Metric: 'Generated At:', Value: new Date().toLocaleString() },
      { Metric: '', Value: '' }, // Blank spacing row
      { Metric: 'Total Sales (INR):', Value: allOrders.reduce((sum, o) => sum + o.total, 0) },
      { Metric: 'Total Orders Count:', Value: allOrders.length },
      { Metric: 'Total Cash Received (INR):', Value: cashOrders.reduce((sum, o) => sum + o.total, 0) },
      { Metric: 'Total UPI Received (INR):', Value: upiOrders.reduce((sum, o) => sum + o.total, 0) },
      { Metric: 'Total Credit Given (INR):', Value: creditOrders.reduce((sum, o) => sum + o.total, 0) },
      { Metric: 'Pending Credit (INR):', Value: creditOrders.filter(o => o.credit_status !== 'cleared').reduce((sum, o) => sum + o.total, 0) },
      { Metric: 'Cleared Credit (INR):', Value: creditOrders.filter(o => o.credit_status === 'cleared').reduce((sum, o) => sum + o.total, 0) }
    ];

    // Formatter for detail sheets
    const formatOrdersForSheet = (ordersList: typeof allOrders) => {
      return ordersList.map((o, idx) => {
        let itemsStr = '';
        try {
          const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
          itemsStr = Array.isArray(items)
            ? items.map((it: any) => `${it.quantity}x ${it.name}`).join(', ')
            : '';
        } catch {
          itemsStr = 'Error';
        }

        const dateObj = new Date(o.timestamp);
        const date = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const src = (o.waiter || o.type === 'dining') ? 'Waiter' : 'User Website';

        return {
          'S.No': idx + 1,
          'Order ID': o.orderId,
          'Source': src,
          'Customer Name': o.credit_customer_name || o.customerName,
          'Phone': o.credit_phone || o.phone,
          'Items Ordered': itemsStr,
          'Amount (INR)': o.total,
          'Payment Method': o.payment_type === 'credit' ? `Credit (${o.credit_status || 'pending'})` : (o.paymentMethod || 'Cash'),
          'Date': date,
          'Time': time,
          'Order Status': o.status
        };
      });
    };

    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Detail sheets configuration
    const detailCols = [
      { wch: 6 },   // S.No
      { wch: 15 },  // Order ID
      { wch: 15 },  // Source
      { wch: 25 },  // Customer Name
      { wch: 15 },  // Phone
      { wch: 55 },  // Items
      { wch: 15 },  // Amount
      { wch: 25 },  // Payment Method
      { wch: 15 },  // Date
      { wch: 15 },  // Time
      { wch: 15 },  // Order Status
    ];

    const allSheet = XLSX.utils.json_to_sheet(formatOrdersForSheet(allOrders));
    allSheet['!cols'] = detailCols;
    XLSX.utils.book_append_sheet(workbook, allSheet, 'All Orders');

    const cashSheet = XLSX.utils.json_to_sheet(formatOrdersForSheet(cashOrders));
    cashSheet['!cols'] = detailCols;
    XLSX.utils.book_append_sheet(workbook, cashSheet, 'Cash Orders');

    const upiSheet = XLSX.utils.json_to_sheet(formatOrdersForSheet(upiOrders));
    upiSheet['!cols'] = detailCols;
    XLSX.utils.book_append_sheet(workbook, upiSheet, 'UPI Orders');

    const creditSheet = XLSX.utils.json_to_sheet(formatOrdersForSheet(creditOrders));
    creditSheet['!cols'] = detailCols;
    XLSX.utils.book_append_sheet(workbook, creditSheet, 'Credit Orders');

    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    let fileName = 'master_report.xlsx';
    if (startDate || endDate) {
      fileName = `master_report_${startDate || 'start'}_to_${endDate || 'end'}.xlsx`;
    }

    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error: any) {
    console.error("Export main report error:", error);
    return new Response('Failed to export report: ' + error.message, { status: 500 });
  }
}
