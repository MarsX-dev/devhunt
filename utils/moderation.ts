// What happens to a new submission, from JEV's answers (see utils/server/jev.ts moderateSubmission).
export type Moderation = 'ok' | 'not_a_fit' | 'blocked';
export const BANNED_TOPICS = ['crypto', 'gambling', 'adult', 'fraud'] as const;
export type BannedTopic = (typeof BANNED_TOPICS)[number];

export const BLOCK_THRESHOLD = 0.6; // probability of a banned topic
export const NOT_A_FIT_THRESHOLD = 0.35; // "is a developer tool" score below this

export function moderationDecision(input: { devToolScore: number | null; topic: string | null; topicProbability: number | null }): {
  status: Moderation;
  reason: string | null;
} {
  const { devToolScore, topic, topicProbability } = input;
  if (topic && (BANNED_TOPICS as readonly string[]).includes(topic) && (topicProbability ?? 0) >= BLOCK_THRESHOLD) {
    return { status: 'blocked', reason: topic };
  }
  if (devToolScore !== null && devToolScore < NOT_A_FIT_THRESHOLD) return { status: 'not_a_fit', reason: 'not a developer tool' };
  return { status: 'ok', reason: null };
}
