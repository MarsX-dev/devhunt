// Run with `npm test` (Node's built-in test runner; Node 22.18+ runs the .ts module without a build step).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDemoEmbed, extractDemoUrl, DEMO_PROVIDERS_LABEL } from './demoEmbed.ts';

const embedOf = input => resolveDemoEmbed(input)?.embedUrl ?? null;

test('Arcade share links and embed srcs', () => {
  assert.equal(embedOf('https://app.arcade.software/share/AbC123xyz'), 'https://demo.arcade.software/AbC123xyz?embed');
  assert.equal(embedOf('https://demo.arcade.software/share/AbC123xyz'), 'https://demo.arcade.software/AbC123xyz?embed');
  assert.equal(embedOf('https://demo.arcade.software/AbC123xyz?embed&show_copy_link=true'), 'https://demo.arcade.software/AbC123xyz?embed');
  assert.equal(resolveDemoEmbed('https://app.arcade.software/share/AbC123xyz')?.shareUrl, 'https://app.arcade.software/share/AbC123xyz');
  // The dashboard host's single-segment paths are app pages, not demos.
  assert.equal(embedOf('https://app.arcade.software/settings'), null);
  assert.equal(embedOf('https://demo.arcade.software/share'), null);
});

test('AtriumKit demos and collections', () => {
  assert.equal(embedOf('https://atriumkit.com/d/ledgerly-tour'), 'https://atriumkit.com/embed/ledgerly-tour');
  assert.equal(embedOf('https://atriumkit.com/d/ledgerly-tour/send-an-invoice'), 'https://atriumkit.com/embed/ledgerly-tour');
  assert.equal(embedOf('https://atriumkit.com/embed/ledgerly-tour'), 'https://atriumkit.com/embed/ledgerly-tour');
  assert.equal(embedOf('https://www.atriumkit.com/d/ledgerly-tour'), 'https://atriumkit.com/embed/ledgerly-tour');
  assert.equal(embedOf('https://atriumkit.com/c/onboarding'), 'https://atriumkit.com/embed/c/onboarding');
  assert.equal(embedOf('https://atriumkit.com/c/onboarding/getting-started'), 'https://atriumkit.com/embed/c/onboarding');
  assert.equal(embedOf('https://atriumkit.com/embed/c/onboarding'), 'https://atriumkit.com/embed/c/onboarding');
  assert.equal(resolveDemoEmbed('https://atriumkit.com/embed/ledgerly-tour')?.shareUrl, 'https://atriumkit.com/d/ledgerly-tour');
  assert.equal(resolveDemoEmbed('https://atriumkit.com/embed/c/onboarding')?.shareUrl, 'https://atriumkit.com/c/onboarding');
  // Guides, videos, the dashboard and the marketing site aren't embeddable demos.
  assert.equal(embedOf('https://atriumkit.com/g/ledgerly-tour'), null);
  assert.equal(embedOf('https://atriumkit.com/v/ledgerly-tour'), null);
  assert.equal(embedOf('https://atriumkit.com/pricing'), null);
  assert.equal(embedOf('https://app.atriumkit.com/demos/123'), null);
  assert.equal(embedOf('https://atriumkit.com/embed/c'), null);
});

test('AtriumKit keeps player options and drops tokens, personal links and bad values', () => {
  assert.equal(
    embedOf('https://atriumkit.com/embed/ledgerly-tour?mode=guided&progress=1&brand=0&lang=de&sound=0&captions=1&start=3'),
    'https://atriumkit.com/embed/ledgerly-tour?mode=guided&progress=1&brand=0&start=3&lang=de&sound=0&captions=1',
  );
  assert.equal(embedOf('https://atriumkit.com/d/ledgerly-tour?t=secret&p=abc123'), 'https://atriumkit.com/embed/ledgerly-tour');
  assert.equal(
    embedOf('https://atriumkit.com/d/ledgerly-tour?mode=evil&lang=%22%3E%3Cscript%3E'),
    'https://atriumkit.com/embed/ledgerly-tour',
  );
  assert.equal(
    embedOf('https://atriumkit.com/c/onboarding?item=e1&mode=guided&t=secret'),
    'https://atriumkit.com/embed/c/onboarding?item=e1',
  );
});

test('Navattic', () => {
  assert.equal(embedOf('https://capture.navattic.com/clx1a2b3c'), 'https://capture.navattic.com/clx1a2b3c');
  assert.equal(resolveDemoEmbed('https://capture.navattic.com/clx1a2b3c')?.aspectRatio, '16 / 10');
  assert.equal(embedOf('https://capture.navattic.com/a/b'), null);
});

