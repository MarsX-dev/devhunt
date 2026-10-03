// Client-safe types and formatting for the home page's live activity strip.
export interface ActivityEvent {
  type: 'joined' | 'upvoted' | 'commented' | 'listed';
  at: string;
  name: string;
  avatar: string;
  username: string | null;
  tool: string | null;
  slug: string | null;
}

export interface LatestComment {
  name: string;
  avatar: string;
  content: string; // plain text, max 140 characters
  at: string;
  maker?: boolean; // not a comment: the tool's maker (content is empty), for tools with no comments yet
}

export interface RecentActivity {
  events: ActivityEvent[];
  votes_today: Record<string, number>; // product id -> votes in the last 24 hours
  latest_comments: Record<string, LatestComment>; // product id -> newest top-level comment
}

export const activityVerb = { joined: 'joined DevHunt', upvoted: 'upvoted', commented: 'commented on', listed: 'listed' } as const;

export function timeAgo(at: string, now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - Date.parse(at)) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return days < 365 ? `${Math.round(days / 30)}mo ago` : `${Math.round(days / 365)}y ago`;
}
