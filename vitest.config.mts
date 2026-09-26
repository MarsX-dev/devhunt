import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { testEnv } from './tests/env';

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(root) },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/api/**/*.test.ts'],
    // Only expose what the tests use; real shell env vars still win.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: testEnv('NEXT_PUBLIC_SUPABASE_URL') ?? '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: testEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ?? '',
    },
    testTimeout: 60_000,
  },
});
