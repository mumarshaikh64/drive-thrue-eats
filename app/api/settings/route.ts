import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'restaurant_config' }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'restaurant_config',
          isOpen: true,
          mode: 'auto',
          openTime: '09:00',
          closeTime: '02:00'
        }
      });
    }

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

    // FINAL STATUS CALCULATION
    let finalOpenStatus = settings.isOpen;
    if (settings.mode === 'auto') {
      finalOpenStatus = isWithinTime;
    }

    return NextResponse.json({ 
      isOpen: finalOpenStatus,
      mode: settings.mode || 'auto',
      manualStatus: settings.isOpen, // Only for UI
      openTime: settings.openTime || '09:00',
      closeTime: settings.closeTime || '02:00'
    });
  } catch (err) {
    console.error('Settings GET error:', err);
    return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const updates = await req.json();
    
    const settings = await prisma.settings.upsert({
      where: { id: 'restaurant_config' },
      update: updates,
      create: {
        id: 'restaurant_config',
        isOpen: true,
        mode: 'auto',
        openTime: '09:00',
        closeTime: '02:00',
        ...updates
      }
    });

    return NextResponse.json(settings);
  } catch (err) {
    console.error('Settings PATCH error:', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
