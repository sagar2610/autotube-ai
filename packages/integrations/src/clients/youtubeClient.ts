import { createReadStream } from 'node:fs';
import { google } from 'googleapis';
import { withRetry } from '@autotube/shared';

function oauthClient() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirect = process.env.YOUTUBE_REDIRECT_URI ?? 'http://localhost:3000/oauth2callback';
  if (!clientId || !clientSecret) throw new Error('Missing YouTube OAuth env');

  const oauth = new google.auth.OAuth2(clientId, clientSecret, redirect);
  oauth.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  });
  return oauth;
}

export interface UploadInput {
  videoPath: string;
  thumbnailPath?: string;
  title: string;
  description: string;
  tags: string[];
  visibility: 'private' | 'public' | 'unlisted';
  publishAt?: string;
}

export async function uploadYouTubeVideo(input: UploadInput): Promise<Record<string, unknown>> {
  const auth = oauthClient();
  const youtube = google.youtube({ version: 'v3', auth });
  const response = await withRetry(() =>
    youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: { title: input.title, description: input.description, tags: input.tags },
        status: {
          privacyStatus: input.visibility,
          publishAt: input.publishAt,
          selfDeclaredMadeForKids: false,
        },
      },
      media: { body: createReadStream(input.videoPath) },
    }),
  );
  const videoId = response.data.id;
  if (videoId && input.thumbnailPath) {
    await withRetry(() =>
      youtube.thumbnails.set({
        videoId,
        media: { body: createReadStream(input.thumbnailPath) },
      }),
    );
  }
  return response.data as Record<string, unknown>;
}
