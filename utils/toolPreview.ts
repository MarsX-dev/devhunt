'use client';

import { type Profile } from '@/utils/supabase/types';
import { type ToolProfileView } from '@/utils/toolProfileData';
import { type ToolExtra } from '@/utils/toolExtras';

export interface ToolPreview {
  owner: Profile | null;
  comments: any[];
  extras: ToolExtra[];
  profile: ToolProfileView | null;
  weekRank: number | null;
}

// One CDN-cached request per tool (/api/tool-preview), shared for a minute so the modal can preload
// the previous/next tools and step instantly.
const previews = new Map<string, { at: number; data: Promise<ToolPreview | null> }>();

export function loadToolPreview(slug: string): Promise<ToolPreview | null> {
  const hit = previews.get(slug);
  if (hit && Date.now() - hit.at < 60_000) return hit.data;
  const data = fetch(`/api/tool-preview/${encodeURIComponent(slug)}`)
    .then(async res => (res.ok ? ((await res.json()) as ToolPreview) : null))
    .catch(() => {
      previews.delete(slug);
      return null;
    });
  previews.set(slug, { at: Date.now(), data });
  return data;
}
