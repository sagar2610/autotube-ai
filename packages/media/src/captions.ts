import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import { writeText } from '@autotube/shared';

const exec = promisify(execCb);

export async function generateCaptions(script: string, voicePath: string, outPath: string): Promise<string> {
  try {
    await exec(`which whisper >/dev/null 2>&1 && whisper ${voicePath} --output_format srt --output_dir ${JSON.stringify(outPath.replace(/\/[^/]+$/, ''))}`);
  } catch {
    const lines = script.split('\n').filter(Boolean);
    let cursor = 0;
    const toTimestamp = (secs: number) => {
      const h = Math.floor(secs / 3600)
        .toString()
        .padStart(2, '0');
      const m = Math.floor((secs % 3600) / 60)
        .toString()
        .padStart(2, '0');
      const s = Math.floor(secs % 60)
        .toString()
        .padStart(2, '0');
      return `${h}:${m}:${s},000`;
    };

    const srt = lines
      .map((line, i) => {
        const dur = Math.max(3, Math.round(line.split(' ').length / 2.2));
        const segment = `${i + 1}\n${toTimestamp(cursor)} --> ${toTimestamp(cursor + dur)}\n${line}\n`;
        cursor += dur;
        return segment;
      })
      .join('\n');

    await writeText(outPath, srt);
  }
  return outPath;
}
