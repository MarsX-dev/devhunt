// Title and description overrides for SEObot posts that rank near page one but get few clicks (seo-plan.md A9).
// Titles use the words people search (GSC queries, 2026-09-02 to 09-29), and every promise is checked against
// the post's content. Applied to the <title>, meta description, schema and the post's own <h1>.
export const BLOG_SEO: Record<string, { title: string; description: string }> = {
  // "google maps api": 5,419 impressions, position 7.0, 0 clicks
  'google-map-api-for-developers-integration-basics': {
    title: 'Google Maps API: How to Get an API Key, Set Up Billing and Add a Map',
    description:
      'Step-by-step Google Maps API setup for developers: create a Google Cloud project, get and restrict an API key, enable billing and the APIs you need, then add a map with JavaScript.',
  },
  // "online gdb" / "online gdb debugger": ~2,000 impressions, position 6, 3 clicks
  'debug-code-anywhere-with-online-gdb-debuggers': {
    title: 'Online GDB Debugger: Debug C and C++ Code in Your Browser',
    description:
      'How online GDB debuggers work, what they support and how to set breakpoints, step through code and inspect variables from any browser, with no local install.',
  },
  'step-through-code-line-by-line-using-online-gdb': {
    title: 'Online GDB Tutorial: Breakpoints and Stepping Through Code Line by Line',
    description:
      'Use breakpoints, step over and step into in the online GDB debugger to follow your program line by line and inspect variables, with C++ and Python examples.',
  },
  // "safari developer tools" / "safari dev tools": ~800 impressions, position 12-22
  'safari-developer-tools-the-comprehensive-guide-for-web-developers': {
    title: 'Safari Developer Tools: How to Use Web Inspector to Debug Websites',
    description:
      "A guide to Safari's developer tools: open Web Inspector, test layouts in Responsive Design Mode, debug JavaScript and network requests, and inspect pages on iPhone.",
  },
  // "jsonplaceholder": 404 impressions, position 15
  'jsonplaceholder-api-the-easiest-fake-rest-api': {
    title: 'JSONPlaceholder: Free Fake REST API for Testing (Endpoints and Examples)',
    description:
      'What JSONPlaceholder is, its /posts, /users and other endpoints, and how to call it with fetch to prototype and test front ends with fake data.',
  },
  // "github student developer pack" / "github student pack" / "github copilot student": ~800 impressions, position 19-26
  'github-student-pack-essentials': {
    title: "GitHub Student Developer Pack: What's Included, Who's Eligible and How to Apply",
    description:
      'The GitHub Student Developer Pack explained: eligibility, how to apply and verify your student status, free GitHub Copilot for students and the best tools in the pack.',
  },
  // "400 error code in rest api": 162 impressions, position 8
  '400-bad-request-in-rest-apis-how-to-handle-and-prevent': {
    title: '400 Bad Request in REST APIs: Causes, Fixes and How to Prevent It',
    description:
      'What a 400 Bad Request error means in a REST API, the common causes, how to return useful error messages on the server and how to prevent them on the client.',
  },
  // "node readfile" / "readfilesync": ~300 impressions, position 9-14
  'nodejs-readfile-for-beginners': {
    title: 'Node.js readFile and readFileSync: How to Read Files (Beginner Guide)',
    description:
      'Read files in Node.js with fs.readFile and fs.readFileSync: encodings like utf8, error handling, reading line by line and converting file contents to strings and JSON.',
  },
  // "chrome ios developer tools" / "ios dev tools": ~250 impressions, position 7-18
  'discover-dev-tools-for-chrome-on-ios': {
    title: 'Chrome DevTools on iOS: How to Inspect and Debug Pages on iPhone',
    description:
      "What developer tools work for Chrome on iPhone and iPad, how to inspect and debug pages with Safari's developer tools, and the extensions that help.",
  },
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Applies the override to a SEObot post (headline, meta description and the first <h1> in its HTML).
export function withBlogSeo<T extends { headline: string; metaDescription: string; html?: string | null }>(slug: string, post: T): T {
  const o = BLOG_SEO[slug];
  if (!o) return post;
  return {
    ...post,
    headline: o.title,
    metaDescription: o.description,
    html: post.html ? post.html.replace(/<h1([^>]*)>[\s\S]*?<\/h1>/, `<h1$1>${escapeHtml(o.title)}</h1>`) : post.html,
  };
}
