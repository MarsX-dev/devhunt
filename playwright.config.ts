import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.TEST_BASE_URL ?? 'http://localhost:3124';
// Written by the auth-setup project (login.setup.ts) before the logged-in tests run.
export const AUTH_STATE = 'tests/e2e/.auth/user.json';

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
    // Signs in as the test account automatically (see login.setup.ts); runs before the logged-in tests.
    { name: 'auth-setup', testMatch: /login\.setup/, use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL } },
    {
      name: 'logged-in',
      dependencies: ['auth-setup'],
      use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL, storageState: AUTH_STATE },
      testMatch: /logged-in\.spec/, // includes checkout.logged-in.spec.ts (opt-in)
    },
  ],
});
