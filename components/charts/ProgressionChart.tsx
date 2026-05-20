'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Dot,
} from 'recharts'
import { shortDate } from '@/lib/date-utils'

interface ProgressionPoint {
  date: string
  weight: number
  reps: number | null
}

interface Props {
  points: ProgressionPoint[]
  exercise: string
}

export function ProgressionChart({ points, exercise }: Props) {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  const displayPoints = sorted.map((p) => ({ ...p, displayDate: shortDate(p.date) }))

  return (
    <div
      className="rounded-xl bg-surface-container-lowest border border-outline-variant p-4"
      style={{ height: '42vw', minHeight: 180, maxHeight: 280 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={displayPoints} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cac4d0" opacity={0.4} />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11, fill: '#49454f' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#49454f' }}
            tickLine={false}
            axisLine={false}
            unit="kg"
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 12,
              border: '1px solid #cac4d0',
              backgroundColor: '#fffbfe',
              color: '#1c1b1f',
            }}
            formatter={(value, _name, props) => {
              const reps = (props.payload as (ProgressionPoint & { displayDate: string }) | undefined)?.reps
              return [`${value} kg${reps ? ` × ${reps} reps` : ''}`, exercise]
            }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#00696b"
            strokeWidth={2.5}
            dot={<Dot r={5} fill="#00696b" />}
            activeDot={{ r: 7, fill: '#00696b' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
