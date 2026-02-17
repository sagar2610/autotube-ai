import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function loadPrompt(name: string, vars: Record<string, string>, root = process.cwd()): Promise<string> {
  const tpl = await readFile(join(root, 'configs/prompts', `${name}.md`), 'utf8');
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{{${k}}}`, v), tpl);
}
