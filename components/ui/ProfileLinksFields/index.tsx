'use client';

import { Plus, X as Remove } from 'lucide-react';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label/Label';
import LabelError from '@/components/ui/LabelError/LabelError';
import SocialIcon from '@/components/ui/SocialIcon';
import { buildLinks, FIELD_PLATFORMS, parseSocialLink, PLATFORMS, profileLinks, type FieldPlatform, type LinksInput } from '@/utils/socialLinks';
import { type Profile } from '@/utils/supabase/types';

export interface LinksValue {
  x: string;
  github: string;
  linkedin: string;
  more: string[];
}

const bare = (url: string) => url.replace(/^https:\/\/(www\.)?/, '');

// The form's starting values: the profile's links as short URLs (x.com/johnrush), one field per main platform.
export function linksValue(profile: Pick<Profile, 'social_links' | 'social_url'> | null): LinksValue {
  const value: LinksValue = { x: '', github: '', linkedin: '', more: [] };
  for (const link of profile ? profileLinks(profile) : []) {
    if ((FIELD_PLATFORMS as readonly string[]).includes(link.platform) && !value[link.platform as FieldPlatform]) value[link.platform as FieldPlatform] = bare(link.url);
    else value.more.push(bare(link.url));
  }
  return value;
}

export const linksInput = (value: LinksValue): LinksInput => ({ ...value, more: value.more.filter(Boolean) });

// The GitHub account from GitHub sign-in (its identity), which the server always uses for the GitHub link.
export function githubFromSession(user: { identities?: { provider: string; identity_data?: Record<string, any> }[] } | null | undefined) {
  const name = user?.identities?.find(identity => identity.provider === 'github')?.identity_data?.user_name;
  return typeof name === 'string' ? name : null;
}

const PLACEHOLDERS: Record<FieldPlatform, string> = {
  x: 'x.com/yourname or @yourname',
  github: 'github.com/yourname',
  linkedin: 'linkedin.com/in/yourname',
};

interface Props {
  value: LinksValue;
  onChange: (value: LinksValue) => void;
  errors?: Record<string, string>;
  verifiedGithub?: string | null;
}

// X, GitHub and LinkedIn fields plus "more links". Anything goes in (a handle, @handle, a URL with or without
// https); on blur it's shown the way it will be saved, and mistakes are flagged right there.
export default function ProfileLinksFields({ value, onChange, errors = {}, verifiedGithub }: Props) {
  const local = buildLinks(linksInput(value)).errors;
  const set = (patch: Partial<LinksValue>) => onChange({ ...value, ...patch });
  const tidy = (raw: string, hint?: FieldPlatform) => {
    const link = parseSocialLink(raw, hint);
    return link && (!hint || link.platform === hint) ? bare(link.url) : raw.trim();
  };

  return (
    <div className="space-y-4">
      {FIELD_PLATFORMS.map(platform => {
        const locked = platform === 'github' && !!verifiedGithub;
        return (
          <div key={platform}>
            <Label htmlFor={`link-${platform}`} className="inline-flex items-center gap-x-1.5">
              <SocialIcon platform={platform} className="h-3.5 w-3.5" />
              {PLATFORMS[platform].name}
              {locked && <span className="text-xs font-normal text-slate-500">· linked from your GitHub sign-in</span>}
            </Label>
            <Input
              id={`link-${platform}`}
              value={locked ? `github.com/${verifiedGithub}` : value[platform]}
              disabled={locked}
              placeholder={PLACEHOLDERS[platform]}
              onChange={e => set({ [platform]: (e.target as HTMLInputElement).value })}
              onBlur={e => set({ [platform]: tidy((e.target as HTMLInputElement).value, platform) })}
              className="w-full mt-2 disabled:opacity-70"
            />
            <LabelError className="mt-1">{errors[platform] || (value[platform].trim() && !locked ? local[platform] : '')}</LabelError>
          </div>
        );
      })}
      <div>
        <Label>More links</Label>
        <p className="mt-0.5 text-xs text-slate-500">Bluesky, YouTube, Product Hunt, Peerlist, dev.to, Mastodon, a blog…</p>
        <div className="mt-2 space-y-2">
          {value.more.map((item, idx) => {
            const link = item.trim() ? parseSocialLink(item) : null;
            return (
              <div key={idx} className="flex items-center gap-x-2">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-slate-800 text-slate-400">
                  <SocialIcon platform={link?.platform ?? 'website'} className="h-4 w-4" />
                </span>
                <Input
                  value={item}
                  placeholder="bsky.app/profile/you.dev"
                  aria-label={`Link ${idx + 1}`}
                  autoFocus={!item && idx === value.more.length - 1} // a row just added with "Add a link"
                  onChange={e => set({ more: value.more.map((v, i) => (i === idx ? (e.target as HTMLInputElement).value : v)) })}
                  onBlur={e => set({ more: value.more.map((v, i) => (i === idx ? tidy((e.target as HTMLInputElement).value) : v)) })}
                  className={`w-full ${item.trim() && !link ? 'border-red-500/60' : ''}`}
                />
                <button
                  type="button"
                  aria-label="Remove link"
                  onClick={() => set({ more: value.more.filter((_, i) => i !== idx) })}
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-slate-500 duration-150 hover:bg-slate-800 hover:text-slate-200"
                >
                  <Remove className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        {value.more.length < 10 && (
          <button
            type="button"
            onClick={() => set({ more: [...value.more, ''] })}
            className="mt-2 inline-flex items-center gap-x-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-400 duration-150 hover:bg-slate-800 hover:text-slate-200"
          >
            <Plus className="h-4 w-4" />
            Add a link
          </button>
        )}
        <LabelError className="mt-1">{errors.more || (value.more.some(v => v.trim()) ? local.more : '')}</LabelError>
      </div>
      <LabelError>{errors.links}</LabelError>
    </div>
  );
}
