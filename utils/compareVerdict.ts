import { sectionShown, type ToolProfileData } from '@/utils/toolProfile';

// The "which should I pick?" parts of /compare/[a]-vs-[b] (seo-plan.md A4): a verdict per tool, a pair FAQ
// and the DevHunt facts. Every sentence is built from data we already store (tool profiles, products);
// anything we can't state from that data is left out rather than guessed. Pure functions (tested).

export interface VerdictTool {
  id: number;
  name: string; // display name (cleanName)
  slug: string;
  votes_count: number;
  is_reference: boolean;
  launch_start: string | null;
  pricing: string | null; // products pricing type: Free / Subscription / One time fee
  github_url?: string | null;
  categories: { name: string }[];
  profile: ToolProfileData | null;
}

export interface Faq {
  q: string;
  a: string;
}

const same = (x: string, y: string) => x.trim().toLowerCase() === y.trim().toLowerCase();
const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(w => (w.length > 3 ? w.replace(/s$/, '') : w)));
// "Vite-native unit testing" and "Vite-based unit testing" say the same thing; show one.
export const nearDuplicate = (x: string, y: string) => {
  const [a, b] = [words(x), words(y)];
  const shared = Array.from(a).filter(w => b.has(w)).length;
  return shared / (a.size + b.size - shared) >= 0.5;
};

