// "Featured on DevHunt" badge makers embed on their site (seo-plan.md A8). A plain <a><img></a>, so the
// link to the tool page is in the HTML (the older launch banner is injected by a script).

export type BadgeTheme = 'dark' | 'light';

const SITE = 'https://devhunt.org';
// DevHunt's rocket mark (components/ui/Brand), drawn in a 107x107 box.
const LOGO_MARK =
  'M35.542 30.5714C52.191 15.1556 75.5192 0.0305717 102.985 0L106.809 3.82143C106.84 31.4352 91.7479 54.784 76.3359 71.4299V103.179L72.5191 107H49.6183L46.9235 105.884L39.2977 98.2488L39.2289 98.241L8.69452 67.6696L8.68674 67.6012L1.12211 60.0267L0 57.3214V34.3929L3.81679 30.5714H35.542ZM27.809 38.2143H7.63359V55.7467L10.8241 58.9261C15.97 51.614 21.6472 44.6915 27.809 38.2143ZM47.9389 96.1244L51.145 99.3571H68.664V79.1878C62.1846 85.3399 55.2572 91.0011 47.9389 96.1244ZM76.1182 39.7929C76.7122 42.7755 76.0988 45.8727 74.4121 48.4023H74.4044C72.7183 50.9309 70.0974 52.6851 67.1189 53.2793C64.1404 53.8735 61.0487 53.2587 58.5226 51.5701C55.9972 49.8814 54.245 47.2578 53.6516 44.2757C53.0581 41.2936 53.6721 38.1981 55.3587 35.6691C57.0453 33.1394 59.6663 31.384 62.6453 30.7893C65.6244 30.1945 68.7178 30.8088 71.2443 32.4974C73.7709 34.1861 75.5242 36.8102 76.1182 39.7929Z';
const LOGO_TAIL = 'M22.9008 99.3571V107H0V84.0714H7.63359V99.3571H22.9008Z';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const badgeTheme = (value: string | null | undefined): BadgeTheme => (value === 'light' ? 'light' : 'dark');

// Week winners (rank 1-3 after the launch week) get "#N Dev Tool of the Week"; everyone else "Featured on".
export const badgeLabel = (rank?: number | null) => (rank && rank <= 3 ? `#${rank} Dev Tool of the Week` : 'Featured on');

export function badgeSvg({ rank, theme = 'dark' }: { rank?: number | null; theme?: BadgeTheme }): string {
  const dark = theme === 'dark';
  const bg = dark ? '#0f172a' : '#ffffff';
  const border = dark ? '#334155' : '#cbd5e1';
  const small = dark ? '#94a3b8' : '#475569';
  const big = dark ? '#f8fafc' : '#0f172a';
  const accent = '#f97316';
  const label = esc(badgeLabel(rank).toUpperCase());
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="54" viewBox="0 0 220 54" role="img" aria-label="${esc(
    badgeLabel(rank),
  )} DevHunt">
<rect x="0.5" y="0.5" width="219" height="53" rx="10" fill="${bg}" stroke="${border}"/>
<g transform="translate(13 12) scale(0.28)" fill="${big}"><path fill-rule="evenodd" clip-rule="evenodd" d="${LOGO_MARK}"/><path d="${LOGO_TAIL}"/></g>
<text x="54" y="22" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="9" font-weight="600" letter-spacing="1" fill="${
    rank && rank <= 3 ? accent : small
  }">${label}</text>
<text x="54" y="41" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="19" font-weight="700" fill="${big}">DevHunt</text>
</svg>`;
}

export const badgeImageUrl = (slug: string, theme: BadgeTheme = 'dark') =>
  `${SITE}/badge/${encodeURIComponent(slug)}.svg${theme === 'light' ? '?theme=light' : ''}`;

// The snippet makers paste into their site.
export const badgeHtml = (slug: string, name: string, theme: BadgeTheme = 'dark') =>
  `<a href="${SITE}/tool/${encodeURIComponent(slug)}" target="_blank" title="${esc(name)} on DevHunt"><img src="${badgeImageUrl(
    slug,
    theme,
  )}" alt="${esc(name)} - Featured on DevHunt" width="220" height="54" /></a>`;

export const badgeMarkdown = (slug: string, name: string, theme: BadgeTheme = 'dark') =>
  `[![${name.replace(/[[\]]/g, '')} on DevHunt](${badgeImageUrl(slug, theme)})](${SITE}/tool/${encodeURIComponent(slug)})`;
