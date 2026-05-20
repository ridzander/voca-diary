'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Dot,
} from 'recharts'
import type { SymptomEntryRow } from '@/lib/types'
import { shortDate } from '@/lib/date-utils'

const SYMPTOM_COLORS = [
  '#00696b', '#6750a4', '#b5836a', '#197a58',
  '#7d5260', '#36618e', '#775a0b', '#006c51',
]

interface ChartPoint {
  date: string
  dateISO: string
  [symptom: string]: number | string | null
}

interface Props {
  entries: SymptomEntryRow[]
}

export function SeverityChart({ entries }: Props) {
  const symptomNames = Array.from(
    new Set(
      entries.flatMap((e) =>
        e.symptoms.filter((s) => s.severity !== null).map((s) => s.name)
      )
    )
  ).slice(0, 8)

  if (symptomNames.length === 0) return null

  const points: ChartPoint[] = entries
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((entry) => {
      const point: ChartPoint = {
        date: shortDate(entry.created_at),
        dateISO: entry.created_at.slice(0, 10),
      }
      for (const name of symptomNames) {
        const match = entry.symptoms.find((s) => s.name === name && s.severity !== null)
        point[name] = match?.severity ?? null
      }
      return point
    })
    .filter((p) => symptomNames.some((n) => p[n] !== null))

  return (
    <div
      className="rounded-xl bg-surface-container-lowest border border-outline-variant p-4"
      style={{ height: '45vw', minHeight: 200, maxHeight: 320 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cac4d0" opacity={0.4} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#49454f' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[1, 10]}
            ticks={[1, 3, 5, 7, 10]}
            tick={{ fontSize: 11, fill: '#49454f' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 12,
              border: '1px solid #cac4d0',
              backgroundColor: '#fffbfe',
              color: '#1c1b1f',
            }}
            formatter={(value, name) => [`${value}/10`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: '#49454f' }} />
          {symptomNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={SYMPTOM_COLORS[i % SYMPTOM_COLORS.length]}
              strokeWidth={2}
              dot={<Dot r={4} />}
              connectNulls={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