test('Storylane', () => {
  assert.equal(embedOf('https://app.storylane.io/share/lz5nt4v8npi8'), 'https://app.storylane.io/demo/lz5nt4v8npi8?embed=inline');
  assert.equal(
    embedOf('https://app.storylane.io/demo/lz5nt4v8npi8?embed=inline'),
    'https://app.storylane.io/demo/lz5nt4v8npi8?embed=inline',
  );
  assert.equal(resolveDemoEmbed('https://app.storylane.io/demo/lz5nt4v8npi8')?.shareUrl, 'https://app.storylane.io/share/lz5nt4v8npi8');
});

test('Supademo', () => {
  assert.equal(
    embedOf('https://app.supademo.com/demo/cmaf8gaqy033910sn0xydgeih'),
    'https://app.supademo.com/embed/cmaf8gaqy033910sn0xydgeih',
  );
  assert.equal(
    embedOf('https://app.supademo.com/embed/cmaf8gaqy033910sn0xydgeih?v_name=x'),
    'https://app.supademo.com/embed/cmaf8gaqy033910sn0xydgeih',
  );
});

test('accepts pasted embed code, missing schemes, http and trailing slashes', () => {
  const arcadeSnippet = `<div style="position: relative; padding-bottom: calc(56.25% + 41px); height: 0; width: 100%;">
    <iframe src="https://demo.arcade.software/AbC123xyz?embed&amp;show_copy_link=true" title="Demo" frameborder="0" loading="lazy" allowfullscreen allow="clipboard-write"></iframe></div>`;
  assert.equal(embedOf(arcadeSnippet), 'https://demo.arcade.software/AbC123xyz?embed');
  assert.equal(extractDemoUrl(arcadeSnippet), 'https://demo.arcade.software/AbC123xyz?embed&show_copy_link=true');
  assert.equal(
    embedOf(
      `<script async src="https://js.storylane.io/js/v2/storylane.js"></script><iframe class='sl-demo' src='https://app.storylane.io/demo/lz5nt4v8npi8?embed=inline' allowfullscreen></iframe>`,
    ),
    'https://app.storylane.io/demo/lz5nt4v8npi8?embed=inline',
  );
  assert.equal(embedOf('  app.supademo.com/demo/abc123  '), 'https://app.supademo.com/embed/abc123');
  assert.equal(embedOf('http://capture.navattic.com/clx1a2b3c/'), 'https://capture.navattic.com/clx1a2b3c');
  assert.equal(embedOf('HTTPS://APP.STORYLANE.IO/share/abc123'), 'https://app.storylane.io/demo/abc123?embed=inline');
});

test('sourceUrl is what gets stored', () => {
  assert.equal(resolveDemoEmbed('app.supademo.com/demo/abc123')?.sourceUrl, 'https://app.supademo.com/demo/abc123');
  assert.equal(
    resolveDemoEmbed('<iframe src="https://atriumkit.com/embed/ledgerly-tour?lang=de"></iframe>')?.sourceUrl,
    'https://atriumkit.com/embed/ledgerly-tour?lang=de',
  );
});

test('rejects anything that is not a supported demo', () => {
  for (const input of [
    null,
    undefined,
    '',
    '   ',
    'not a url',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://example.com/share/abc',
    // Lookalike and nested hosts
    'https://evilarcade.software/share/abc',
    'https://arcade.software.evil.com/share/abc',
    'https://app.arcade.software.evil.com/share/abc',
    'https://atriumkit.com.evil.com/d/abc',
    'https://evil.com/?https://atriumkit.com/d/abc',
    // Credentials, ports and other schemes
    'https://atriumkit.com@evil.com/d/abc',
    'https://user:pass@atriumkit.com/d/abc',
    'https://atriumkit.com:8443/d/abc',
    'javascript:alert(1)//atriumkit.com/d/abc',
    'data:text/html,<script>alert(1)</script>',
    'ftp://capture.navattic.com/abc',
    // Ids that would change the rebuilt URL
    'https://atriumkit.com/d/..%2F..%2Fpricing',
    'https://capture.navattic.com/abc%22onload%3D',
    'https://app.supademo.com/demo/abc"onload="x',
    // Snippets whose src points elsewhere
    '<iframe src="https://evil.com/embed/abc"></iframe>',
    '<iframe data-src="https://atriumkit.com/embed/abc" src="https://evil.com/x"></iframe>',
  ]) {
    assert.equal(resolveDemoEmbed(input), null, `expected null for ${JSON.stringify(input)}`);
  }
});

test('provider label lists providers alphabetically', () => {
  assert.equal(DEMO_PROVIDERS_LABEL, 'Arcade, AtriumKit, Navattic, Storylane or Supademo');
});
