import { join } from 'node:path';
import {
  loadAffiliateConfig,
  loadChannelConfig,
  Logger,
  writeJson,
  writeText,
  type WorkflowState,
} from '@autotube/shared';
import {
  OpenAIClient,
  extractKeywords,
  fetchPexelsAssets,
  fetchUnsplashImage,
  searchSources,
  uploadYouTubeVideo,
} from '@autotube/integrations';
import { assembleVideo, generateCaptions, generateThumbnail } from '@autotube/media';
import { loadPrompt } from './prompts.js';

export async function nodeTopic(state: WorkflowState): Promise<WorkflowState> {
  const topic = state.topic || 'How AI and cloud hyperscalers are reshaping enterprise economics in 2026';
  await writeJson(join(state.outDir, 'topic.json'), { topic });
  return { ...state, topic };
}

export async function nodeResearch(state: WorkflowState): Promise<WorkflowState> {
  const sources = await searchSources(state.topic);
  await writeJson(join(state.outDir, 'sources.json'), sources);
  return { ...state, sources };
}

export async function nodeScript(state: WorkflowState): Promise<WorkflowState> {
  const llm = new OpenAIClient();
  const prompt = await loadPrompt('script', {
    topic: state.topic,
    sources: JSON.stringify(state.sources, null, 2),
  });
  const script = await llm.complete(prompt);
  await writeText(join(state.outDir, 'script.md'), script);
  return { ...state, script };
}

export async function nodeSafety(state: WorkflowState): Promise<WorkflowState> {
  if (!state.script) throw new Error('script missing');
  if (state.sources.length < 3) throw new Error('Safety gate failed: less than 3 sources');
  let revised = state.script
    .replaceAll(/\bguaranteed?\b/gi, 'likely')
    .replaceAll(/\bwill definitely\b/gi, 'may')
    .replaceAll(/\bmedical advice\b/gi, 'general informational content')
    .replaceAll(/\blegal advice\b/gi, 'not legal guidance');
  if (/copyrighted clip|stolen footage/i.test(revised)) {
    revised = revised.replaceAll(/copyrighted clip|stolen footage/gi, 'royalty-free stock footage');
  }
  if (!/not financial advice/i.test(revised)) {
    revised += '\n\nDisclaimer: This video is educational and not financial, medical, or legal advice.';
  }
  await writeText(join(state.outDir, 'script.md'), revised);
  return { ...state, script: revised };
}

export async function nodeStoryboard(state: WorkflowState): Promise<WorkflowState> {
  const script = state.script ?? '';
  const parts = script.split('\n').filter((x) => x.trim().length > 0).slice(0, 12);
  const scenes = parts.map((narration, idx) => ({
    keyword: extractKeywords(narration, 1)[0] ?? state.topic.split(' ')[0],
    narration,
    seconds: idx === parts.length - 1 ? 30 : 45,
  }));
  const storyboard = { scenes };
  await writeJson(join(state.outDir, 'storyboard.json'), storyboard);
  return { ...state, storyboard };
}

export async function nodeSeo(state: WorkflowState): Promise<WorkflowState> {
  const llm = new OpenAIClient();
  const prompt = await loadPrompt('seo', { topic: state.topic, script: state.script ?? '' });
  const response = await llm.complete(prompt);
  const parsed = JSON.parse(response);
  await writeJson(join(state.outDir, 'seo.json'), parsed);
  return { ...state, seo: parsed };
}

export async function nodeAffiliate(state: WorkflowState): Promise<WorkflowState> {
  const config = await loadAffiliateConfig();
  const lines = [config.disclosures, '', ...config.programs.map((p) => `- ${p.name}: ${p.baseUrl}${p.tag ? `?tag=${p.tag}` : ''}`)];
  const md = lines.join('\n');
  await writeText(join(state.outDir, 'affiliate.md'), md);
  return { ...state, affiliateCopy: md };
}

export async function nodeVoiceAndCaptions(state: WorkflowState): Promise<WorkflowState> {
  const llm = new OpenAIClient();
  const voicePath = join(state.outDir, 'voice.mp3');
  await llm.tts(state.script ?? '', voicePath);
  const captionsPath = join(state.outDir, 'captions.srt');
  await generateCaptions(state.script ?? '', voicePath, captionsPath);
  return { ...state, voicePath, captionsPath };
}

export async function nodeAssetsAndVideo(state: WorkflowState): Promise<WorkflowState> {
  const assetsDir = join(state.outDir, 'assets');
  const assets = await fetchPexelsAssets(state.topic, assetsDir, 8);
  const videoPath = join(state.outDir, 'video.mp4');
  await assembleVideo({
    assets: assets.map((a) => a.path),
    audio: state.voicePath ?? '',
    captions: state.captionsPath ?? '',
    output: videoPath,
    tmpListPath: join(state.outDir, 'ffmpeg_assets.txt'),
  });
  return { ...state, assetsDir, videoPath };
}

export async function nodeThumbnail(state: WorkflowState): Promise<WorkflowState> {
  const cfg = await loadChannelConfig();
  const bgPath = join(state.outDir, 'thumb_bg.jpg');
  await fetchUnsplashImage(state.topic, bgPath);
  const thumbnailPath = join(state.outDir, 'thumbnail.png');
  await generateThumbnail(bgPath, thumbnailPath, state.seo?.title ?? state.topic, cfg.thumbnail);
  return { ...state, thumbnailPath };
}

export async function nodeUpload(state: WorkflowState): Promise<WorkflowState> {
  const cfg = await loadChannelConfig();
  const seo = state.seo;
  if (!seo) throw new Error('SEO missing');
  const upload = await uploadYouTubeVideo({
    videoPath: state.videoPath ?? '',
    thumbnailPath: state.thumbnailPath,
    title: seo.title,
    description: `${seo.description}\n\n${state.affiliateCopy ?? ''}`,
    tags: seo.tags,
    visibility: cfg.defaultVisibility,
    publishAt: process.env.YOUTUBE_SCHEDULE_AT,
  });
  await writeJson(join(state.outDir, 'upload_result.json'), upload);
  return { ...state, uploadResult: upload };
}

export function workflowNodes(logger: Logger) {
  return {
    topic: async (state: WorkflowState) => {
      await logger.log('Selecting topic');
      return nodeTopic(state);
    },
    research: async (state: WorkflowState) => {
      await logger.log('Running research');
      return nodeResearch(state);
    },
    script: async (state: WorkflowState) => {
      await logger.log('Generating script');
      return nodeScript(state);
    },
    safety: async (state: WorkflowState) => {
      await logger.log('Applying safety gate');
      return nodeSafety(state);
    },
    storyboard: async (state: WorkflowState) => {
      await logger.log('Building storyboard');
      return nodeStoryboard(state);
    },
    seo: async (state: WorkflowState) => {
      await logger.log('Creating SEO metadata');
      return nodeSeo(state);
    },
    affiliate: async (state: WorkflowState) => {
      await logger.log('Injecting affiliate copy');
      return nodeAffiliate(state);
    },
    voice: async (state: WorkflowState) => {
      await logger.log('Generating voice + captions');
      return nodeVoiceAndCaptions(state);
    },
    media: async (state: WorkflowState) => {
      await logger.log('Building video with FFmpeg');
      return nodeAssetsAndVideo(state);
    },
    thumbnail: async (state: WorkflowState) => {
      await logger.log('Generating thumbnail');
      return nodeThumbnail(state);
    },
    upload: async (state: WorkflowState) => {
      await logger.log('Uploading to YouTube');
      return nodeUpload(state);
    },
  };
}
