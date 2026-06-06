import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let staff = await prisma.staff.findMany();
    
    if (staff.length === 0) {
      const defaultStaff = [
        { sid: 'ST-001', name: 'John Doe', role: 'Kitchen Staff', email: 'john@drivethru.com', phone: '123456789' },
        { sid: 'ST-002', name: 'Alina Smith', role: 'Manager', email: 'alina@drivethru.com', phone: '098765432' },
        { sid: 'ST-003', name: 'Sam Waiter', role: 'Waiter', email: 'sam@drivethru.com', phone: '112233445' },
        { sid: 'ST-004', name: 'Counter Staff 1', role: 'Counter Staff', email: 'counter@drivethru.com', phone: '998877665' }
      ];
      
      await Promise.all(defaultStaff.map(s => prisma.staff.create({ 
        data: { ...s, id: s.sid } 
      })));
      staff = await prisma.staff.findMany();
    }
    
    return NextResponse.json(staff);
  } catch (err) {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const newMember = await prisma.staff.create({
      data: {
        id: data.id || `STF-${Date.now()}`, // Added id field
        sid: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        pin: data.pin || '1234'
      }
    });
    return NextResponse.json(newMember);
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { sid, updates } = await req.json();
    const updated = await prisma.staff.update({
      where: { sid },
      data: updates
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.staff.delete({ where: { sid: id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
