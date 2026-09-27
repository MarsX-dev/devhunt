// Client-safe types and helpers for one-line tool rows and list paging (server code: toolLists.ts, homeData.ts).

// The few fields a one-line tool row needs (see components/ui/ToolRow).
export interface ToolRowData {
  id: number;
  slug: string;
  name: string;
  slogan: string | null;
  logo_url: string | null;
  votes_count: number;
  launch_date: string | null;
  launch_start: string | null;
  launch_end: string | null;
}

export const TOOL_ROW_COLUMNS = 'id, slug, name, slogan, logo_url, votes_count, launch_date, launch_start, launch_end';
export const LIST_PAGE_SIZE = 50;
export const PAST_WINNERS = 30;

export const toToolRow = (p: any): ToolRowData => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  slogan: p.slogan,
  logo_url: p.logo_url,
  votes_count: p.votes_count ?? 0,
  launch_date: p.launch_date ?? null,
  launch_start: p.launch_start ?? null,
  launch_end: p.launch_end ?? null,
});

export const pageFromParam = (value: unknown) => {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 1 ? n : 1;
};
