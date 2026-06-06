import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: { 
        name, 
        email, 
        password // Storing as plain text as requested by the simplified context, usually this should be hashed.
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: { name: newUser.name, email: newUser.email } 
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ 
      error: 'Registration failed', 
      detail: error.message 
    }, { status: 500 });
  }
}
