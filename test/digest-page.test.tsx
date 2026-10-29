import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

describe('GET /digest/:night', () => {
  it('renders a night with the lane banner and offsets kept', async () => {
    const res = await createApp(config).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('digest 2026-10-28');
    expect(html).toContain('2026-10-28T23:00:02+01:00');
  });

  it('404s for a night with no file', async () => {
    const res = await createApp(config).request('/digest/1999-01-01');
    expect(res.status).toBe(404);
  });
});
