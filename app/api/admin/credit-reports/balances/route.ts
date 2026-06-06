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
    const search = searchParams.get('search') || '';

    // Fetch ALL non-deleted credit orders (both positive orders and negative payment records)
    const allCreditOrders = await prisma.order.findMany({
      where: {
        payment_type: 'credit',
        is_deleted_credit: false,
      },
      orderBy: { timestamp: 'desc' },
    });

    // Group by phone number (unique customer identifier)
    const customerMap = new Map<string, any>();

    for (const order of allCreditOrders) {
      const phone = order.credit_phone || order.phone;
      if (!phone) continue;

      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          credit_phone: phone,
          credit_customer_name: order.credit_customer_name || order.customerName,
          credit_company_name: order.credit_company_name || '',
          orders: [],
          total_ordered: 0,
          total_paid: 0,
          pending_balance: 0,
          last_order_date: order.timestamp,
          has_pending: false,
        });
      }

      const customer = customerMap.get(phone);

      // Update name/company from latest data if available
      if (order.credit_customer_name) customer.credit_customer_name = order.credit_customer_name;
      if (order.credit_company_name) customer.credit_company_name = order.credit_company_name;

      customer.orders.push(order);

      if (order.total < 0) {
        // This is a payment record (negative ledger entry)
        if (order.credit_status !== 'cleared') {
          customer.total_paid += Math.abs(order.total);
        }
      } else {
        // This is an actual order
        if (order.credit_status !== 'cleared') {
          customer.total_ordered += order.total;
          customer.has_pending = true;
        }
      }
    }

    // Calculate pending balance and filter
    const customers = Array.from(customerMap.values()).map(c => {
      c.pending_balance = Math.max(0, c.total_ordered - c.total_paid);
      c.last_order_date = c.orders[0]?.timestamp || null;
      c.pending_orders_count = c.orders.filter((o: any) => o.credit_status !== 'cleared' && o.total > 0).length;
      return c;
    });

    // Apply search filter
    const filtered = search
      ? customers.filter(c =>
          c.credit_customer_name?.toLowerCase().includes(search.toLowerCase()) ||
          c.credit_company_name?.toLowerCase().includes(search.toLowerCase()) ||
          c.credit_phone?.includes(search)
        )
      : customers;

    // Group by company
    const companyMap = new Map<string, any>();
    for (const customer of filtered) {
      const company = customer.credit_company_name || 'Individual';
      if (!companyMap.has(company)) {
        companyMap.set(company, {
          company_name: company,
          total_pending: 0,
          employees: [],
        });
      }
      const companyData = companyMap.get(company);
      companyData.employees.push(customer);
      companyData.total_pending += customer.pending_balance;
    }

    const companies = Array.from(companyMap.values()).sort((a, b) => b.total_pending - a.total_pending);

    return NextResponse.json({ companies, total_customers: filtered.length });
  } catch (error: any) {
    console.error('Grouped balances error:', error);
    return NextResponse.json({ error: 'Failed to fetch grouped balances', detail: error.message }, { status: 500 });
  }
}
