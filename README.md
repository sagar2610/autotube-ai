# autotube-ai

Production-grade TypeScript monorepo for a **fully automated faceless YouTube content factory**.

## What it does

One command can execute the full pipeline:

1. Topic selection (or `--topic` override)
2. Research + source logging
3. Script generation
4. Safety/quality gate (hedging, policy checks, source count)
5. Storyboard generation
6. SEO package generation (title/description/tags/hashtags/chapters)
7. Affiliate insertion
8. TTS voiceover
9. Caption generation (Whisper CLI if available, fallback heuristic SRT)
10. Stock asset gathering (Pexels + Unsplash)
11. Video assembly via FFmpeg
12. Thumbnail generation via `sharp` template overlay
13. YouTube upload and optional scheduling (private by default)

All artifacts are written to `out/video_<runId>/`.

## Monorepo layout

- `apps/runner` - CLI entrypoint
- `packages/workflow` - orchestration graph and node execution
- `packages/integrations` - OpenAI, search, stock, YouTube, keywords
- `packages/media` - ffmpeg, captions, thumbnailing
- `packages/shared` - config loader, logger, retry, file helpers
- `configs/` - channel + affiliate config and prompts

## Prerequisites

- Node.js 20+
- pnpm 9+
- ffmpeg installed on host (or use Docker image included)
- API keys/secrets in `.env`

## Setup

```bash
cp .env.example .env
pnpm i
```

Fill `.env` with:

- OpenAI API key (`OPENAI_API_KEY`)
- Search key (optional Tavily, else Wiki fallback)
- Pexels API key
- Unsplash access key
- YouTube OAuth credentials + refresh token

## Generate YouTube refresh token (one-time)

```bash
pnpm run token:youtube
```

Follow URL, authorize upload scope, paste code, store refresh token in `.env` as `YOUTUBE_REFRESH_TOKEN`.

## Run

Topic auto-pick (default):

```bash
pnpm run start
```

Explicit topic:

```bash
pnpm run start -- --topic "How AI-native cloud startups challenge incumbents"
```

## Output contract

Each run writes:

- `topic.json`
- `sources.json`
- `script.md`
- `storyboard.json`
- `seo.json`
- `affiliate.md`
- `voice.mp3`
- `captions.srt`
- `video.mp4`
- `thumbnail.png`
- `upload_result.json`
- `logs.txt`

Location: `out/video_<runId>/`

## Docker

Build and run:

```bash
docker build -t autotube-ai .
docker compose run --rm autotube
```

## Cron on a single VPS

Use `scripts/cron.example` as a template. Example (daily):

```cron
30 6 * * * cd /opt/autotube-ai && /usr/bin/docker compose run --rm autotube >> /opt/autotube-ai/cron.log 2>&1
```

## CI

GitHub Actions workflow includes:

- lint
- typecheck
- tests
- build
- docker image build

## Safety/quality safeguards

- Reject run if fewer than 3 sources.
- Script safety node rewrites absolute claims into hedged language.
- Auto-inserts educational disclaimer (not legal/medical/financial advice).
- Explicitly avoids copyrighted clips by only using approved stock providers.
- Source title/url/snippet/date persist to artifacts.

## Cost strategy (keep it cheap)

- Single low-cost VPS + daily cron.
- Use `gpt-4o-mini` for script/SEO.
- Cache/reuse prompt templates and deterministic intermediates.
- Use free-tier stock APIs (Pexels/Unsplash).
- Keep output to 8–10 min and avoid expensive bespoke rendering engines.

## Notes

- Upload visibility defaults to `private` from `configs/channel.yaml`.
- Optional scheduling: set `YOUTUBE_SCHEDULE_AT` in ISO format.
