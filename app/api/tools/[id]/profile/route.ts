import { NextResponse, type NextRequest } from 'next/server';
import { supabase as serviceClient } from '@/utils/supabase/services/supabaseClient';
import { claimToolProfile, generateToolProfile, profilesEnabled } from '@/utils/server/toolProfile';
import { isBot } from '@/utils/analytics';

export const maxDuration = 60;

// Generates a tool's profile the first time someone opens its page (components/ui/ToolProfile asks
// for it when there's none yet). Each tool is generated once; claim_tool_profile stops repeats.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!profilesEnabled() || !Number.isInteger(id) || id <= 0 || isBot(req.headers.get('user-agent'))) {
    return NextResponse.json({ status: 'skipped' }, { status: 202 });
  }
  const { data: tool } = await serviceClient
    .from('products')
    .select('id, name, slogan, description, demo_url, github_url, deleted, moderation')
    .eq('id', id)
    .maybeSingle();
  if (!tool || tool.deleted || (tool as any).moderation === 'blocked') return NextResponse.json({ status: 'not_found' }, { status: 404 });

  if (!(await claimToolProfile(id))) return NextResponse.json({ status: 'exists' }, { status: 202 });
  const result = await generateToolProfile(tool as any);
  return NextResponse.json(result, { status: result.status === 'ready' ? 201 : 202 });
}
