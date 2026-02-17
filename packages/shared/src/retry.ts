export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 4, baseMs = 400): Promise<T> {
  let err: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      err = error;
      if (attempt === maxAttempts) break;
      const sleepMs = baseMs * 2 ** (attempt - 1) + Math.round(Math.random() * 120);
      await new Promise((resolve) => setTimeout(resolve, sleepMs));
    }
  }
  throw err;
}
