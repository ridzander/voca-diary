import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function extractSystemPrompt(fileContent: string): string {
  const marker = '## System prompt (paste into Claude as the system message)';
  const startIdx = fileContent.indexOf(marker);
  if (startIdx === -1) throw new Error('System prompt marker not found in prompt file');

  const afterMarker = fileContent.slice(startIdx + marker.length);
  // Stop at the next --- separator (end of prompt section, before test cases)
  const separatorIdx = afterMarker.indexOf('\n---\n');
  const raw = separatorIdx !== -1 ? afterMarker.slice(0, separatorIdx) : afterMarker;
  return raw.trim();
}

let _symptomPrompt: string | null = null;
let _workoutPrompt: string | null = null;

export function getSymptomPrompt(): string {
  if (!_symptomPrompt) {
    const content = readFileSync(
      join(process.cwd(), 'prompts', 'symptom-extractor.md'),
      'utf-8'
    );
    _symptomPrompt = extractSystemPrompt(content);
    console.log('[prompts] symptom loaded (first 200):', _symptomPrompt.slice(0, 200));
  }
  return _symptomPrompt;
}

export function getWorkoutPrompt(): string {
  if (!_workoutPrompt) {
    const content = readFileSync(
      join(process.cwd(), 'prompts', 'workout-extractor.md'),
      'utf-8'
    );
    _workoutPrompt = extractSystemPrompt(content);
    console.log('[prompts] workout loaded (first 200):', _workoutPrompt.slice(0, 200));
  }
  return _workoutPrompt;
}
