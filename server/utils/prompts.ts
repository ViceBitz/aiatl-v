import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load prompts from files (assumes prompts are in project root)
export async function getPrompts(name: string): Promise<{ markdown: string; json: any }> {
  const fileNameMd = `prompt-${name}.md`;
  const fileNameTS = `prompt-${name}.ts`;

  const promptsdir = join(__dirname, '..', "prompts");

  const pathMd = join(promptsdir, fileNameMd);
  const pathTS = join(promptsdir, fileNameTS);

  const markdown = readFileSync(pathMd, "utf-8");

  const module = await import(pathTS);
  const json = module.default;   // <-- default export

  return { markdown, json };
}
