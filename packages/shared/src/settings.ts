import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { parse } from 'yaml';
import { z } from 'zod';
import type { AffiliateConfig, ChannelConfig } from './types.js';

loadEnv();

const channelSchema = z.object({
  brandName: z.string(),
  niche: z.string(),
  language: z.string(),
  defaultVisibility: z.enum(['private', 'public', 'unlisted']),
  targetDurationMinutes: z.number(),
  hashtagDefaults: z.array(z.string()),
  thumbnail: z.object({
    fontPath: z.string().optional(),
    textColor: z.string(),
    accentColor: z.string(),
    maxWords: z.number(),
  }),
});

const affiliateSchema = z.object({
  disclosures: z.string(),
  programs: z.array(
    z.object({
      name: z.string(),
      baseUrl: z.string(),
      tag: z.string().optional(),
    }),
  ),
});

export async function loadYaml<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8');
  return parse(raw) as T;
}

export async function loadChannelConfig(repoRoot = process.cwd()): Promise<ChannelConfig> {
  const parsed = await loadYaml<unknown>(join(repoRoot, 'configs/channel.yaml'));
  return channelSchema.parse(parsed);
}

export async function loadAffiliateConfig(repoRoot = process.cwd()): Promise<AffiliateConfig> {
  const parsed = await loadYaml<unknown>(join(repoRoot, 'configs/affiliates.yaml'));
  return affiliateSchema.parse(parsed);
}
