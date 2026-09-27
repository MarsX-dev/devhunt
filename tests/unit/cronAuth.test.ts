import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAuthorizedCron } from '@/utils/cronAuth';

const req = (authorization?: string) => new Request('https://devhunt.org/api/x', { headers: authorization ? { authorization } : {} });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isAuthorizedCron', () => {
  it('rejects everything when no secret is configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MARSX_MAILER_AUTH', '');
    vi.stubEnv('CRON_SECRET', '');
    expect(isAuthorizedCron(req('Bearer anything'))).toBe(false);
  });

  it('accepts only the exact bearer token', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MARSX_MAILER_AUTH', 's3cret');
    expect(isAuthorizedCron(req('Bearer s3cret'))).toBe(true);
    expect(isAuthorizedCron(req('Bearer s3creT'))).toBe(false);
    expect(isAuthorizedCron(req('Bearer s3cret-longer'))).toBe(false);
    expect(isAuthorizedCron(req('s3cret'))).toBe(false);
    expect(isAuthorizedCron(req())).toBe(false);
  });

  it("accepts Vercel Cron's CRON_SECRET too", () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MARSX_MAILER_AUTH', 's3cret');
    vi.stubEnv('CRON_SECRET', 'vercel-cron');
    expect(isAuthorizedCron(req('Bearer vercel-cron'))).toBe(true);
    expect(isAuthorizedCron(req('Bearer s3cret'))).toBe(true);
    expect(isAuthorizedCron(req('Bearer other'))).toBe(false);
  });

  it('allows local development without a token', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(isAuthorizedCron(req())).toBe(true);
  });
});
