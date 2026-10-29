import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

let dir: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, '2026-10-28.jsonl'),
    [
      '{"at":"2026-10-28T23:00:02+01:00","job":"lane/sync","status":"ok","owner":"rook"}',
      '{"at":"2026-10-29T00:00:04+01:00","job":"lane/sync","status":"retry","owner":"rook"}',
    ].join('\n') + '\n',
  );
  writeFileSync(join(dir, '2026-10-27.jsonl'), '');
  writeFileSync(
    join(dir, '2026-10-26.jsonl'),
    '{"at":"2026-10-26T23:00:00+01:00","job":"a/b","status":"ok","owner":null}\nnot json\n',
  );
  app = createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: dir });
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('GET /digest/:night', () => {
  it('200: renders the night with offsets kept', async () => {
    const res = await app.request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('digest 2026-10-28');
    expect(html).toContain('lane/sync');
    expect(html).toContain('2026-10-28T23:00:02+01:00');
  });

  it('404: night with no file', async () => {
    expect((await app.request('/digest/1999-01-01')).status).toBe(404);
  });

  it('200: empty night renders without rows', async () => {
    const res = await app.request('/digest/2026-10-27');
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('lane/sync');
  });

  it('200: bad line does not hide good rows', async () => {
    const res = await app.request('/digest/2026-10-26');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('a/b');
  });
});

describe('GET /api/digest/:night', () => {
  it('200: folds a night into one row per job', async () => {
    const res = await app.request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      night: '2026-10-28',
      badLines: 0,
      rows: [{ job: 'lane/sync', runs: 2, retries: 1, lastStatus: 'retry' }],
    });
  });

  it('404: night with no file or a bad name', async () => {
    expect((await app.request('/api/digest/1999-01-01')).status).toBe(404);
    expect((await app.request('/api/digest/nope')).status).toBe(404);
  });

  it('200: empty night has no rows', async () => {
    const res = await app.request('/api/digest/2026-10-27');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ night: '2026-10-27', rows: [], badLines: 0 });
  });

  it('200: bad line is counted, good rows kept', async () => {
    const res = await app.request('/api/digest/2026-10-26');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ badLines: 1, rows: [{ job: 'a/b', runs: 1 }] });
  });
});
