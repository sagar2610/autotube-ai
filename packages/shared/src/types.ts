export interface SourceRecord {
  title: string;
  url: string;
  snippet: string;
  date?: string;
}

export interface ChannelConfig {
  brandName: string;
  niche: string;
  language: string;
  defaultVisibility: 'private' | 'public' | 'unlisted';
  targetDurationMinutes: number;
  hashtagDefaults: string[];
  thumbnail: {
    fontPath?: string;
    textColor: string;
    accentColor: string;
    maxWords: number;
  };
}

export interface AffiliateConfig {
  disclosures: string;
  programs: Array<{ name: string; baseUrl: string; tag?: string }>;
}

export interface WorkflowState {
  runId: string;
  topic: string;
  outDir: string;
  logs: string[];
  sources: SourceRecord[];
  script?: string;
  storyboard?: { scenes: Array<{ keyword: string; narration: string; seconds: number }> };
  seo?: {
    title: string;
    description: string;
    tags: string[];
    hashtags: string[];
    chapters: Array<{ time: string; title: string }>;
  };
  affiliateCopy?: string;
  voicePath?: string;
  captionsPath?: string;
  assetsDir?: string;
  videoPath?: string;
  thumbnailPath?: string;
  uploadResult?: Record<string, unknown>;
}
