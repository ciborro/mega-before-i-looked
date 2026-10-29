import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { readNight } from '../src/digest/read.js';

const app = createApp({ adapter: 'x', installed: 'x', beatEverySeconds: 60, runsDir: 'runs' });

describe('GET /api/digest/:night', () => {
  it('returns the night rows in readNight order', async () => {
    const res = await app.request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(readNight('runs', '2026-10-28'));
  });

  it('404s for a night with no file', async () => {
    expect((await app.request('/api/digest/2026-01-01')).status).toBe(404);
    expect((await app.request('/api/digest/nope')).status).toBe(404);
  });
});
