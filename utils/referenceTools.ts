// Well-known tools DevHunt lists itself (products.is_reference), so category pages aren't missing the tools
// developers expect (Cursor, Claude Code, Codex, Supabase...). Seeded by scripts/seed-reference-tools.ts:
// the website is scraped for the description, logo and screenshot, then a profile is generated.
// Slogans are short and factual; pricing: 1 free, 2 subscription, 3 one-time (the model most people pay with).

export interface ReferenceTool {
  name: string;
  url: string;
  slogan: string;
  pricing: 1 | 2 | 3;
  categories: string[]; // names from utils/categories.ts
  githubUrl?: string;
}

export const REFERENCE_TOOLS: ReferenceTool[] = [
  // AI coding
  { name: 'Cursor', url: 'https://cursor.com', slogan: 'The AI code editor', pricing: 2, categories: ['AI Coding', 'IDE'] },
  {
    name: 'Claude Code',
    url: 'https://www.anthropic.com/claude-code',
    slogan: "Anthropic's agentic coding tool for the terminal and IDE",
    pricing: 2,
    categories: ['AI Coding', 'CLI', 'AI Agents'],
  },
  {
    name: 'OpenAI Codex',
    url: 'https://openai.com/codex/',
    slogan: "OpenAI's coding agent for the terminal, IDE and cloud",
    pricing: 2,
    categories: ['AI Coding', 'AI Agents'],
  },
  {
    name: 'GitHub Copilot',
    url: 'https://github.com/features/copilot',
    slogan: 'AI pair programmer in your editor and on GitHub',
    pricing: 2,
    categories: ['AI Coding'],
  },
  {
    name: 'Windsurf',
    url: 'https://windsurf.com',
    slogan: 'AI-native code editor with an agent built in',
    pricing: 2,
    categories: ['AI Coding', 'IDE'],
  },
  {
    name: 'Cline',
    url: 'https://cline.bot',
    slogan: 'Open-source autonomous coding agent for your IDE',
    pricing: 1,
    categories: ['AI Coding', 'Open Source'],
    githubUrl: 'https://github.com/cline/cline',
  },
  {
    name: 'Aider',
    url: 'https://aider.chat',
    slogan: 'AI pair programming in your terminal',
    pricing: 1,
    categories: ['AI Coding', 'CLI', 'Open Source'],
    githubUrl: 'https://github.com/Aider-AI/aider',
  },
  {
    name: 'Gemini CLI',
    url: 'https://github.com/google-gemini/gemini-cli',
    slogan: "Google's open-source AI agent for the terminal",
    pricing: 1,
    categories: ['AI Coding', 'CLI', 'Open Source'],
    githubUrl: 'https://github.com/google-gemini/gemini-cli',
  },
  { name: 'Devin', url: 'https://devin.ai', slogan: 'Autonomous AI software engineer', pricing: 2, categories: ['AI Coding', 'AI Agents'] },
  {
    name: 'Tabnine',
    url: 'https://www.tabnine.com',
    slogan: 'AI code assistant for teams and enterprises',
    pricing: 2,
    categories: ['AI Coding'],
  },
  {
    name: 'Zed',
    url: 'https://zed.dev',
    slogan: 'High-performance code editor with AI built in',
    pricing: 1,
    categories: ['IDE', 'Open Source', 'AI Coding'],
    githubUrl: 'https://github.com/zed-industries/zed',
  },
  {
    name: 'Lovable',
    url: 'https://lovable.dev',
    slogan: 'Build apps and websites by chatting with AI',
    pricing: 2,
    categories: ['AI Coding', 'NoCode'],
  },
  {
    name: 'Bolt',
    url: 'https://bolt.new',
    slogan: 'Prompt, run, edit and deploy full-stack web apps',
    pricing: 2,
    categories: ['AI Coding', 'NoCode'],
  },
  { name: 'v0', url: 'https://v0.app', slogan: "Vercel's AI app and UI builder", pricing: 2, categories: ['AI Coding', 'Design'] },
  {
    name: 'Replit',
    url: 'https://replit.com',
    slogan: 'Build and deploy software with AI, in the browser',
    pricing: 2,
    categories: ['AI Coding', 'IDE', 'Hosting'],
  },
  // APIs
  {
    name: 'Postman',
    url: 'https://www.postman.com',
    slogan: 'API platform for designing, testing and documenting APIs',
    pricing: 2,
    categories: ['API', 'Testing'],
  },
  {
    name: 'Insomnia',
    url: 'https://insomnia.rest',
    slogan: 'Open-source API client for REST, GraphQL and gRPC',
    pricing: 1,
    categories: ['API', 'Open Source'],
    githubUrl: 'https://github.com/Kong/insomnia',
  },
  {
    name: 'Bruno',
    url: 'https://www.usebruno.com',
    slogan: 'Offline-first, Git-friendly open-source API client',
    pricing: 1,
    categories: ['API', 'Open Source'],
    githubUrl: 'https://github.com/usebruno/bruno',
  },
  // Backends and databases
  {
    name: 'Supabase',
    url: 'https://supabase.com',
    slogan: 'Open-source Postgres development platform',
    pricing: 2,
    categories: ['DB', 'Auth', 'Open Source'],
    githubUrl: 'https://github.com/supabase/supabase',
  },
  {
    name: 'Firebase',
    url: 'https://firebase.google.com',
    slogan: "Google's platform to build and run apps",
    pricing: 2,
    categories: ['DB', 'Auth', 'Hosting'],
  },
  { name: 'Neon', url: 'https://neon.com', slogan: 'Serverless Postgres', pricing: 2, categories: ['DB'] },
  {
    name: 'Appwrite',
    url: 'https://appwrite.io',
    slogan: 'Open-source backend for web and mobile apps',
    pricing: 2,
    categories: ['DB', 'Auth', 'Open Source'],
    githubUrl: 'https://github.com/appwrite/appwrite',
  },
  {
    name: 'PocketBase',
    url: 'https://pocketbase.io',
    slogan: 'Open-source backend in one file',
    pricing: 1,
    categories: ['DB', 'Open Source'],
    githubUrl: 'https://github.com/pocketbase/pocketbase',
  },
  // Hosting and DevOps
  {
    name: 'Vercel',
    url: 'https://vercel.com',
    slogan: 'Frontend cloud to build and deploy web apps',
    pricing: 2,
    categories: ['Hosting', 'DevOps'],
  },
  {
    name: 'Netlify',
    url: 'https://www.netlify.com',
    slogan: 'Platform to build and deploy web projects',
    pricing: 2,
    categories: ['Hosting', 'DevOps'],
  },
  {
    name: 'Railway',
    url: 'https://railway.com',
    slogan: 'Deploy apps, databases and services',
    pricing: 2,
    categories: ['Hosting', 'DevOps'],
  },
  {
    name: 'Render',
    url: 'https://render.com',
    slogan: 'Cloud to build, deploy and scale apps',
    pricing: 2,
    categories: ['Hosting', 'DevOps'],
  },
  { name: 'Fly.io', url: 'https://fly.io', slogan: 'Run full-stack apps close to your users', pricing: 2, categories: ['Hosting'] },
  {
    name: 'Cloudflare Workers',
    url: 'https://workers.cloudflare.com',
    slogan: "Serverless code on Cloudflare's global network",
    pricing: 2,
    categories: ['Hosting'],
  },
  { name: 'Docker', url: 'https://www.docker.com', slogan: 'Build, share and run containers', pricing: 2, categories: ['DevOps'] },
  {
    name: 'GitHub Actions',
    url: 'https://github.com/features/actions',
    slogan: 'CI/CD and automation built into GitHub',
    pricing: 2,
    categories: ['CI', 'DevOps'],
  },
  {
    name: 'Datadog',
    url: 'https://www.datadoghq.com',
    slogan: 'Monitoring and security platform for cloud apps',
    pricing: 2,
    categories: ['Monitoring'],
  },
  // Auth, payments, docs
  { name: 'Auth0', url: 'https://auth0.com', slogan: 'Authentication and authorization platform', pricing: 2, categories: ['Auth'] },
  {
    name: 'Stripe',
    url: 'https://stripe.com',
    slogan: 'Payments infrastructure for the internet',
    pricing: 2,
    categories: ['Payments', 'API'],
  },
  {
    name: 'Notion',
    url: 'https://www.notion.com',
    slogan: 'Connected workspace for docs, wikis and projects',
    pricing: 2,
    categories: ['Docs'],
  },
  // UI
  {
    name: 'shadcn/ui',
    url: 'https://ui.shadcn.com',
    slogan: 'Open-source React components you copy into your app',
    pricing: 1,
    categories: ['UI Library', 'Open Source'],
    githubUrl: 'https://github.com/shadcn-ui/ui',
  },
  {
    name: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    slogan: 'Utility-first CSS framework',
    pricing: 1,
    categories: ['Tailwind CSS', 'Framework', 'Open Source'],
    githubUrl: 'https://github.com/tailwindlabs/tailwindcss',
  },
  // AI agents and automation
  {
    name: 'LangChain',
    url: 'https://www.langchain.com',
    slogan: 'Framework for building LLM apps and agents',
    pricing: 1,
    categories: ['AI Agents', 'Framework', 'Open Source'],
    githubUrl: 'https://github.com/langchain-ai/langchain',
  },
  {
    name: 'CrewAI',
    url: 'https://www.crewai.com',
    slogan: 'Framework and platform for multi-agent AI systems',
    pricing: 2,
    categories: ['AI Agents', 'Open Source'],
    githubUrl: 'https://github.com/crewAIInc/crewAI',
  },
  {
    name: 'n8n',
    url: 'https://n8n.io',
    slogan: 'Workflow automation with AI, cloud or self-hosted',
    pricing: 2,
    categories: ['Workflow automation', 'AI Agents'],
    githubUrl: 'https://github.com/n8n-io/n8n',
  },
  // Analytics
  {
    name: 'PostHog',
    url: 'https://posthog.com',
    slogan: 'Product analytics, session replay and feature flags',
    pricing: 2,
    categories: ['Analytics', 'Open Source'],
    githubUrl: 'https://github.com/PostHog/posthog',
  },
  {
    name: 'Plausible',
    url: 'https://plausible.io',
    slogan: 'Privacy-friendly, open-source web analytics',
    pricing: 2,
    categories: ['Analytics', 'Open Source'],
    githubUrl: 'https://github.com/plausible/analytics',
  },
];
