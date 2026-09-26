import { test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import { AUTH_STATE } from '../../playwright.config';
import { testEnv } from '../env';

// The only account the test suite may ever sign in as (the owner's designated test account).
const TEST_USER_EMAIL = 'johnrush@filmgrail.com';

// Creates a logged-in browser session for the test account without a password: the service-role key
// generates a one-time magic-link token (no email is sent), which is exchanged for a session and
// written into the same cookie the app uses. The session is saved for the logged-in tests.
test('create a logged-in session for the test account', async ({ page, baseURL }) => {
  const url = testEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = testEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const serviceKey = testEnv('SUPABASE_SERVICE_ROLE_KEY');
  test.skip(!url || !anonKey || !serviceKey, 'Supabase keys missing from .env.local');

  const admin = createClient(url!, serviceKey!, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email: TEST_USER_EMAIL });
  if (linkError || !link.properties?.hashed_token) throw new Error(`generateLink failed: ${linkError?.message}`);

  const client = createClient(url!, anonKey!, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.verifyOtp({ type: 'magiclink', token_hash: link.properties.hashed_token });
  if (error || !data.session) throw new Error(`verifyOtp failed: ${error?.message}`);
  if (data.session.user.email !== TEST_USER_EMAIL) throw new Error('Refusing: session is not for the test account');

  // Same shape @supabase/auth-helpers stores: [access_token, refresh_token, provider_token, provider_refresh_token, factors].
  const projectRef = new URL(url!).hostname.split('.')[0];
  const value = encodeURIComponent(JSON.stringify([data.session.access_token, data.session.refresh_token, null, null, null]));
  const { hostname, protocol } = new URL(baseURL!);
  await page.context().addCookies([
    { name: `sb-${projectRef}-auth-token`, value, domain: hostname, path: '/', sameSite: 'Lax', secure: protocol === 'https:', httpOnly: false },
  ]);

  // Confirm the app sees us as logged in before saving.
  await page.goto('/account/details');
  await page.getByRole('button', { name: 'save' }).waitFor({ timeout: 30_000 });
  fs.mkdirSync('tests/e2e/.auth', { recursive: true });
  await page.context().storageState({ path: AUTH_STATE });
});
