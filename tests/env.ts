import fs from 'node:fs';
import path from 'node:path';

// Reads .env and .env.local like Next does (shell env vars still win). @next/env skips .env.local when
// NODE_ENV=test, so the test setups use this instead.
export function readEnvFile(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return env;
}

// Tests always run from the repo root.
const root = process.cwd();
const fileEnv = { ...readEnvFile(path.join(root, '.env')), ...readEnvFile(path.join(root, '.env.local')) };

export const testEnv = (name: string): string | undefined => process.env[name] ?? fileEnv[name];
