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
      orderBy: { timestamp: 'asc' } // oldest first for calculation
    });

    if (allRecords.length === 0) {
      return new Response('No records found', { status: 404 });
    }

    const customerName = allRecords[0].credit_customer_name || allRecords[0].customerName || 'N/A';
    const companyName = allRecords[0].credit_company_name || 'Individual';

    const totalCredit = allRecords.filter(o => o.total > 0).reduce((s, o) => s + o.total, 0);
    const totalPaid = allRecords.filter(o => o.total < 0).reduce((s, o) => s + Math.abs(o.total), 0);
    const pendingBalance = Math.max(0, totalCredit - totalPaid);

    // Compute running balance chronologically
    let currentBalance = 0;
    const chronologicalWithBalance = allRecords.map(r => {
      currentBalance += r.total; // total is negative for payments
      return {
        ...r,
        runningBalance: currentBalance
      };
    });

    // Display newest first in the statement table
    const displayRecords = [...chronologicalWithBalance].reverse();

    const rowsHtml = displayRecords.map((r, index) => {
      let itemsStr = '';
      try {
        const items = typeof r.items === 'string' ? JSON.parse(r.items) : r.items;
        itemsStr = Array.isArray(items)
          ? items.map((it: any) => `${it.quantity}x ${it.name}`).join(', ')
          : '';
      } catch {
        itemsStr = 'N/A';
      }

      const isPayment = r.total < 0;
      const amountFormatted = isPayment
        ? `- ₹${Math.abs(r.total).toFixed(2)}`
        : `₹${r.total.toFixed(2)}`;

      const dateObj = new Date(r.timestamp);
      const dateStr = dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const timeStr = dateObj.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      return `
        <tr>
          <td class="date-col">
            <div>${dateStr}</div>
            <div style="font-size: 10px; color: #a0aec0; margin-top: 2px;">${timeStr}</div>
          </td>
          <td><span style="font-family: monospace; font-size: 11px;">${r.orderId}</span></td>
          <td>
            <span class="type-badge ${isPayment ? 'type-payment' : 'type-order'}">
              ${isPayment ? 'Payment' : 'Order'}
            </span>
          </td>
          <td class="items-list">${isPayment ? (itemsStr || 'Payment received') : itemsStr}</td>
          <td class="amount-col ${isPayment ? 'amount-payment' : 'amount-order'}">${amountFormatted}</td>
          <td class="amount-col" style="color: #2d3748; font-weight: 600;">₹${r.runningBalance.toFixed(2)}</td>
          <td>
            <span class="status-badge ${r.credit_status === 'cleared' ? 'status-cleared' : 'status-pending'}">
              ${r.credit_status || 'pending'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Credit Statement - ${customerName}</title>
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
    
    .stat-card.outstanding {
      background: #fff5f5;
      border-color: #fed7d7;
    }
    
    .stat-label {
      font-size: 11px;
      font-weight: 700;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-card.outstanding .stat-label {
      color: #c53030;
    }
    
    .stat-val {
      font-size: 16px;
      font-weight: 800;
      color: #1a202c;
    }
    
    .stat-card.outstanding .stat-val {
      color: #9b2c2c;
      font-size: 18px;
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
    
    .date-col {
      white-space: nowrap;
      font-weight: 500;
      color: #4a5568;
    }
    
    .type-badge {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 8px;
      border-radius: 6px;
    }
    
    .type-order {
      background: #edf2f7;
      color: #4a5568;
    }
    
    .type-payment {
      background: #e6fffa;
      color: #00a389;
    }
    
    .items-list {
      font-weight: 500;
      color: #2d3748;
      max-width: 280px;
      line-height: 1.4;
    }
    
    .amount-col {
      font-weight: 700;
      text-align: right;
    }
    
    .amount-order {
      color: #e53e3e;
    }
    
    .amount-payment {
      color: #319795;
    }
    
    .status-badge {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 8px;
      border-radius: 6px;
      text-align: center;
      width: 60px;
    }
    
    .status-pending {
      background: #fff5f5;
      color: #c53030;
      border: 1px solid #fed7d7;
    }
    
    .status-cleared {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #dcfce7;
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
      <h1>Credit Statement</h1>
      <p>Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="customer-box">
      <h3>Customer Account Info</h3>
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
        <div class="info-value">${phone}</div>
      </div>
    </div>
    
    <div class="stats-box">
      <div class="stat-card">
        <span class="stat-label">Total Credit Allowed</span>
        <span class="stat-val">₹${totalCredit.toFixed(2)}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Total Amount Paid</span>
        <span class="stat-val" style="color: #319795;">₹${totalPaid.toFixed(2)}</span>
      </div>
      <div class="stat-card outstanding">
        <span class="stat-label">Balance Due</span>
        <span class="stat-val">₹${pendingBalance.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <table class="ledger-table">
    <thead>
      <tr>
        <th style="width: 15%">Date & Time</th>
        <th style="width: 15%">Order/Log ID</th>
        <th style="width: 10%">Type</th>
        <th style="width: 30%">Details / Items</th>
        <th style="width: 15%; text-align: right;">Amount</th>
        <th style="width: 15%; text-align: right;">Running Balance</th>
        <th style="width: 10%; text-align: center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer">
    <p>This is a computer-generated credit history statement for Drive-Thru Eats.</p>
    <p style="margin-top: 5px;">&copy; ${new Date().getFullYear()} Drive-Thru Eats. All rights reserved.</p>
  </div>

  <button class="print-btn no-print" onclick="window.print()">Print Statement</button>

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
    console.error("Export credit statement PDF error:", error);
    return new Response('Failed to export statement: ' + error.message, { status: 500 });
  }
}
