import { defineConfig } from 'vitest/config';
import fs from 'node:fs';
import path from 'node:path';

// API tests need NEXT_PUBLIC_SUPABASE_*. @next/env skips .env.local when NODE_ENV=test, so read it directly.
function readEnvFile(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return env;
}

const root = import.meta.dirname;
const fileEnv = { ...readEnvFile(path.join(root, '.env')), ...readEnvFile(path.join(root, '.env.local')) };

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(root) },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/api/**/*.test.ts'],
    // Only expose what the tests use; real shell env vars still win.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL ?? '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    testTimeout: 60_000,
  },
});
