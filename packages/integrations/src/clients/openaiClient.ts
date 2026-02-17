import OpenAI from 'openai';
import { withRetry } from '@autotube/shared';

export class OpenAIClient {
  private client: OpenAI;

  constructor(apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) throw new Error('OPENAI_API_KEY missing');
    this.client = new OpenAI({ apiKey });
  }

  async complete(prompt: string, model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'): Promise<string> {
    return withRetry(async () => {
      const res = await this.client.responses.create({ model, input: prompt });
      return res.output_text;
    });
  }

  async tts(text: string, outputPath: string): Promise<string> {
    return withRetry(async () => {
      const audio = await this.client.audio.speech.create({
        model: process.env.OPENAI_TTS_MODEL ?? 'gpt-4o-mini-tts',
        voice: process.env.OPENAI_TTS_VOICE ?? 'alloy',
        input: text,
      });
      const fs = await import('node:fs/promises');
      const buffer = Buffer.from(await audio.arrayBuffer());
      await fs.writeFile(outputPath, buffer);
      return outputPath;
    });
  }
}
