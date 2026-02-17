import { writeText } from '@autotube/shared';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(execFileCb);

export async function assembleVideo(params: {
  assets: string[];
  audio: string;
  captions: string;
  output: string;
  tmpListPath: string;
}): Promise<string> {
  const listFile = params.assets.map((a) => `file '${a.replace(/'/g, "'\\''")}'`).join('\n');
  await writeText(params.tmpListPath, listFile);

  await execFile('ffmpeg', [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    params.tmpListPath,
    '-i',
    params.audio,
    '-vf',
    `scale=1920:1080,subtitles=${params.captions}`,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-shortest',
    params.output,
  ]);
  return params.output;
}
