import type { Night } from '../digest/types.js';

const dash = '—';

export function DigestPage({ night }: { night: Night }) {
  return (
    <>
      <h1>digest {night.night}</h1>
      {night.badLines > 0 && (
        <p class="warn">{night.badLines} bad line{night.badLines === 1 ? '' : 's'} skipped</p>
      )}
      {night.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th><th>owner</th><th>runs</th><th>retries</th><th>last</th><th>error</th><th>first</th><th>last at</th>
            </tr>
          </thead>
          <tbody>
            {night.rows.map((r) => {
              const flagged = r.retries >= 3 || r.lastStatus === 'fail';
              return (
                <tr class={flagged ? 'warn' : undefined}>
                  <td>{r.job}</td>
                  <td>{r.owner ?? dash}</td>
                  <td>{r.runs}</td>
                  <td>{r.retries >= 3 ? `${r.retries} ⚠` : r.retries}</td>
                  <td>{r.lastStatus === 'fail' ? 'fail ⚠' : r.lastStatus}</td>
                  <td>{r.lastError ?? dash}</td>
                  <td>{r.first || dash}</td>
                  <td>{r.last || dash}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
