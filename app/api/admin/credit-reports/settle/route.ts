import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseAdminSessionValue } from '@/lib/admin-session';
import { cookies } from 'next/headers';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('dte_admin_session')?.value;
    const session = parseAdminSessionValue(sessionCookie);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      credit_customer_name,
      credit_company_name,
      credit_phone,
      amount_paid,
      total_pending,
      note,
      payment_method,
      transaction_number,
    } = body;

    if (!credit_phone || !amount_paid || amount_paid <= 0) {
      return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 });
    }

    const amountPaid = parseFloat(amount_paid);
    const totalPending = parseFloat(total_pending);

    const newId = crypto.randomUUID();
    const newOrderId = `PAY-${Date.now()}`;

    // 1. Create a payment record (negative ledger entry) in all cases (both partial and full)
    await prisma.order.create({
      data: {
        id: newId,
        orderId: newOrderId,
        customerName: credit_customer_name || 'Credit Customer',
        phone: credit_phone,
        type: 'credit_payment',
        total: -amountPaid, // Negative amount = payment received
        status: 'Completed',
        items: JSON.stringify([{ name: note || 'Credit Payment Received', quantity: 1 }]),
        payment_type: 'credit',
        credit_customer_name: credit_customer_name,
        credit_company_name: credit_company_name,
        credit_phone: credit_phone,
        credit_status: 'pending', // Starts as pending, will be checked below
        paymentMethod: payment_method || 'Cash',
        transactionNumber: transaction_number || null,
        is_deleted_credit: false,
      },
    });

    // 2. Fetch all pending credit records for this customer (orders and payments)
    const pendingRecords = await prisma.order.findMany({
      where: {
        payment_type: 'credit',
        credit_phone: credit_phone,
        credit_status: 'pending',
        is_deleted_credit: false,
      },
    });

    // 3. Sum up the balance
    let balance = 0;
    for (const r of pendingRecords) {
      balance += r.total; // Positive for orders, negative for payments
    }

    // 4. If the balance is <= 0 (or almost 0 due to float math), mark all of them as cleared
    if (balance <= 0.05) {
      await prisma.order.updateMany({
        where: {
          payment_type: 'credit',
          credit_phone: credit_phone,
          credit_status: 'pending',
        },
        data: {
          credit_status: 'cleared',
        },
      });

      return NextResponse.json({
        success: true,
        type: 'full_payment',
        message: 'Payment received. Account is now CLEARED.',
        newOrderId,
      });
    } else {
      return NextResponse.json({
        success: true,
        type: 'partial_payment',
        message: `Payment of ₹${amountPaid} recorded. Remaining balance: ₹${balance.toFixed(2)}`,
        newOrderId,
      });
    }
  } catch (error: any) {
    console.error('Settle credit error:', error);
    return NextResponse.json({ error: 'Failed to settle credit', detail: error.message }, { status: 500 });
  }
}
