import { createSupabaseServiceRoleClient } from '@/lib/supabase-server'

export interface UsageLogParams {
  userId: string | null
  route: string
  model?: string
  inputTokens?: number
  outputTokens?: number
  audioSeconds?: number
  durationMs: number
  status: 'success' | 'error'
  errorMessage?: string
}

function calculateCost(params: UsageLogParams): number | null {
  const { model, inputTokens, outputTokens, audioSeconds } = params
  if (!model) return null

  if (model.startsWith('claude-haiku-4-5')) {
    return (inputTokens ?? 0) * (1 / 1_000_000) + (outputTokens ?? 0) * (5 / 1_000_000)
  }
  if (model.startsWith('claude-sonnet-4-5')) {
    return (inputTokens ?? 0) * (3 / 1_000_000) + (outputTokens ?? 0) * (15 / 1_000_000)
  }
  if (model === 'whisper-1') {
    return (audioSeconds ?? 0) * (0.006 / 60)
  }
  return null
}

export async function logUsage(params: UsageLogParams): Promise<void> {
  try {
    const supabase = createSupabaseServiceRoleClient()
    const cost = calculateCost(params)
    await supabase.from('api_usage').insert({
      user_id: params.userId,
      route: params.route,
      model: params.model ?? null,
      input_tokens: params.inputTokens ?? null,
      output_tokens: params.outputTokens ?? null,
      audio_seconds: params.audioSeconds ?? null,
      cost_usd: cost,
      duration_ms: params.durationMs,
      status: params.status,
      error_message: params.errorMessage ?? null,
    })
  } catch (err) {
    console.error('[usage-logger] Failed to log usage:', err)
  }
}
