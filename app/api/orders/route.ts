import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 1000;

    const where: any = {};
    if (status) where.status = status;
    
    // If no status provided, usually we only want active/recent orders for the dashboard
    if (!status) {
      where.OR = [
        { status: { notIn: ['Delivered', 'Cancelled'] } },
        { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Or last 24h
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit
    });
    
    const parsedOrders = orders.map(order => {
      let parsedItems = [];
      try {
        parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        parsedItems = [];
      }
      return { ...order, items: parsedItems };
    });

    return NextResponse.json(parsedOrders);
  } catch (error) {
    console.error("Orders API Error:", error);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // SERVER-SIDE STATUS CHECK
    const settings = await prisma.settings.findUnique({
      where: { id: 'restaurant_config' }
    });

    if (settings && !settings.isOpen && settings.mode !== 'auto') {
      return NextResponse.json({ error: 'Restaurant is currently CLOSED. Orders are disabled.' }, { status: 403 });
    }

    if (settings && settings.mode === 'auto') {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [openH, openM] = (settings.openTime || '09:00').split(':').map(Number);
      const [closeH, closeM] = (settings.closeTime || '02:00').split(':').map(Number);
      const openTotal = openH * 60 + openM;
      const closeTotal = closeH * 60 + closeM;

      let isWithinTime = false;
      if (openTotal < closeTotal) {
        isWithinTime = currentTime >= openTotal && currentTime < closeTotal;
      } else {
        isWithinTime = currentTime >= openTotal || currentTime < closeTotal;
      }

      if (!isWithinTime) {
        return NextResponse.json({ error: 'Restaurant is currently CLOSED. Orders are disabled.' }, { status: 403 });
      }
    }

    console.log(`[ORDER] Attempting new order...`);

    // Generate sequential ID: DT-00001, DT-00002, ...
    let nextOrderId: string;
    const lastOrder = await prisma.order.findFirst({
      where: { orderId: { startsWith: 'DT-' } },
      orderBy: { timestamp: 'desc' },
    });
    if (lastOrder?.orderId) {
      const lastNum = parseInt(lastOrder.orderId.replace('DT-', ''), 10);
      nextOrderId = `DT-${String((isNaN(lastNum) ? 0 : lastNum) + 1).padStart(5, '0')}`;
    } else {
      nextOrderId = 'DT-00001';
    }

    // Helper to derive payment_type if not explicitly sent
    let derivedPaymentType = data.payment_type;
    if (!derivedPaymentType && data.paymentMethod) {
      const pm = String(data.paymentMethod).toLowerCase();
      if (pm.includes('credit')) {
        derivedPaymentType = 'credit';
      } else if (pm.includes('cash')) {
        derivedPaymentType = 'cash';
      } else if (pm.includes('upi') || pm.includes('g-pay') || pm.includes('m-pay') || pm.includes('online')) {
        derivedPaymentType = 'upi';
      }
    }
    // Save screenshot if present as base64
    let screenshotUrl = null;
    if (data.screenshot && data.screenshot.startsWith('data:image')) {
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        try {
          await fs.access(uploadDir);
        } catch {
          await fs.mkdir(uploadDir, { recursive: true });
        }

        const mimeType = data.screenshot.split(';')[0].split(':')[1];
        const ext = mimeType.split('/')[1] || 'png';
        const base64Data = data.screenshot.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        const filename = `order_${nextOrderId}_screenshot.${ext}`;
        const filePath = path.join(uploadDir, filename);
        
        await fs.writeFile(filePath, buffer);
        screenshotUrl = `/uploads/${filename}`;
        console.log(`[ORDER] Screenshot saved to ${filePath}`);
      } catch (err) {
        console.error("Failed to save screenshot:", err);
      }
    }

    const newOrder = await prisma.order.create({
      data: {
        id: nextOrderId,
        orderId: nextOrderId,
        customerName: data.customerName,
        email: data.email || null,
        phone: data.phone,
        type: data.type,
        tableNumber: data.tableNumber ? String(data.tableNumber) : null,
        deliveryArea: data.deliveryArea || null,
        address: data.address || null,
        instructions: data.instructions || null,
        paymentMethod: data.paymentMethod,
        transactionNumber: data.transactionNumber || null,
        screenshot: screenshotUrl || null,
        total: parseFloat(data.total),
        status: data.status || 'Pending',
        chef: data.chef || null,
        waiter: data.waiter || null,
        items: (() => {
          const rawItems = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
          const normalized = Array.isArray(rawItems)
            ? rawItems.map((it: any) => ({ ...it, status: it.status || 'pending' }))
            : [];
          return JSON.stringify(normalized);
        })(),
        // Credit payment fields
        payment_type: derivedPaymentType || null,
        credit_customer_name: data.credit_customer_name || null,
        credit_company_name: data.credit_company_name || null,
        credit_phone: data.credit_phone || null,
        credit_status: data.credit_status || null,
        is_deleted_credit: data.is_deleted_credit !== undefined ? Boolean(data.is_deleted_credit) : false,
      }
    });
    
    console.log(`[ORDER] Success: ${newOrder.id}`);
    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error('Order creation failed:', error.message);
    return NextResponse.json({ error: 'Failed to create order', detail: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, updates } = await req.json();

    // If order status is updated, we keep individual item statuses in sync
    if (updates.status) {
      let items = [];
      if (updates.items) {
        try {
          items = typeof updates.items === 'string' ? JSON.parse(updates.items) : updates.items;
        } catch (e) {
          items = [];
        }
      } else {
        const order = await prisma.order.findUnique({
          where: { orderId: id }
        });
        if (order) {
          try {
            items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
          } catch (e) {
            items = [];
          }
        }
      }

      if (Array.isArray(items)) {
        if (updates.status === 'Preparing') {
          items = items.map((it: any) => ({
            ...it,
            status: it.status === 'pending' || !it.status ? 'preparing' : it.status
          }));
        } else if (updates.status === 'Ready') {
          items = items.map((it: any) => ({
            ...it,
            status: it.status === 'preparing' || it.status === 'pending' || !it.status ? 'ready' : it.status
          }));
        }
        updates.items = JSON.stringify(items);
      }
    }

    await prisma.order.update({
      where: { orderId: id },
      data: updates
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[PATCH ORDER ERROR]:", error);
    return NextResponse.json({ error: 'Update failed', detail: error.message || String(error) }, { status: 500 });
  }
}
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.order.delete({
      where: { orderId: id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
