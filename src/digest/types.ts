// One line of runs/<night>.jsonl, after parsing at the edge.
export type RunStatus = 'ok' | 'retry' | 'fail';

export type RunLine = {
  at: string; // as written in the log, offset kept
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

// One row per job for the night.
export type DigestRow = {
  job: string;
  owner: string | null; // owner of the job's last line; null renders as —
  runs: number; // lines for this job, every status
  retries: number; // lines with status "retry"
  lastStatus: RunStatus;
  lastError: string | null; // most recent error seen for this job, null if none
  first: string; // `at` of the job's first line, offset kept
  last: string; // `at` of the job's last line, offset kept
};

export type Night = {
  night: string; // YYYY-MM-DD
  rows: DigestRow[]; // sorted by job; empty when nothing ran
  badLines: number; // lines that didn't parse, counted, never thrown
};

// Reads <runsDir>/<night>.jsonl. Returns null when the night has no file.
export type ReadNight = (runsDir: string, night: string) => Night | null;
