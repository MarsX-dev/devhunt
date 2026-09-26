import { NextResponse } from 'next/server';
import { weekKey } from '@/utils/launchWeeks';
import { getRouteUser } from '@/utils/server/auth';
import { getUpcomingWeeks } from '@/utils/server/launchWeeks';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

// Lets the owner of a paid, not-yet-launched tool move it to another upcoming week.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { week } = (await req.json().catch(() => ({}))) as { week?: string };
  const { data: product } = await serviceClient
    .from('products')
    .select('id, owner_id, isPaid, launch_start, deleted')
    .eq('id', Number(params.id))
    .single();
  if (!product || product.deleted || product.owner_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!product.isPaid || new Date(product.launch_start as string) <= new Date()) {
    return NextResponse.json({ error: 'Only paid launches that haven\'t started can be rescheduled.' }, { status: 403 });
  }

  const target = (await getUpcomingWeeks(104)).find(w => weekKey(w.startDate) === week);
  if (!target || new Date(target.startDate) <= new Date()) return NextResponse.json({ error: 'Please pick an upcoming launch week.' }, { status: 400 });

  const startDate = new Date(target.startDate).toISOString();
  const endDate = new Date(target.endDate).toISOString();
  const { error } = await serviceClient
    .from('products')
    .update({ launch_date: startDate, launch_start: startDate, launch_end: endDate, week: target.week })
    .eq('id', product.id);
  if (error) return NextResponse.json({ error: 'Could not reschedule, please try again.' }, { status: 500 });
  return NextResponse.json({ launchStart: startDate });
}
