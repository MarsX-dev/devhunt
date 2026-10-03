import { NextResponse } from 'next/server';
import { getRouteUser } from '@/utils/server/auth';
import { deleteTool } from '@/utils/server/deletion';
import { confirmMatches } from '@/utils/deletion';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';

export const dynamic = 'force-dynamic';

// Deletes one of the signed-in user's tools. The body must carry the tool's name as typed by the
// user ({ confirm }), so nothing is deleted by a stray click or a forged request.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getRouteUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Tool not found.' }, { status: 404 });
  const { data: tool } = await serviceClient.from('products').select('id, name, owner_id, deleted').eq('id', id).maybeSingle();
  // Same answer for "not yours" and "doesn't exist": no probing other people's tools.
  if (!tool || tool.deleted || tool.owner_id !== user.id) return NextResponse.json({ error: 'Tool not found.' }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!confirmMatches(body?.confirm, tool.name)) return NextResponse.json({ error: 'Type the tool name to confirm.' }, { status: 400 });
  const result = await deleteTool(id, user.id);
  if (!result.ok) return NextResponse.json({ error: 'Could not delete the tool, please try again.' }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
