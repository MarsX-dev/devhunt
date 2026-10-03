import { NextResponse } from 'next/server';
import { getNewsletterInbox } from '@/utils/newsletterInbox';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ emails: await getNewsletterInbox() }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } });
  } catch (error) {
    console.error('newsletter inbox:', error);
    return NextResponse.json({ emails: [] }, { status: 500 });
  }
}
