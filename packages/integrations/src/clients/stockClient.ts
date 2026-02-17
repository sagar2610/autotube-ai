import { mkdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { withRetry } from '@autotube/shared';

export interface StockAsset {
  path: string;
  sourceUrl: string;
  author?: string;
}

async function download(url: string, outPath: string): Promise<void> {
  await withRetry(async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download failed ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(outPath, buf);
  });
}

export async function fetchPexelsAssets(keyword: string, outDir: string, count = 6): Promise<StockAsset[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) throw new Error('PEXELS_API_KEY missing');
  await mkdir(outDir, { recursive: true });

  const res = await withRetry(async () =>
    fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(keyword)}&per_page=${count}`, {
      headers: { Authorization: apiKey },
    }),
  );
  if (!res.ok) throw new Error(`Pexels request failed ${res.status}`);
  const json = (await res.json()) as any;
  const videos = (json.videos ?? []).slice(0, count);
  const assets: StockAsset[] = [];
  for (const [index, video] of videos.entries()) {
    const file = (video.video_files ?? []).find((f: any) => f.quality === 'sd') ?? video.video_files?.[0];
    if (!file?.link) continue;
    const outPath = join(outDir, `${index}_${basename(new URL(file.link).pathname) || 'clip.mp4'}`);
    await download(file.link, outPath);
    assets.push({ path: outPath, sourceUrl: video.url, author: video.user?.name });
  }
  return assets;
}

export async function fetchUnsplashImage(keyword: string, outPath: string): Promise<string> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) throw new Error('UNSPLASH_ACCESS_KEY missing');
  const res = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(keyword)}&orientation=landscape`, {
    headers: { Authorization: `Client-ID ${key}` },
  });
  if (!res.ok) throw new Error(`Unsplash failed ${res.status}`);
  const json = (await res.json()) as any;
  await download(json.urls.regular, outPath);
  return outPath;
}
