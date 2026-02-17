import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export class Logger {
  constructor(private readonly outDir: string) {}

  async log(message: string): Promise<void> {
    const line = `[${new Date().toISOString()}] ${message}`;
    console.log(line);
    await mkdir(this.outDir, { recursive: true });
    await appendFile(join(this.outDir, 'logs.txt'), `${line}\n`, 'utf8');
  }
}
