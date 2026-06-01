import Anthropic from '@anthropic-ai/sdk';
import { SYMPTOM_EXTRACTOR_PROMPT } from './prompts/symptom-extractor';
import { WORKOUT_EXTRACTOR_PROMPT } from './prompts/workout-extractor';
import { DAILY_CHECKIN_EXTRACTOR_PROMPT } from './prompts/daily-checkin-extractor';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export function getSymptomPrompt(): string {
  return SYMPTOM_EXTRACTOR_PROMPT;
}

export function getWorkoutPrompt(): string {
  return WORKOUT_EXTRACTOR_PROMPT;
}

export function getDailyCheckinPrompt(): string {
  return DAILY_CHECKIN_EXTRACTOR_PROMPT;
}
