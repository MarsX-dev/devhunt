// Free and open-source alternatives to well-known paid dev tools (/free-alternatives), curated by hand.
// "Free" here means really free: open source and free to self-host, or a fully free product. A free tier of a
// paid product doesn't count (almost every tool has one). Licenses were checked against each project's LICENSE
// file on CHECKED; re-check before adding a row. Every slug is a DevHunt listing; rows render only the tools
// that exist, and a tool page needs at least MIN_ALTERNATIVES of them. "(core)": open-core, with paid enterprise
// code in separate folders.

export const CHECKED = '2026-10-01';
export const MIN_ALTERNATIVES = 2;

export type FreeKind = 'oss' | 'source-available' | 'free';

export const FREE_KIND_LABEL: Record<FreeKind, string> = {
  oss: 'Open source',
  'source-available': 'Free to self-host',
  free: 'Free',
};

export interface FreeAlternative {
  slug: string;
  kind: FreeKind;
  license?: string; // SPDX id or license name
  note?: string; // one honest line: what it is and the catch, if any
}

export interface FreeAlternativeRow {
  slug: string; // the well-known paid tool (a reference listing)
  group: string;
  alternatives: FreeAlternative[];
}

export const FREE_ALTERNATIVES: FreeAlternativeRow[] = [
  {
    slug: 'cursor',
    group: 'AI coding',
    alternatives: [
      { slug: 'cline', kind: 'oss', license: 'Apache-2.0', note: 'Coding agent for VS Code; bring your own model key.' },
      { slug: 'zed', kind: 'oss', license: 'GPL-3.0 / AGPL-3.0', note: 'Fast open-source editor with AI built in; hosted AI has paid plans.' },
    ],
  },
  {
    slug: 'github-copilot',
    group: 'AI coding',
    alternatives: [
      { slug: 'tabby-ml', kind: 'oss', license: 'Apache-2.0 (core)', note: 'Self-hosted code completion server.' },
      { slug: 'cline', kind: 'oss', license: 'Apache-2.0', note: 'Agent in VS Code; you pay only for the model you use.' },
    ],
  },
  {
    slug: 'claude-code',
    group: 'AI coding',
    alternatives: [
      { slug: 'opencode', kind: 'oss', license: 'MIT', note: 'Terminal coding agent that works with many models.' },
      { slug: 'aider', kind: 'oss', license: 'Apache-2.0', note: 'AI pair programming in the terminal, git-aware.' },
      { slug: 'gemini-cli', kind: 'oss', license: 'Apache-2.0', note: "Google's open-source terminal agent, with a free usage tier." },
    ],
  },
  {
    slug: 'postman',
    group: 'APIs',
    alternatives: [
      { slug: 'bruno', kind: 'oss', license: 'MIT', note: 'Offline API client; collections live as files in your git repo.' },
      { slug: 'hoppscotch', kind: 'oss', license: 'MIT', note: 'API client in the browser, desktop or self-hosted.' },
      { slug: 'insomnia', kind: 'oss', license: 'Apache-2.0', note: 'Open-source API client by Kong; local storage is free.' },
    ],
  },
  {
    slug: 'algolia',
    group: 'Search',
    alternatives: [
      { slug: 'meilisearch', kind: 'oss', license: 'MIT (core)', note: 'Fast, typo-tolerant search you can self-host.' },
      { slug: 'typesense', kind: 'oss', license: 'GPL-3.0', note: 'In-memory search engine with typo tolerance and vector search.' },
      { slug: 'opensearch', kind: 'oss', license: 'Apache-2.0', note: 'Community fork of Elasticsearch under the Linux Foundation.' },
    ],
  },
  {
    slug: 'elasticsearch',
    group: 'Search',
    alternatives: [
      { slug: 'opensearch', kind: 'oss', license: 'Apache-2.0', note: 'Apache-licensed fork of Elasticsearch 7.10.' },
      { slug: 'meilisearch', kind: 'oss', license: 'MIT (core)', note: 'Simpler search for apps and sites.' },
      { slug: 'typesense', kind: 'oss', license: 'GPL-3.0', note: 'Lightweight search engine with a simple API.' },
    ],
  },
  {
    slug: 'heroku',
    group: 'Hosting',
    alternatives: [
      { slug: 'coolify', kind: 'oss', license: 'Apache-2.0', note: 'Self-hosted Heroku/Netlify alternative on your own server.' },
      { slug: 'dokploy', kind: 'source-available', license: 'Apache-2.0 with extra terms', note: 'Self-hosted PaaS with Docker and Traefik.' },
      { slug: 'caprover', kind: 'oss', license: 'Apache-2.0 (core)', note: 'Self-hosted PaaS; one-click apps on your own VPS.' },
    ],
  },
  {
    slug: 'vercel',
    group: 'Hosting',
    alternatives: [
      { slug: 'coolify', kind: 'oss', license: 'Apache-2.0', note: 'Deploy Next.js and other apps on your own server.' },
      { slug: 'dokploy', kind: 'source-available', license: 'Apache-2.0 with extra terms', note: 'Self-hosted deploys with previews.' },
    ],
  },
  {
    slug: 'firebase',
    group: 'Backend',
    alternatives: [
      { slug: 'supabase', kind: 'oss', license: 'Apache-2.0', note: 'Postgres backend with auth, storage and realtime; self-hostable.' },
      { slug: 'appwrite', kind: 'oss', license: 'BSD-3-Clause', note: 'Backend server for web and mobile apps.' },
      { slug: 'pocketbase', kind: 'oss', license: 'MIT', note: 'Backend in one Go binary with SQLite.' },
    ],
  },
  {
    slug: 'auth0',
    group: 'Auth',
    alternatives: [
      { slug: 'keycloak', kind: 'oss', license: 'Apache-2.0', note: 'Identity and access management server (CNCF).' },
      { slug: 'supertokens', kind: 'oss', license: 'Apache-2.0 (core)', note: 'Self-hosted auth with prebuilt UI.' },
      { slug: 'zitadel', kind: 'oss', license: 'AGPL-3.0', note: 'Identity platform with multi-tenancy.' },
      { slug: 'better-auth', kind: 'oss', license: 'MIT', note: 'TypeScript auth library that runs in your app.' },
    ],
  },
  {
    slug: 'contentful',
    group: 'CMS',
    alternatives: [
      { slug: 'strapi', kind: 'oss', license: 'MIT (core)', note: 'Headless CMS for Node.js; the Community Edition is free.' },
      { slug: 'payload', kind: 'oss', license: 'MIT', note: 'Code-first headless CMS for Next.js.' },
      { slug: 'directus', kind: 'source-available', license: 'MSCL-1.0-GPL', note: 'Data platform and headless CMS on any SQL database; check the license for commercial use.' },
    ],
  },
  {
    slug: 'datadog',
    group: 'Monitoring',
    alternatives: [
      { slug: 'grafana', kind: 'oss', license: 'AGPL-3.0', note: 'Dashboards and alerting; pairs with Prometheus and Loki.' },
      { slug: 'signoz', kind: 'oss', license: 'MIT (core)', note: 'OpenTelemetry-native logs, metrics and traces.' },
      { slug: 'openobserve', kind: 'oss', license: 'AGPL-3.0', note: 'Logs, metrics and traces with cheap storage.' },
    ],
  },
  {
    slug: 'sentryio',
    group: 'Monitoring',
    alternatives: [
      { slug: 'glitchtip', kind: 'oss', license: 'MIT', note: 'Error tracking that accepts Sentry SDKs.' },
      { slug: 'signoz', kind: 'oss', license: 'MIT (core)', note: 'Exceptions alongside traces and logs.' },
    ],
  },
  {
    slug: 'mixpanel',
    group: 'Analytics',
    alternatives: [
      { slug: 'posthog', kind: 'oss', license: 'MIT (core)', note: 'Product analytics, session replay and flags; self-hostable.' },
      { slug: 'openpanel', kind: 'oss', license: 'AGPL-3.0', note: 'Open-source Mixpanel alternative.' },
    ],
  },
  {
    slug: 'amplitude',
    group: 'Analytics',
    alternatives: [
      { slug: 'posthog', kind: 'oss', license: 'MIT (core)', note: 'Funnels, retention and replay in one tool.' },
      { slug: 'openpanel', kind: 'oss', license: 'AGPL-3.0', note: 'Events, funnels and retention, self-hosted.' },
    ],
  },
  {
    slug: 'zapier',
    group: 'Automation',
    alternatives: [
      { slug: 'n8n', kind: 'source-available', license: 'Sustainable Use License', note: 'Free to self-host for internal use.' },
      { slug: 'activepieces', kind: 'oss', license: 'MIT (community)', note: 'Open-source Zapier alternative with AI steps.' },
      { slug: 'windmill', kind: 'oss', license: 'AGPL-3.0 (core)', note: 'Scripts, flows and apps for developers.' },
    ],
  },
  {
    slug: 'make',
    group: 'Automation',
    alternatives: [
      { slug: 'n8n', kind: 'source-available', license: 'Sustainable Use License', note: 'Visual workflows with code when you need it.' },
      { slug: 'activepieces', kind: 'oss', license: 'MIT (community)', note: 'No-code flows, self-hosted.' },
    ],
  },
  {
    slug: 'retool',
    group: 'Internal tools',
    alternatives: [
      { slug: 'appsmith', kind: 'oss', license: 'Apache-2.0', note: 'Build admin panels and dashboards on your data.' },
      { slug: 'tooljet', kind: 'oss', license: 'AGPL-3.0', note: 'Low-code internal tools, self-hostable.' },
      { slug: 'budibase', kind: 'oss', license: 'GPL-3.0 (core)', note: 'Internal apps and forms on any database.' },
    ],
  },
  {
    slug: 'notion',
    group: 'Docs and wikis',
    alternatives: [
      { slug: 'appflowy', kind: 'oss', license: 'AGPL-3.0', note: 'Notion-style workspace that keeps data local.' },
      { slug: 'affine', kind: 'oss', license: 'MIT (community)', note: 'Docs, whiteboards and databases in one.' },
      { slug: 'outline', kind: 'source-available', license: 'BSL-1.1', note: 'Team wiki; free to self-host.' },
    ],
  },
  {
    slug: 'gitbook',
    group: 'Docs and wikis',
    alternatives: [
      { slug: 'docusaurus', kind: 'oss', license: 'MIT', note: 'Docs sites from Markdown, by Meta.' },
      { slug: 'outline', kind: 'source-available', license: 'BSL-1.1', note: 'Internal knowledge base.' },
    ],
  },
  {
    slug: 'docker',
    group: 'DevOps',
    alternatives: [
      { slug: 'podman', kind: 'oss', license: 'Apache-2.0', note: 'Daemonless containers with a Docker-compatible CLI.' },
      { slug: 'colima', kind: 'oss', license: 'MIT', note: 'Container runtime for macOS and Linux, no Docker Desktop needed.' },
    ],
  },
  {
    slug: 'github-actions',
    group: 'DevOps',
    alternatives: [
      { slug: 'woodpecker-ci', kind: 'oss', license: 'Apache-2.0', note: 'Simple self-hosted CI with YAML pipelines.' },
      { slug: 'jenkins', kind: 'oss', license: 'MIT', note: 'The classic self-hosted automation server.' },
    ],
  },
  {
    slug: 'terraform',
    group: 'DevOps',
    alternatives: [
      { slug: 'opentofu', kind: 'oss', license: 'MPL-2.0', note: 'Drop-in, community fork of Terraform (Linux Foundation).' },
      { slug: 'pulumi', kind: 'oss', license: 'Apache-2.0', note: 'Infrastructure as code in TypeScript, Python or Go.' },
    ],
  },
  {
    slug: 'redis',
    group: 'Databases',
    alternatives: [
      { slug: 'valkey', kind: 'oss', license: 'BSD-3-Clause', note: 'Linux Foundation fork of Redis 7.2.' },
      { slug: 'dragonfly-db', kind: 'source-available', license: 'BSL-1.1', note: 'Redis-compatible in-memory store; free to self-host, Apache-2.0 from 2030.' },
    ],
  },
  {
    slug: 'snyk',
    group: 'Security',
    alternatives: [
      { slug: 'semgrep', kind: 'oss', license: 'LGPL-2.1 (CE)', note: 'Static analysis with community rules.' },
      { slug: 'trivy', kind: 'oss', license: 'Apache-2.0', note: 'Scans images, repos and IaC for vulnerabilities.' },
    ],
  },
  {
    slug: 'figma',
    group: 'Design',
    alternatives: [{ slug: 'penpot', kind: 'oss', license: 'MPL-2.0', note: 'Open-source design and prototyping, works with SVG.' }],
  },
];

export const freeAlternativesPath = (slug: string) => `/free-alternatives/${slug}`;

export const rowFor = (slug: string) => FREE_ALTERNATIVES.find(r => r.slug === slug);

export const allFreeSlugs = (): string[] =>
  Array.from(new Set(FREE_ALTERNATIVES.flatMap(r => [r.slug, ...r.alternatives.map(a => a.slug)])));
