import { describe, expect, it } from 'vitest';
import { commentDecision, isLinkDrop, moderationDecision, templateRepeats } from '@/utils/moderation';

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

describe('comment moderation', () => {
  const ok = { isOwner: false, repeats: 0, linkDrop: false, spamProbability: 0, choice: 'genuine' };

  it('lets useless but harmless comments through', () => {
    for (const text of ['🔥', 'cool product', 'nice', 'Congrats on the launch!', 'Great project. Supported. Good luck with the launch']) {
      expect(isLinkDrop(text)).toBe(false);
      expect(commentDecision({ ...ok, linkDrop: isLinkDrop(text) }).status).toBe('ok');
    }
    // the same short praise on many tools is not a spam template
    const praise = 'Great project. Supported. Good luck with the launch';
    expect(templateRepeats(praise, 'Tool C', [{ content: praise, toolName: 'Tool A' }, { content: praise, toolName: 'Tool B' }])).toBe(0);
  });

  it('spots a bare link or email drop, but not a real comment with a link', () => {
    expect(isLinkDrop('https://pro.klingai.com/h5-app/share?work_id=309105879667641')).toBe(true);
    expect(isLinkDrop('1309nirmal@gmail.com')).toBe(true);
    expect(isLinkDrop('Correct link: https://cakeadmin.com')).toBe(false);
    expect(isLinkDrop('is it a copy of https://coolors.co/ ?')).toBe(false);
    expect(isLinkDrop('I tried it on the local setup of https://perceptinsight.com and it worked quite well')).toBe(false);
  });

  it('counts a copy-pasted template even when the tool name changes', () => {
    const pitch = (tool: string) =>
      `${tool} Your product has strong potential, but I found a few key improvements that could make it even better. I'd love to share my feedback and suggestions—please contact me at contact@rforrank.com`;
    const previous = [
      { content: pitch('Daytona'), toolName: 'Daytona' },
      { content: pitch('Offsend Browser Extension'), toolName: 'Offsend Browser Extension' },
      { content: 'Nice tool, how does it compare to Vercel?', toolName: 'Other' },
    ];
    expect(templateRepeats(pitch('MCP Bridge'), 'MCP Bridge', previous)).toBe(2);
    expect(commentDecision({ ...ok, repeats: 2 })).toEqual({ status: 'shadow', reason: 'template' });
    expect(commentDecision({ ...ok, repeats: 1 }).status).toBe('ok');
  });

  it('shadow-blocks only confident JEV verdicts, and never the tool owner', () => {
    expect(commentDecision({ ...ok, spamProbability: 0.95, choice: 'scam' })).toEqual({ status: 'shadow', reason: 'scam' });
    expect(commentDecision({ ...ok, spamProbability: 0.79, choice: 'spam' }).status).toBe('ok');
    expect(commentDecision({ ...ok, spamProbability: null, choice: null }).status).toBe('ok'); // JEV down: never block
    expect(commentDecision({ ...ok, isOwner: true, linkDrop: true, spamProbability: 1, repeats: 5 }).status).toBe('ok');
  });
});
