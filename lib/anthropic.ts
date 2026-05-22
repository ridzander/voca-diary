import Anthropic from '@anthropic-ai/sdk';
import { SYMPTOM_EXTRACTOR_PROMPT } from './prompts/symptom-extractor';
import { WORKOUT_EXTRACTOR_PROMPT } from './prompts/workout-extractor';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export function getSymptomPrompt(): string {
  return SYMPTOM_EXTRACTOR_PROMPT;
}

export function getWorkoutPrompt(): string {
  return WORKOUT_EXTRACTOR_PROMPT;
}
