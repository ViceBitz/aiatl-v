import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load prompts from files (assumes prompts are in project root)
export function getPrompt(id) {
    const promptFiles = {
        1: 'featureGeneration.md',
        2: 'mapGeneration.md',
        3: 'contextGathering.md',
        4: 'codeGeneration.md',
    };
    const fileName = promptFiles[id] || `prompt-${id}.md`;
    // Try multiple paths: server root, project root, or relative
    const possiblePaths = [
        join(__dirname, '../../../prompts', fileName),
        join(__dirname, '../../../../prompts', fileName),
        join(process.cwd(), 'prompts', fileName),
        join(process.cwd(), '../prompts', fileName),
    ];
    for (const promptPath of possiblePaths) {
        try {
            return readFileSync(promptPath, 'utf-8');
        }
        catch {
            continue;
        }
    }
    throw new Error(`Failed to load prompt: ${fileName}. Please ensure prompts directory exists.`);
}
