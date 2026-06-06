import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseAdminSessionValue } from '@/lib/admin-session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

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

    const dateObj = new Date(refOrder.timestamp);
    const dateStr = dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const timeStr = dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    let itemsList: any[] = [];
    try {
      itemsList = typeof refOrder.items === 'string' ? JSON.parse(refOrder.items || '[]') : refOrder.items;
      if (!Array.isArray(itemsList)) itemsList = [];
    } catch {
      itemsList = [];
    }

    let rowsHtml = '';
    if (isPayment) {
      rowsHtml = `
        <tr>
          <td>1</td>
          <td class="items-list">${itemsList[0]?.name || 'Credit Payment Received'}</td>
          <td style="text-align: center;">1</td>
          <td class="amount-col">₹${absTotal.toFixed(2)}</td>
          <td class="amount-col">₹${absTotal.toFixed(2)}</td>
        </tr>
      `;
    } else {
      rowsHtml = itemsList.map((it: any, index: number) => {
        const rate = it.price != null ? it.price : 0;
        const amount = rate * it.quantity;
        return `
          <tr>
            <td>${index + 1}</td>
            <td class="items-list">${it.name}</td>
            <td style="text-align: center;">${it.quantity}</td>
            <td class="amount-col">₹${rate.toFixed(2)}</td>
            <td class="amount-col">₹${amount.toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${isPayment ? 'Payment Receipt' : 'Credit Invoice'} - ${refOrder.orderId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #2d3748;
      background: #ffffff;
      margin: 0;
      padding: 40px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #edf2f7;
      padding-bottom: 24px;
      margin-bottom: 30px;
    }
    
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .brand-logo {
      width: 40px;
      height: 40px;
      background: #e63946;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 20px;
    }
    
    .brand-name {
      font-size: 22px;
      font-weight: 800;
      color: #1a202c;
      letter-spacing: -0.5px;
      line-height: 1;
    }
    
    .brand-subtitle {
      font-size: 10px;
      color: #718096;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    
    .document-title {
      text-align: right;
    }
    
    .document-title h1 {
      font-size: 24px;
      font-weight: 800;
      color: #1a202c;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .document-title p {
      font-size: 12px;
      color: #718096;
      font-weight: 500;
      margin: 4px 0 0 0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    
    .customer-box {
      background: #f7fafc;
      border: 1px solid #edf2f7;
      border-radius: 16px;
      padding: 20px;
    }
    
    .customer-box h3 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #e63946;
      margin: 0 0 12px 0;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .info-row:last-child {
      margin-bottom: 0;
    }
    
    .info-label {
      width: 130px;
      color: #718096;
      font-weight: 600;
    }
    
    .info-value {
      color: #1a202c;
      font-weight: 700;
    }
    
    .stats-box {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    
    .stat-card {
      background: #ffffff;
      border: 1px solid #edf2f7;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .stat-label {
      font-size: 11px;
      font-weight: 700;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-val {
      font-size: 16px;
      font-weight: 800;
      color: #1a202c;
    }
    
    .ledger-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    .ledger-table th {
      background: #f7fafc;
      border-bottom: 2px solid #e2e8f0;
      color: #4a5568;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 16px;
      text-align: left;
    }
    
    .ledger-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #edf2f7;
      font-size: 13px;
      vertical-align: middle;
    }
    
    .items-list {
      font-weight: 600;
      color: #2d3748;
      line-height: 1.4;
    }
    
    .amount-col {
      font-weight: 700;
      text-align: right;
    }
    
    .footer {
      margin-top: 60px;
      text-align: center;
      font-size: 11px;
      color: #a0aec0;
      border-top: 1px solid #edf2f7;
      padding-top: 20px;
    }
    
    .print-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #e63946;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
      transition: background 0.2s;
    }
    
    .print-btn:hover {
      background: #c53030;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-logo">D</div>
      <div>
        <div class="brand-name">Drive-Thru Eats</div>
        <div class="brand-subtitle">Credit Ledger System</div>
      </div>
    </div>
    <div class="document-title">
      <h1>${isPayment ? 'Payment Receipt' : 'Credit Order Invoice'}</h1>
      <p>ID: ${refOrder.orderId}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="customer-box">
      <h3>Customer &amp; Company Info</h3>
      <div class="info-row">
        <div class="info-label">Customer Name</div>
        <div class="info-value">${customerName}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Company</div>
        <div class="info-value">${companyName}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Phone Number</div>
        <div class="info-value">${customerPhone}</div>
      </div>
    </div>
    
    <div class="stats-box">
      <div class="stat-card">
        <span class="stat-label">Transaction Date</span>
        <span class="stat-val" style="font-size: 14px;">${dateStr}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Transaction Time</span>
        <span class="stat-val" style="font-size: 14px;">${timeStr}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Ledger Status</span>
        <span class="stat-val" style="color: ${refOrder.credit_status === 'cleared' ? '#15803d' : '#c53030'};">${refOrder.credit_status?.toUpperCase() || 'PENDING'}</span>
      </div>
    </div>
  </div>

  <table class="ledger-table">
    <thead>
      <tr>
        <th style="width: 10%">S.No</th>
        <th style="width: 45%">Item Description</th>
        <th style="width: 15%; text-align: center;">Quantity</th>
        <th style="width: 15%; text-align: right;">Rate</th>
        <th style="width: 15%; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      <tr style="background: #f7fafc; font-weight: 800; border-top: 2px solid #e2e8f0;">
        <td colspan="4" style="text-align: right; padding: 14px 16px;">Total Amount:</td>
        <td class="amount-col" style="padding: 14px 16px; font-size: 15px; color: #e63946;">₹${absTotal.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p>This is a computer-generated credit transaction invoice for Drive-Thru Eats.</p>
    <p style="margin-top: 5px;">&copy; ${new Date().getFullYear()} Drive-Thru Eats. All rights reserved.</p>
  </div>

  <button class="print-btn no-print" onclick="window.print()">Print Receipt</button>

  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } catch (error: any) {
    console.error("Export credit history PDF error:", error);
    return new Response('Failed to export history: ' + error.message, { status: 500 });
  }
}
