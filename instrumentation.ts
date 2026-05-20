export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getSymptomPrompt, getWorkoutPrompt } = await import('./lib/anthropic')
    getSymptomPrompt()  // logs first 200 chars on first load
    getWorkoutPrompt()  // logs first 200 chars on first load
  }
}
