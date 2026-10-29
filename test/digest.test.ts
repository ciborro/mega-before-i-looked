import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

const dirs: string[] = [];
function runsDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  dirs.push(dir);
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('readNight', () => {
  it('reads 2026-10-28 into one row per job, sorted, bad line counted', () => {
    const night = readNight('runs', '2026-10-28');
    expect(night).toEqual({
      night: '2026-10-28',
      badLines: 1,
      rows: [
        { job: 'digest/render', owner: null, runs: 1, retries: 0, lastStatus: 'ok', lastError: null,
          first: '2026-10-29T05:41:09+01:00', last: '2026-10-29T05:41:09+01:00' },
        { job: 'fixtures/refresh', owner: 'rook', runs: 4, retries: 3, lastStatus: 'ok', lastError: 'upstream 503',
          first: '2026-10-29T01:30:00+01:00', last: '2026-10-29T01:37:00+01:00' },
        { job: 'lane/sync', owner: 'rook', runs: 8, retries: 1, lastStatus: 'ok', lastError: 'lock held',
          first: '2026-10-28T23:00:06+01:00', last: '2026-10-29T05:00:04+01:00' },
        { job: 'notes/backup', owner: 'lane-07', runs: 1, retries: 0, lastStatus: 'fail', lastError: 'quota exceeded',
          first: '2026-10-29T04:00:01+01:00', last: '2026-10-29T04:00:01+01:00' },
        { job: 'rig/rotate-logs', owner: 'lane-07', runs: 1, retries: 0, lastStatus: 'ok', lastError: null,
          first: '2026-10-28T23:00:02+01:00', last: '2026-10-28T23:00:02+01:00' },
      ],
    });
  });

  it('returns null for a night with no file, or a name that is not a night', () => {
    expect(readNight('runs', '1999-01-01')).toBeNull();
    expect(readNight('runs', '../package')).toBeNull();
  });

  it('an empty file is a night where nothing ran', () => {
    expect(readNight(runsDir({ '2026-10-30.jsonl': '' }), '2026-10-30')).toEqual({
      night: '2026-10-30',
      rows: [],
      badLines: 0,
    });
  });

  it('counts lines with the wrong shape as bad, keeps the good ones', () => {
    const lines = [
      '{"at":"2026-10-30T01:00:00+02:00","job":"a","status":"ok","owner":"rook"}',
      '{"at":"2026-10-30T01:00:01+02:00","job":"a","status":"done","owner":"rook"}',
      '{"at":"2026-10-30T01:00:02+02:00","status":"ok","owner":"rook"}',
      '{"at":"2026-10-30T01:00:03+02:00","job":"a","status":"ok"}',
      '[1,2]',
      'null',
      '',
    ];
    const night = readNight(runsDir({ '2026-10-30.jsonl': lines.join('\n') }), '2026-10-30');
    expect(night?.badLines).toBe(5);
    expect(night?.rows.map((r) => [r.job, r.runs, r.first])).toEqual([['a', 1, '2026-10-30T01:00:00+02:00']]);
  });
});
