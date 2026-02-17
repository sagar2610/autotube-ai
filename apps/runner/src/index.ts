import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { runWorkflow } from '@autotube/workflow';

function argValue(flag: string): string | undefined {
  const idx = process.argv.findIndex((v) => v === flag);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = join(process.cwd(), 'out', `video_${runId}`);
  await mkdir(outDir, { recursive: true });
  const topic = argValue('--topic') ?? '';

  const finalState = await runWorkflow({
    runId,
    topic,
    outDir,
    logs: [],
    sources: [],
  });

  console.log('Pipeline complete:', {
    runId: finalState.runId,
    outDir: finalState.outDir,
    video: finalState.videoPath,
    upload: finalState.uploadResult,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
