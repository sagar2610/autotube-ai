import { describe, expect, it } from 'vitest';
import { nodeSafety } from './nodes.js';

describe('safety node', () => {
  it('hedges hard claims', async () => {
    const out = await nodeSafety({
      runId: 'x',
      topic: 't',
      outDir: 'out/test',
      logs: [],
      sources: [
        { title: 'a', url: 'u', snippet: 's' },
        { title: 'b', url: 'u', snippet: 's' },
        { title: 'c', url: 'u', snippet: 's' },
      ],
      script: 'This is guaranteed and will definitely happen.',
    });
    expect(out.script).toContain('likely');
    expect(out.script).toContain('may');
  });
});
