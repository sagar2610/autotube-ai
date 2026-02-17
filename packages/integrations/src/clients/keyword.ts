export function extractKeywords(text: string, max = 10): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4);

  const stop = new Set(['about', 'their', 'there', 'which', 'could', 'should', 'would', 'these']);
  const freq = new Map<string, number>();
  for (const word of words) {
    if (stop.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}
