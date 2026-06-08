import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureMenuAndCouponsSeeded } from '@/lib/bootstrap-data';

export async function GET() {
  try {
    await ensureMenuAndCouponsSeeded();
    const categories = await prisma.menu_category.findMany({
      include: { items: true }
    });
    console.log(`GET SUCCESS: Found ${categories.length} categories`);
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error(`GET ERROR: ${error.message}`);
    return NextResponse.json({ error: 'Failed to fetch menu', detail: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { type, payload } = data;

    const availableModels = Object.keys(prisma).filter(k => !k.startsWith('$'));
    console.log(`Models: ${availableModels.join(', ')}`);

    if (type === 'category') {
      const category = await prisma.menu_category.create({
        data: {
          id: payload.name.toLowerCase().trim().replace(/\s+/g, '-'),
          name: payload.name,
          icon: ''
        }
      });
      return NextResponse.json({ success: true, category });
    }

    if (type === 'item') {
      const item = await (prisma.menu_item as any).create({
        data: {
          id: Math.random().toString(36).substr(2, 9),
          name: payload.name,
          price: parseFloat(payload.price),
          description: payload.description || '',
          discount: parseFloat(payload.discount) || 0,
          tags: payload.tags || '',
          image: payload.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
          restaurant: payload.restaurant || 'Burger Arena',
          categoryName: payload.categoryName,
          categoryId: payload.categoryId
        }
      });
      return NextResponse.json({ success: true, item });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Menu Operation failed:', error);
    return NextResponse.json({ error: 'Operation failed', detail: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, type, updates } = await req.json();
    if (type === 'category') {
      const category = await prisma.menu_category.update({
        where: { id },
        data: updates
      });
      return NextResponse.json({ success: true, category });
    } else {
      const item = await prisma.menu_item.update({
        where: { id },
        data: updates
      });
      return NextResponse.json({ success: true, item });
    }
  } catch (error: any) {
    console.error("PATCH update failed:", error);
    return NextResponse.json({ error: 'Update failed', detail: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id, type } = await req.json();
    if (type === 'item') {
      await prisma.menu_item.delete({ where: { id } });
    } else {
      await prisma.menu_category.delete({ where: { id } });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Delete failed', detail: error.message }, { status: 500 });
  }
}
