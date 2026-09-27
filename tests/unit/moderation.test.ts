import { describe, expect, it } from 'vitest';
import { moderationDecision } from '@/utils/moderation';

describe('moderationDecision', () => {
  it('blocks banned topics only when JEV is confident', () => {
    expect(moderationDecision({ devToolScore: 0.9, topic: 'crypto', topicProbability: 0.85 })).toEqual({ status: 'blocked', reason: 'crypto' });
    expect(moderationDecision({ devToolScore: 0.9, topic: 'gambling', topicProbability: 0.4 }).status).toBe('ok');
  });
  it('marks non-dev tools as not a fit', () => {
    expect(moderationDecision({ devToolScore: 0.1, topic: 'none', topicProbability: 0.9 })).toEqual({ status: 'not_a_fit', reason: 'not a developer tool' });
  });
  it('lets dev tools through, and everything through when JEV is unavailable', () => {
    expect(moderationDecision({ devToolScore: 0.8, topic: 'none', topicProbability: 0.95 }).status).toBe('ok');
    expect(moderationDecision({ devToolScore: null, topic: null, topicProbability: null }).status).toBe('ok');
  });
});
