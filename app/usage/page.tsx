import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Icon } from '@/components/ui/ms-icon'
import { TopAppBar } from '@/components/ui/top-app-bar'
import Link from 'next/link'
import type { UsageRow } from '@/lib/types'

function fmt(n: number | null | undefined, decimals = 4): string {
  if (n == null) return '—'
  return n.toFixed(decimals)
}

function fmtCost(n: number | null | undefined): string {
  if (n == null) return '—'
  return `$${n.toFixed(4)}`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface RouteGroup {
  route: string
  count: number
  totalCost: number
}

export default async function UsagePage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ data: monthRows }, { data: recentRows }] = await Promise.all([
    supabase
      .from('api_usage')
      .select('route, cost_usd, input_tokens, output_tokens, audio_seconds, status')
      .gte('created_at', startOfMonth),
    supabase
      .from('api_usage')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const rows = (monthRows ?? []) as Pick<UsageRow, 'route' | 'cost_usd' | 'input_tokens' | 'output_tokens' | 'audio_seconds' | 'status'>[]
  const recent = (recentRows ?? []) as UsageRow[]

  const totalCost = rows.reduce((s, r) => s + (r.cost_usd ?? 0), 0)
  const totalCalls = rows.length
  const totalInputTokens = rows.reduce((s, r) => s + (r.input_tokens ?? 0), 0)
  const totalOutputTokens = rows.reduce((s, r) => s + (r.output_tokens ?? 0), 0)
  const totalAudioSeconds = rows.reduce((s, r) => s + (r.audio_seconds ?? 0), 0)

  const byRoute = rows.reduce<Record<string, RouteGroup>>((acc, r) => {
    if (!acc[r.route]) acc[r.route] = { route: r.route, count: 0, totalCost: 0 }
    acc[r.route].count++
    acc[r.route].totalCost += r.cost_usd ?? 0
    return acc
  }, {})
  const routeGroups = Object.values(byRoute).sort((a, b) => b.totalCost - a.totalCost)

  const backSlot = (
    <Link href="/" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors">
      <Icon name="arrow_back" size={24} className="text-on-surface-variant" />
    </Link>
  )

  return (
    <>
      <TopAppBar title="Usage" leftSlot={backSlot} />
      <main className="mt-20 pb-12 px-4 max-w-3xl mx-auto">

        {totalCalls === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Icon name="monitoring" size={40} className="text-on-surface-variant/50" />
            <p className="font-headline text-body-lg font-semibold text-on-surface">No API calls logged yet.</p>
            <p className="text-caption text-on-surface-variant">Use the app to start tracking.</p>
          </div>
        ) : (
          <>
            {/* Monthly summary */}
            <section className="mb-8 pt-6">
              <h2 className="font-headline text-headline-md font-bold text-on-surface mb-4">This month</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Total spend', value: fmtCost(totalCost) },
                  { label: 'API calls', value: String(totalCalls) },
                  { label: 'Claude tokens', value: `${(totalInputTokens + totalOutputTokens).toLocaleString()}` },
                  { label: 'Whisper seconds', value: fmt(totalAudioSeconds, 0) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                    <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
                    <p className="font-headline text-headline-md font-bold text-on-surface tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Spend by route */}
            <section className="mb-8">
              <h2 className="font-headline text-headline-md font-bold text-on-surface mb-4">Spend by route</h2>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      <th className="text-left px-4 py-3 text-label-sm text-on-surface-variant font-medium">Route</th>
                      <th className="text-right px-4 py-3 text-label-sm text-on-surface-variant font-medium">Calls</th>
                      <th className="text-right px-4 py-3 text-label-sm text-on-surface-variant font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routeGroups.map((g, i) => (
                      <tr key={g.route} className={i < routeGroups.length - 1 ? 'border-b border-outline-variant/50' : ''}>
                        <td className="px-4 py-3 font-mono text-body-sm text-on-surface">{g.route}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-body-sm text-on-surface">{g.count}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-body-sm text-on-surface">{fmtCost(g.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Recent calls */}
            <section>
              <h2 className="font-headline text-headline-md font-bold text-on-surface mb-4">Recent calls</h2>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      <th className="text-left px-4 py-3 text-label-sm text-on-surface-variant font-medium">Time</th>
                      <th className="text-left px-4 py-3 text-label-sm text-on-surface-variant font-medium">Route</th>
                      <th className="text-left px-4 py-3 text-label-sm text-on-surface-variant font-medium">Model</th>
                      <th className="text-right px-4 py-3 text-label-sm text-on-surface-variant font-medium">Status</th>
                      <th className="text-right px-4 py-3 text-label-sm text-on-surface-variant font-medium">ms</th>
                      <th className="text-right px-4 py-3 text-label-sm text-on-surface-variant font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((row, i) => (
                      <tr key={row.id} className={i < recent.length - 1 ? 'border-b border-outline-variant/50' : ''}>
                        <td className="px-4 py-3 text-body-sm text-on-surface-variant whitespace-nowrap">{fmtDate(row.created_at)}</td>
                        <td className="px-4 py-3 font-mono text-body-sm text-on-surface">{row.route}</td>
                        <td className="px-4 py-3 text-body-sm text-on-surface-variant">{row.model ?? '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center gap-1 text-label-sm font-medium ${row.status === 'success' ? 'text-primary' : 'text-error'}`}>
                            <Icon name={row.status === 'success' ? 'check_circle' : 'error'} size={14} fill={1} />
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-body-sm text-on-surface">{row.duration_ms}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-body-sm text-on-surface">
                          {fmtCost(row.cost_usd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {recent.some((r) => r.error_message) && (
                <div className="mt-4 flex flex-col gap-2">
                  {recent.filter((r) => r.error_message).map((r) => (
                    <div key={r.id} className="bg-error-container/30 border border-error/20 rounded-lg px-4 py-3 text-body-sm text-error">
                      <span className="font-medium">{r.route}</span> · {fmtDate(r.created_at)} — {r.error_message}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  )
}
