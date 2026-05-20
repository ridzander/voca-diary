// Groups rows by calendar date (local time), returns keys as 'YYYY-MM-DD' sorted desc
export function groupByDay<T extends { created_at: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const key = row.created_at.slice(0, 10) // 'YYYY-MM-DD'
    const bucket = map.get(key) ?? []
    bucket.push(row)
    map.set(key, bucket)
  }
  return map
}

export function dayLabel(dateStr: string): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const d = new Date(dateStr + 'T12:00:00') // noon to avoid DST edge cases
  const todayStr = today.toISOString().slice(0, 10)
  const yestStr = yesterday.toISOString().slice(0, 10)

  if (dateStr === todayStr) return 'Today'
  if (dateStr === yestStr) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
