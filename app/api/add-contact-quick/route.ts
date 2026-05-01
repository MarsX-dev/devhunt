import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const BULK_CHUNK_SIZE = 200;

/** Minimal RFC4180-style line parser (handles quoted commas). */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  cells.push(current.trim());
  return cells.map(cell => (cell.length >= 2 && cell.startsWith('"') && cell.endsWith('"') ? cell.slice(1, -1).replace(/""/g, '"') : cell));
}

function parseEmailsFromCsv(content: string): string[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]);
  const emailIdx = header.findIndex(h => {
    const n = h.toLowerCase().trim();
    if (n.includes('@')) return false;
    return n === 'email' || n === 'traits_email' || n.endsWith('.email');
  });
  if (emailIdx === -1) {
    throw new Error(`No email column in CSV header: ${header.join(', ')}`);
  }

  const seen = new Set<string>();
  const emails: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const raw = row[emailIdx]?.trim();
    if (!raw?.includes('@')) continue;
    const lower = raw.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      emails.push(raw);
    }
  }

  return emails;
}

/** Segment sometimes exports one line (or several) of comma-separated emails — no header. */
function parseCommaSeparatedEmails(content: string): string[] {
  const seen = new Set<string>();
  const emails: string[] = [];

  for (const lineChunk of content.split(/\r?\n/)) {
    const line = lineChunk.trim();
    if (!line) continue;

    for (const rawUntrimmed of line.split(',')) {
      const raw = rawUntrimmed.trim();
      if (!raw.includes('@')) continue;
      if (/\s/.test(raw)) continue;
      const lower = raw.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      emails.push(raw);
    }
  }

  return emails;
}

function firstLineLooksLikeKeyedCsv(headerLine: string): boolean {
  const cells = parseCsvLine(headerLine);
  return cells.some(h => {
    const n = h.toLowerCase().trim();
    if (n.includes('@')) return false;
    return n === 'email' || n === 'traits_email' || n.endsWith('.email');
  });
}

function extractEmailsFromExport(content: string): string[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  if (firstLineLooksLikeKeyedCsv(lines[0])) {
    const fromKeyed = parseEmailsFromCsv(content);
    if (fromKeyed.length > 0) return fromKeyed;
  }

  return parseCommaSeparatedEmails(content);
}

const DEFAULT_SEGMENT_BASENAME = 'Segment_Mar 10 ALL_352f1df6-cc08-40d8-93fb-e194695741e6';

async function resolveExportPath(): Promise<string> {
  if (process.env.SEGMENT_CONTACTS_CSV_PATH) {
    return process.env.SEGMENT_CONTACTS_CSV_PATH;
  }

  const home = process.env.HOME ?? '';
  const candidates = [
    path.join(home, 'Downloads', `${DEFAULT_SEGMENT_BASENAME}.txt`),
    path.join(home, 'Downloads', `${DEFAULT_SEGMENT_BASENAME}.csv`),
  ];

  for (const p of candidates) {
    try {
      await fs.access(p);
      return p;
    } catch {
      // try next
    }
  }

  throw new Error(`Segment export not found. Tried: ${candidates.join(' | ')}. Set SEGMENT_CONTACTS_CSV_PATH.`);
}

export async function GET() {
  let items: { email: string }[];

  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not allowed in production' });
  }

  try {
    const filePath = await resolveExportPath();
    const content = await fs.readFile(filePath, 'utf8');
    const emails = extractEmailsFromExport(content);
    items = emails.map(email => ({ email }));
    if (items.length === 0) {
      return NextResponse.json({ error: 'No emails found in export file', path: filePath }, { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: message,
        hint: `Set SEGMENT_CONTACTS_CSV_PATH to your file path (${DEFAULT_SEGMENT_BASENAME}.txt is what Segment exported here, not .csv).`,
      },
      { status: 400 },
    );
  }

  const auth = process.env.MARSX_MAILER_AUTH;

  let chunksSent = 0;
  for (let offset = 0; offset < items.length; offset += BULK_CHUNK_SIZE) {
    const chunk = items.slice(offset, offset + BULK_CHUNK_SIZE);
    await axios.post(
      `https://xuqkmyeuqfvucdo6gupjh7x6df8ohj6b.saasemailer.com/api/v1/devhunt.org/contacts/bulk`,
      {
        audienceId: '69f455ab8aee3505f37b2c29',
        items: chunk,
      },
      {
        headers: {
          'mars-authorization': auth,
        },
      },
    );
    chunksSent++;
  }

  return NextResponse.json({
    ok: true,
    totalContacts: items.length,
    chunksSent,
  });
}
