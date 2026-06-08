import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureMenuAndCouponsSeeded } from '@/lib/bootstrap-data';

export async function GET() {
  try {
    await ensureMenuAndCouponsSeeded();
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(coupons);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch coupons', detail: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const shouldActivate = data.isActive !== undefined ? Boolean(data.isActive) : true;
    
    // Check if code exists
    const existing = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() }
    });
    
    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    const coupon = await prisma.$transaction(async (tx) => {
      if (shouldActivate) {
        await tx.coupon.updateMany({
          where: { isActive: true },
          data: { isActive: false }
        });
      }

      return tx.coupon.create({
        data: {
          code: data.code.toUpperCase(),
          discount: parseInt(data.discount),
          isActive: shouldActivate
        }
      });
    });
    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create coupon', detail: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const data = await req.json();
    
    // Check if we are updating details (code/discount)
    if (data.code !== undefined || data.discount !== undefined) {
      if (data.code) {
        const existing = await prisma.coupon.findFirst({
          where: {
            code: data.code.toUpperCase(),
            NOT: { id: data.id }
          }
        });
        if (existing) {
          return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
        }
      }

      const updateData: any = {};
      if (data.code) updateData.code = data.code.toUpperCase();
      if (data.discount) updateData.discount = parseInt(data.discount);

      const coupon = await prisma.coupon.update({
        where: { id: data.id },
        data: updateData
      });
      return NextResponse.json({ success: true, coupon });
    }

    const activate = Boolean(data.isActive);
    const coupon = await prisma.$transaction(async (tx) => {
      if (activate) {
        await tx.coupon.updateMany({
          where: {
            isActive: true,
            NOT: { id: data.id }
          },
          data: { isActive: false }
        });
      }

      return tx.coupon.update({
        where: { id: data.id },
        data: {
          isActive: activate
        }
      });
    });
    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update coupon', detail: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const data = await req.json();
    await prisma.coupon.delete({
      where: { id: data.id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete coupon', detail: error.message }, { status: 500 });
  }
}
