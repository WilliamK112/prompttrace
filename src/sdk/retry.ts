export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { maxRetries?: number; baseDelayMs?: number }
): Promise<{ result: T; retries: { count: number; delaysMs: number[] } }> {
  const maxRetries = opts?.maxRetries ?? 2;
  const baseDelayMs = opts?.baseDelayMs ?? 500;
  const delaysMs: number[] = [];

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const result = await fn();
      return { result, retries: { count: attempt, delaysMs } };
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      delaysMs.push(delay);
      await new Promise((r) => setTimeout(r, delay));
      attempt += 1;
    }
  }
}
