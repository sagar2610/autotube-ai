import { describe, expect, it } from 'vitest';
import { withRetry } from './retry.js';

describe('withRetry', () => {
  it('retries until success', async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('fail');
      return 'ok';
    });
    expect(result).toBe('ok');
    expect(attempts).toBe(3);
  });
});
