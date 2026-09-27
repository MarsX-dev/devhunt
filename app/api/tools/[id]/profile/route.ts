import { NextResponse, type NextRequest } from 'next/server';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { claimToolProfile, generateToolProfile, profilesEnabled } from '@/utils/server/toolProfile';
import { getRouteUser } from '@/utils/server/auth';
import { isBot } from '@/utils/analytics';
import { applyOwnerEdit, type ToolProfileData } from '@/utils/toolProfile';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const REGENERATE_HOURS = 24;
const TOOL_COLUMNS = 'id, name, slogan, description, demo_url, github_url, deleted, moderation, owner_id';

async function loadTool(id: number) {
  const { data } = await serviceClient.from('products').select(TOOL_COLUMNS).eq('id', id).maybeSingle();
  return data as { id: number; name: string; slogan: string | null; description: string | null; demo_url: string | null; github_url: string | null; deleted: boolean; moderation: string; owner_id: string } | null;
}

async function loadProfile(id: number) {
  const { data } = await serviceClient.from('tool_profiles' as never).select('status, data, sources, generated_at, updated_at').eq('product_id', id).maybeSingle();
  return data as { status: string; data: ToolProfileData | null; sources: string[]; generated_at: string | null; updated_at: string } | null;
}

async function ownedTool(id: number) {
  const user = await getRouteUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const tool = await loadTool(id);
  if (!tool || tool.deleted || tool.owner_id !== user.id) return { error: NextResponse.json({ error: 'Tool not found.' }, { status: 404 }) };
  return { tool };
}

// POST: builds a tool's profile the first time someone opens its page (components/ui/ToolProfile/
// RequestProfile); claim_tool_profile stops repeats. With ?regenerate=1 the owner rebuilds it (once a day).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!profilesEnabled() || !Number.isInteger(id) || id <= 0) return NextResponse.json({ status: 'skipped' }, { status: 202 });

  if (req.nextUrl.searchParams.get('regenerate') === '1') {
    const { tool, error } = await ownedTool(id);
    if (error) return error;
    const current = await loadProfile(id);
    if (current?.status === 'pending' && Date.now() - Date.parse(current.updated_at) < 10 * 60_000) {
      return NextResponse.json({ error: 'Already rebuilding, give it a minute.' }, { status: 409 });
    }
    if (current?.generated_at && Date.now() - Date.parse(current.generated_at) < REGENERATE_HOURS * 3600_000) {
      return NextResponse.json({ error: 'You can rebuild it once a day.' }, { status: 429 });
    }
    await serviceClient.from('tool_profiles' as never).upsert({ product_id: id, status: 'pending', updated_at: new Date().toISOString() } as never);
    const result = await generateToolProfile(tool);
    return NextResponse.json(result, { status: result.status === 'ready' ? 200 : 502 });
  }

  if (isBot(req.headers.get('user-agent'))) return NextResponse.json({ status: 'skipped' }, { status: 202 });
  const tool = await loadTool(id);
  if (!tool || tool.deleted || tool.moderation === 'blocked') return NextResponse.json({ status: 'not_found' }, { status: 404 });
  if (!(await claimToolProfile(id))) return NextResponse.json({ status: 'exists' }, { status: 202 });
  const result = await generateToolProfile(tool);
  return NextResponse.json(result, { status: result.status === 'ready' ? 201 : 202 });
}

// GET: the owner's view of their profile, including hidden ones.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { tool, error } = await ownedTool(Number(params.id));
  if (error) return error;
  const profile = await loadProfile(tool.id);
  return NextResponse.json({ tool: { id: tool.id, name: tool.name }, profile });
}

// PUT: the owner saves edits ({ data }) and/or shows or hides the whole profile ({ visible }).
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { tool, error } = await ownedTool(Number(params.id));
  if (error) return error;
  const current = await loadProfile(tool.id);
  if (!current?.data || !['ready', 'hidden'].includes(current.status)) return NextResponse.json({ error: 'There is no profile to edit yet.' }, { status: 404 });
  const body = await req.json().catch(() => null);
  const data = body?.data ? applyOwnerEdit(current.data, body.data) : current.data;
  if (!data) return NextResponse.json({ error: 'The summary can’t be empty.' }, { status: 400 });
  const status = typeof body?.visible === 'boolean' ? (body.visible ? 'ready' : 'hidden') : current.status;
  await serviceClient
    .from('tool_profiles' as never)
    .update({ data, status, updated_at: new Date().toISOString() } as never)
    .eq('product_id', tool.id);
  return NextResponse.json({ status, data });
}
