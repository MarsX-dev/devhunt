// Which programmatic pages (alternatives, comparisons) Google may index. The rest render for visitors
// but are noindex,follow and stay out of the sitemap. Google's scaled-content policy plus indexing
// limits mean we grow these in tested batches (seo-plan.md, section 4), not thousands at once.

// Pilot: the 50 tools with the most Google clicks (GSC, 2026-09-02 to 09-29), hidden tools left out.
// Their alternatives pages and comparisons are indexed regardless of votes.
export const SEO_PILOT_SLUGS = new Set([
  'yt1d', 'camdiv', 'yt1s-youtube-downloader', 'y2down', 'chatmatch', 'ss-youtube-youtube-video-downloader', 'snapwc',
  'dolphin-radar', 'klingvideonowatermarkdownloader', 'temp-mail-365', '4download', 'toolfk', 'instagram-comment-generator-easycomment',
  'dreamyai', 'byviewer', 'tokboostly', 'video-face-swap-supawork-ai-no-sign-up', 'sam-tts', 'kick-twitch-vod-downloader',
  'techloky-apk', 'vidshift', 'getthescript', 'visro-ai-free-online-face-swap-tools-', 'kirkify-face-swap-ai', 'mazterize',
  'steam-calculator', 'snapninja', 'free-chat-llm', 'vidfulai-free-ai-video-generator-online', 'youtubetowav',
  'free-ai-image-generator-imagefreenet', '-tiktokio-tiktok-downloader-', 'free-ai-face-swap', 'dogesms', 'webflow-exporter',
  'youtube-url-extractor', 'namso-gen', '10015io', 'phone-simulator-mobile-emulator-tool', 'next-js-hero-section-template',
  'eurouter', 'vidou', 'lume', 'kutt-ai', 'instagram-comment-exporter-ai-review-summary-easycomment-', 'aivideofaceswap',
  'ai-kissing-video-generator-supawork-ai-free-no-sign-up', 'text-bin', 'java-decompiler-online', 'grsai-',
]);

// Outside the pilot, votes stand in for demand (~250 alternatives pages and ~385 comparisons on 2026-10-01).
export const MIN_ALTERNATIVES_VOTES = 10;
export const MIN_COMPARE_VOTES = 20;

interface IndexTool {
  slug: string;
  votes_count: number;
}

export const alternativesIndexable = (tool: IndexTool) => SEO_PILOT_SLUGS.has(tool.slug) || tool.votes_count >= MIN_ALTERNATIVES_VOTES;

export const compareIndexable = (a: IndexTool, b: IndexTool) =>
  SEO_PILOT_SLUGS.has(a.slug) || SEO_PILOT_SLUGS.has(b.slug) || Math.min(a.votes_count, b.votes_count) >= MIN_COMPARE_VOTES;

// Title test (started 2026-10-01, read after 28 days in GSC: CTR of these pages vs their previous 28 days and
// vs the other pilot tools). Tool pages with many impressions and low CTR get a title that says what this page
// adds over the tool's own site; every other tool keeps "{name} - {slogan}".
// Only tools whose page shows pricing and picked alternatives, so the title is true (11 tools).
export const TITLE_TEST_SLUGS = new Set([
  'toolfk', 'dolphin-radar', 'snapwc', 'instagram-comment-generator-easycomment', 'yt1s-youtube-downloader', 'y2down',
  'ss-youtube-youtube-video-downloader', 'tokboostly', 'video-face-swap-supawork-ai-no-sign-up', 'youtube-url-extractor',
  'phone-simulator-mobile-emulator-tool',
]);

export const toolTitle = (slug: string, name: string, slogan: string | null | undefined) =>
  TITLE_TEST_SLUGS.has(slug)
    ? `${name.replace(/^[^\p{L}\p{N}]+/u, '').trim()}: Features, Pricing & Alternatives (${new Date().getUTCFullYear()})`
    : `${name} - ${slogan}`;
