/**
 * Runs `task` and resolves when its result settles OR after `maxMs`, whichever comes first.
 * Never rejects and never throws: a task that throws synchronously, rejects or hangs forever still lets the caller go on.
 *
 * Made for "do this before navigating away" hooks (e.g. sending analytics before a post-login redirect), where the
 * navigation must always happen and must never wait longer than a small, known bound.
 */
export function settleWithin(task: () => unknown, maxMs: number): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, Math.max(0, maxMs));
    try {
      Promise.resolve(task()).then(finish, finish);
    } catch {
      finish();
    }
  });
}
