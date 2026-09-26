import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';

const baseURL = process.env.TEST_BASE_URL ?? 'http://localhost:3124';
// Created by `pnpm test:login` (you sign in once by hand); logged-in tests are skipped without it.
export const AUTH_STATE = 'tests/e2e/.auth/user.json';
const hasAuth = fs.existsSync(AUTH_STATE);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 1,
  reporter: [['list']],
  // PW_CHANNEL=chrome runs the locally installed Chrome (fresh temporary profile) instead of Playwright's bundled build.
  use: { baseURL, trace: 'retain-on-failure', channel: process.env.PW_CHANNEL },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL }, testIgnore: /logged-in|login\.setup|mobile\.spec/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: process.env.PW_CHANNEL }, testMatch: /mobile\.spec/ },
    {
      name: 'logged-in',
      use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL, storageState: hasAuth ? AUTH_STATE : undefined },
      testMatch: /logged-in\.spec/,
    },
    { name: 'login-setup', testMatch: /login\.setup/, use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL, headless: false } },
  ],
});
