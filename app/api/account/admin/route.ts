import { NextResponse } from 'next/server';
import { isAdmin } from '@/utils/server/admin';

export const dynamic = 'force-dynamic';

// Whether the signed-in user is on the DevHunt team (the avatar menu shows internal pages to them).
// The pages check this themselves; this only decides which links to show.
export async function GET() {
  return NextResponse.json({ admin: await isAdmin() }, { headers: { 'Cache-Control': 'private, no-store' } });
}
