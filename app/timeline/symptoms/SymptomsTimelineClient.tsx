'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SeverityChart } from '@/components/charts/SeverityChart'
import { SymptomEntryCard } from '@/components/SymptomEntryCard'
import { Icon } from '@/components/ui/ms-icon'
import type { SymptomEntryRow } from '@/lib/types'
import { groupByDay, dayLabel } from '@/lib/date-utils'

interface Props {
  entries: SymptomEntryRow[]
}

export function SymptomsTimelineClient({ entries: initialEntries }: Props) {
  const [entries, setEntries] = useState(initialEntries)

  const handleDeleted = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id))

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-container">
          <Icon name="monitor_heart" size={32} fill={1} className="text-on-primary-container" />
        </div>
        <h2 className="font-headline text-headline-md font-bold text-on-surface">No symptom entries yet</h2>
        <p className="text-body-md text-on-surface-variant max-w-xs">
          Log your first symptom to start tracking patterns over time.
        </p>
        <Link
          href="/record/symptom"
          className="mt-2 rounded-full bg-primary text-on-primary px-6 py-3 text-body-md font-semibold hover:opacity-90 transition-all tap-response"
        >
          Log your first symptom
        </Link>
      </div>
    )
  }

  const entriesWithSeverity = entries.filter((e) => e.symptoms.some((s) => s.severity !== null))
  const showChart = entriesWithSeverity.length >= 3

  const grouped = groupByDay(entries)
  const days = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <div className="flex flex-col max-w-lg mx-auto w-full">
      {/* Chart section */}
      <div className="px-container-padding-mobile pt-5 pb-2">
        {showChart ? (
          <SeverityChart entries={entriesWithSeverity} />
        ) : (
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-4 py-8 text-center">
            <p className="text-body-md text-on-surface-variant">
              Log a few more entries with severity ratings to see patterns.
            </p>
          </div>
        )}
      </div>

      {/* Grouped list */}
      <div className="flex flex-col">
        {days.map((day) => (
          <div key={day}>
            {/* Sticky day header */}
            <div className="sticky top-16 z-[5] bg-surface/95 backdrop-blur px-container-padding-mobile py-2.5">
              <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">
                {dayLabel(day)}
              </p>
            </div>

            {/* Entry cards for this day */}
            <div className="flex flex-col gap-2 px-container-padding-mobile pb-3">
              {(grouped.get(day) ?? []).map((entry) => (
                <SymptomEntryCard key={entry.id} entry={entry} onDeleted={handleDeleted} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
