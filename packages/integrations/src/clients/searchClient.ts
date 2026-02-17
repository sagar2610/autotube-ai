import { withRetry } from '@autotube/shared';
import type { SourceRecord } from '@autotube/shared';

async function tavilySearch(query: string): Promise<SourceRecord[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];
  const body = {
    api_key: key,
    query,
    max_results: 6,
    include_answer: false,
    include_raw_content: false,
  };
  return withRetry(async () => {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Tavily failed: ${res.status}`);
    const json = (await res.json()) as { results?: Array<Record<string, string>> };
    return (json.results ?? []).map((r) => ({
      title: r.title ?? 'Untitled',
      url: r.url ?? '',
      snippet: r.content ?? '',
      date: r.published_date,
    }));
  });
}

async function wikiFallback(query: string): Promise<SourceRecord[]> {
  const search = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1`);
  const json = (await search.json()) as any;
  const top = (json.query?.search ?? []).slice(0, 5);
  return top.map((item: any) => ({
    title: item.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
    snippet: String(item.snippet).replace(/<[^>]+>/g, ''),
    date: new Date().toISOString(),
  }));
}

export async function searchSources(query: string): Promise<SourceRecord[]> {
  const primary = await tavilySearch(query);
  if (primary.length >= 3) return primary;
  return wikiFallback(query);
}
