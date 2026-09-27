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
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}