// "A, B and C"
export const listJoin = (items: string[], word = 'and') =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} ${word} ${items[items.length - 1]}`;

// ---------- pricing ----------

export interface Price {
  amount: number;
  currency: '$' | '€' | '£';
  perUser: boolean;
  plan: string;
}

const FREE_PRICE = /^(free|[$€£]\s?0(\.0+)?)(\s|\/|$)/i;

// A monthly plan price we can compare, or null. Only "$20", "$20/mo", "$19 per user/month (billed annually)"
// style prices; usage-based ("per 1,000 searches"), yearly, one-off, "+" and truncated strings are skipped.
export function parseMonthlyPrice(price: string, billing: string | null, plan = ''): Price | null {
  const m = price.trim().match(/^([$€£])\s?(\d{1,3}(?:,\d{3})*|\d+)(\.\d+)?/);
  if (!m) return null;
  const amount = Number(m[2].replace(/,/g, '') + (m[3] ?? ''));
  if (!amount) return null;
  const rest = `${price.trim().slice(m[0].length)} ${billing ?? ''}`.toLowerCase();
  if (!/\b(mo|mon|month|monthly)\b/.test(rest)) return null;
  const perUser = /\b(user|member|seat)s?\b/.test(rest);
  const leftover = rest
    .replace(/\(?billed (annual\w*|yearly|monthly)\)?/g, ' ')
    .replace(/\b(per|a|mo|mon|month|monthly|user|member|seat|usd)\b\.?/g, ' ')
    .replace(/[/\s]/g, '');
  if (leftover) return null;
  return { amount, currency: m[1] as Price['currency'], perUser, plan };
}

export const formatPrice = (p: Price) =>
  `${p.currency}${Number.isInteger(p.amount) ? p.amount : p.amount.toFixed(2)}/month${p.perUser ? ' per user' : ''}`;

export interface PriceInfo {
  kind: 'free' | 'open source' | 'freemium' | 'paid' | 'one-time' | 'unknown';
  freePlan: string | null; // name of a free plan, when the profile lists one
  lowest: Price | null; // cheapest comparable paid plan
  trial: boolean;
  fromListing: boolean; // only the launch form's pricing type, no profile pricing: used for "is it free?" only
}

export function priceInfo(t: VerdictTool): PriceInfo {
  const pricing = t.profile && sectionShown(t.profile, 'pricing') ? t.profile.pricing : null;
  const plans = pricing?.plans ?? [];
  const freePlan = plans.find(p => FREE_PRICE.test(p.price.trim()))?.name ?? null;
  const paid = plans
    .map(p => parseMonthlyPrice(p.price, p.billing, p.name))
    .filter((p): p is Price => !!p)
    .sort((x, y) => x.amount - y.amount);
  const lowest = paid.find(p => !p.perUser) ?? paid[0] ?? null;
  const trial = pricing?.free_trial === true;
  const model = pricing?.model?.trim().toLowerCase() ?? null;
  let kind: PriceInfo['kind'] = 'unknown';
  let fromListing = false;
  if (model === 'open source') kind = 'open source';
  else if (model === 'free') kind = 'free';
  else if (model === 'freemium') kind = 'freemium';
  else if (model === 'paid') kind = freePlan ? 'freemium' : 'paid';
  else if (!model) {
    const type = t.pricing?.toLowerCase();
    fromListing = !!type;
    if (type === 'free') kind = 'free';
    else if (type === 'subscription') kind = 'paid';
    else if (type === 'one time fee') kind = 'one-time';
  }
  return { kind, freePlan, lowest, trial, fromListing };
}

const isFree = (p: PriceInfo) => p.kind === 'free' || p.kind === 'open source';
// Pricing from the tool's profile (its own website), firm enough to compare on.
const firm = (p: PriceInfo) => p.kind !== 'unknown' && !p.fromListing;
export const possessive = (name: string) => (name.endsWith('s') ? `${name}'` : `${name}'s`);

// "Cursor has a free plan (Hobby); paid plans start at $20/month (Individual)."
function priceSentence(name: string, p: PriceInfo): string | null {
  if (p.fromListing)
    return p.kind === 'free'
      ? `${name} is listed as free on DevHunt.`
      : p.kind === 'paid'
        ? `${name} is listed on DevHunt as a paid subscription.`
        : p.kind === 'one-time'
          ? `${name} is listed on DevHunt as a one-time purchase.`
          : null;
  const from = p.lowest ? `${formatPrice(p.lowest)}${p.lowest.plan ? ` (${p.lowest.plan})` : ''}` : null;
  switch (p.kind) {
    case 'open source':
      return `${name} is free and open source.`;
    case 'free':
      return `${name} is free.`;
    case 'freemium':
      return `${name} has a free plan${p.freePlan && !same(p.freePlan, 'free') ? ` (${p.freePlan})` : ''}${from ? `; paid plans start at ${from}` : ' and paid plans'}.`;
    case 'paid':
      return `${name} is paid${from ? `, from ${from}` : ''}${p.trial ? ', with a free trial' : ''}.`;
    case 'one-time':
      return `${name} is sold for a one-time fee.`;
    default:
      return null;
  }
}

const comparable = (x: Price | null, y: Price | null): x is Price => !!x && !!y && x.currency === y.currency && x.perUser === y.perUser;

// ---------- open source ----------

const repoOf = (url: string | null | undefined) => url?.match(/github\.com\/([^/\s?#]+\/[^/\s?#]+)/i)?.[1]?.replace(/\.git$/, '') ?? null;

export interface OpenSourceInfo {
  open: boolean;
  repo: string | null; // owner/name, only when the tool's own GitHub link points to it
  license: string | null;
  stars: number | null;
}

// Open source when the tool links its own GitHub repo, sits in the Open Source category or the profile's
// pricing says so. The profile's GitHub stats are only trusted when they're for that same repo (a profile
// can pick up a plugin or SDK repo of a closed product).
export function openSourceInfo(t: VerdictTool): OpenSourceInfo {
  const repo = repoOf(t.github_url);
  const gh = t.profile?.github ?? null;
  const ghMatches = !!repo && !!gh && same(gh.repo, repo);
  const open =
    !!repo ||
    t.categories.some(c => same(c.name, 'Open Source')) ||
    (!!t.profile && sectionShown(t.profile, 'pricing') && same(t.profile.pricing?.model ?? '', 'open source'));
  return { open, repo, license: ghMatches ? gh!.license : null, stars: ghMatches ? gh!.stars : null };
}

const osDetail = (o: OpenSourceInfo) =>
  o.repo ? ` (${o.repo} on GitHub${o.license ? `, ${o.license} license` : ''})` : '';

// ---------- integrations ----------

const integrationsOf = (t: VerdictTool) => (t.profile && sectionShown(t.profile, 'glance') ? t.profile.integrations : []).filter(Boolean);

// ---------- verdict ----------

const altEntry = (from: VerdictTool, to: VerdictTool) =>
  from.profile && sectionShown(from.profile, 'compare') ? from.profile.alternatives.find(a => a.id === to.id) : undefined;

export interface VerdictSide {
  name: string;
  reasons: string[]; // noun phrases under "Pick {name} if you want…"
}

export interface Verdict {
  sides: VerdictSide[]; // only tools with at least one reason
  notes: string[]; // how-they-differ sentences not already shown in the page header
}

function reasonsFor(t: VerdictTool, other: VerdictTool): string[] {
  const out: string[] = [];
  const add = (s: string | null | undefined) => {
    const v = s?.trim().replace(/\.$/, '');
    if (v && !out.some(o => nearDuplicate(o, v))) out.push(v[0].toUpperCase() + v.slice(1));
  };
  add(t.profile?.best_for);
  add(altEntry(other, t)?.best_for); // how the other tool's profile describes this one

  const [p, q] = [priceInfo(t), priceInfo(other)];
  const [os, otherOs] = [openSourceInfo(t), openSourceInfo(other)];
  let saidOpenSource = false;
  if (!firm(p) || !firm(q)) {
    // no pricing reason from launch-form data
  } else if (isFree(p) && !isFree(q)) {
    saidOpenSource = os.open;
    add(os.open ? 'A free, open-source tool' : 'A free tool');
  } else if (p.kind === 'freemium' && q.kind === 'paid' && !q.freePlan) {
    add(p.freePlan && !same(p.freePlan, 'free') ? `A free plan to start with (${p.freePlan})` : 'A free plan to start with');
  } else if (comparable(p.lowest, q.lowest) && p.lowest.amount < q.lowest!.amount) {
    add(`The lower starting price: ${formatPrice(p.lowest)} against ${formatPrice(q.lowest!)}`);
  }
  if (os.open && !otherOs.open && !saidOpenSource) add(`Open-source code${osDetail(os)}`);

  const [mine, theirs] = [integrationsOf(t), integrationsOf(other)];
  if (mine.length && theirs.length) {
    const only = mine.filter(i => !theirs.some(j => same(i, j))).slice(0, 3);
    if (only.length) add(`Integrations with ${listJoin(only, 'or')} (on ${possessive(t.name)} list, not ${possessive(other.name)})`);
  }
  return out;
}

export function buildVerdict(a: VerdictTool, b: VerdictTool, headerDifference: string | null): Verdict {
  const sides = [
    { name: a.name, reasons: reasonsFor(a, b) },
    { name: b.name, reasons: reasonsFor(b, a) },
  ].filter(s => s.reasons.length);
  const notes: string[] = [];
  for (const [from, to] of [
    [a, b],
    [b, a],
  ] as const) {
    const d = altEntry(from, to)?.difference?.trim();
    if (!d || (headerDifference && same(d, headerDifference)) || notes.some(n => n.includes(d))) continue;
    // Some entries describe the alternative without naming it ("Supports REST, GraphQL and gRPC...").
    const named = [from.name, to.name].some(n => d.toLowerCase().includes(n.toLowerCase()));
    notes.push(named ? d : `${to.name}: ${d}`);
  }
  return { sides, notes };
}

// ---------- FAQ ----------

export function buildPairFaq(a: VerdictTool, b: VerdictTool): Faq[] {
  const faq: Faq[] = [];
  const [pa, pb] = [priceInfo(a), priceInfo(b)];

  // Is A or B free?
  const freeLines = [priceSentence(a.name, pa), priceSentence(b.name, pb)];
  const freeQ = `Is ${a.name} or ${b.name} free?`;
  if (isFree(pa) && isFree(pb) && firm(pa) && firm(pb))
    faq.push({
      q: freeQ,
      a:
        pa.kind === 'open source' && pb.kind === 'open source'
          ? 'Yes, both are free and open source.'
          : `Yes, both are free${pa.kind === 'open source' ? `, and ${a.name} is open source` : pb.kind === 'open source' ? `, and ${b.name} is open source` : ''}.`,
    });
  else if (pa.kind === 'paid' && pb.kind === 'paid' && firm(pa) && firm(pb)) {
    // "Stripe is paid. Paddle is paid." reads badly; only keep the sentences that add a price or a trial.
    const detail = [pa, pb].map((p, i) => (p.lowest || p.trial ? freeLines[i] : null)).filter(Boolean);
    faq.push({ q: freeQ, a: `No, both are paid and neither has a free plan.${detail.length ? ` ${detail.join(' ')}` : ''}` });
  } else if (freeLines.some(Boolean)) faq.push({ q: freeQ, a: freeLines.filter(Boolean).join(' ') });

  // Which is cheaper? Only when there's a paid price to talk about (two free tools are covered above).
  if (firm(pa) && firm(pb) && !(isFree(pa) && isFree(pb))) {
    const q = `Which is cheaper, ${a.name} or ${b.name}?`;
    const plan = (n: string, p: Price) => `${possessive(n)} ${p.plan ? `${p.plan} plan` : 'cheapest paid plan'} (${formatPrice(p)})`;
    if (comparable(pa.lowest, pb.lowest)) {
      const [x, y] = [pa.lowest, pb.lowest!];
      if (x.amount === y.amount)
        faq.push({ q, a: `They start at the same price: ${plan(a.name, x)} and ${plan(b.name, y)} cost the same.` });
      else {
        const [cheap, dear] = x.amount < y.amount ? [[a.name, x], [b.name, y]] as const : [[b.name, y], [a.name, x]] as const;
        faq.push({ q, a: `${cheap[0]} is cheaper to start with: ${plan(cheap[0], cheap[1])} against ${plan(dear[0], dear[1])}.` });
      }
    } else {
      // Not comparable: say what each costs, but only when we know something concrete for both.
      const known = (p: PriceInfo) => isFree(p) || !!p.lowest;
      if (known(pa) && known(pb)) {
        const cost = (n: string, p: PriceInfo) =>
          isFree(p) ? `${n} is free` : `${n} starts at ${formatPrice(p.lowest!)}${p.lowest!.plan ? ` (${p.lowest!.plan})` : ''}`;
        const free = isFree(pa) ? a.name : isFree(pb) ? b.name : null;
        faq.push({
          q,
          a: free
            ? `${free} is free, so it costs less. ${cost(free === a.name ? b.name : a.name, free === a.name ? pb : pa)}.`
            : `${cost(a.name, pa)} and ${cost(b.name, pb)}; the plans are billed differently, so compare what's included.`,
        });
      }
    }
  }

  // Open source?
  const [oa, ob] = [openSourceInfo(a), openSourceInfo(b)];
  if (oa.open || ob.open) {
    const q = `Is ${a.name} or ${b.name} open source?`;
    if (oa.open && ob.open) faq.push({ q, a: `Yes, both are open source: ${a.name}${osDetail(oa)} and ${b.name}${osDetail(ob)}.` });
    else {
      const [open, oi, closed] = oa.open ? [a.name, oa, b.name] : [b.name, ob, a.name];
      faq.push({ q, a: `${open} is open source${osDetail(oi)}. DevHunt has no public source repository on record for ${closed}.` });
    }
  }

  // Same integrations?
  const [ia, ib] = [integrationsOf(a), integrationsOf(b)];
  if (ia.length && ib.length) {
    const shared = ia.filter(i => ib.some(j => same(i, j)));
    const onlyA = ia.filter(i => !shared.some(s => same(s, i)));
    const onlyB = ib.filter(i => !shared.some(s => same(s, i)));
    const some = (xs: string[]) => (xs.length > 4 ? `${xs.slice(0, 4).join(', ')} and ${xs.length - 4} more` : listJoin(xs));
    const extra = [onlyA.length ? `${a.name} also lists ${some(onlyA)}` : '', onlyB.length ? `${b.name} also lists ${some(onlyB)}` : '']
      .filter(Boolean)
      .join('; ');
    faq.push({
      q: `Do ${a.name} and ${b.name} integrate with the same tools?`,
      a: shared.length
        ? `${onlyA.length || onlyB.length ? 'Partly. ' : 'Yes. '}Both list ${some(shared)}.${extra ? ` ${extra}.` : ''}`
        : `Their integration lists don't overlap: ${a.name} lists ${some(ia)}; ${b.name} lists ${some(ib)}.`,
    });
  }
  return faq;
}

// ---------- DevHunt facts ----------

export interface DevHuntFacts {
  votes: string | null; // "331 upvotes"
  status: string | null; // "Launched on DevHunt on Apr 15, 2025" / "Listed by DevHunt"
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function devHuntFacts(t: Pick<VerdictTool, 'votes_count' | 'is_reference' | 'launch_start'>, now: Date): DevHuntFacts {
  const votes = t.votes_count > 0 || !t.is_reference ? `${t.votes_count.toLocaleString('en-US')} upvote${t.votes_count === 1 ? '' : 's'}` : null;
  let status: string | null = t.is_reference ? 'Listed by DevHunt' : null;
  if (t.launch_start && !t.is_reference)
    status = new Date(t.launch_start) <= now ? `Launched on DevHunt on ${fmtDate(t.launch_start)}` : `Launching on DevHunt on ${fmtDate(t.launch_start)}`;
  return { votes, status };
}
