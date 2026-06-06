import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
import { parseAdminSessionValue } from '@/lib/admin-session';

export async function GET() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get('dte_admin_session')?.value;
  const session = parseAdminSessionValue(rawSession);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user: session });
}
