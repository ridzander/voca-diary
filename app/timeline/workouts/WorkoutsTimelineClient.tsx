'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ProgressionChart } from '@/components/charts/ProgressionChart'
import { WorkoutEntryCard } from '@/components/WorkoutEntryCard'
import { Icon } from '@/components/ui/ms-icon'
import type { WorkoutEntryRow } from '@/lib/types'
import { groupByDay, dayLabel } from '@/lib/date-utils'

interface Props {
  entries: WorkoutEntryRow[]
}

export function WorkoutsTimelineClient({ entries: initialEntries }: Props) {
  const [entries, setEntries] = useState(initialEntries)
  const handleDeleted = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id))

  const liftingExercises = useMemo(() => {
    const freq = new Map<string, number>()
    for (const entry of entries) {
      for (const act of entry.activities) {
        if (act.type === 'lifting' && act.name) {
          freq.set(act.name, (freq.get(act.name) ?? 0) + 1)
        }
      }
    }
    return Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).map(([name]) => name)
  }, [entries])

  const [selectedExercise, setSelectedExercise] = useState<string>(liftingExercises[0] ?? '')

  const progressionPoints = useMemo(() => {
    if (!selectedExercise) return []
    const byDay = new Map<string, { weight: number; reps: number | null }>()
    for (const entry of entries) {
      const day = entry.created_at.slice(0, 10)
      for (const act of entry.activities) {
        if (act.type === 'lifting' && act.name === selectedExercise) {
          for (const set of act.sets) {
            if (set.weight_kg !== null) {
              const existing = byDay.get(day)
              if (!existing || set.weight_kg > existing.weight) {
                byDay.set(day, { weight: set.weight_kg, reps: set.reps })
              }
            }
          }
        }
      }
    }
    return Array.from(byDay.entries()).map(([date, { weight, reps }]) => ({ date, weight, reps }))
  }, [entries, selectedExercise])

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-container">
          <Icon name="fitness_center" size={32} fill={1} className="text-on-tertiary-container" />
        </div>
        <h2 className="font-headline text-headline-md font-bold text-on-surface">No workout entries yet</h2>
        <p className="text-body-md text-on-surface-variant max-w-xs">
          Log your first workout to start tracking your progress.
        </p>
        <Link
          href="/record/workout"
          className="mt-2 rounded-full bg-primary text-on-primary px-6 py-3 text-body-md font-semibold hover:opacity-90 transition-all tap-response"
        >
          Log your first workout
        </Link>
      </div>
    )
  }

  const grouped = groupByDay(entries)
  const days = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <div className="flex flex-col max-w-lg mx-auto w-full">
      {/* Progression chart section */}
      <div className="px-container-padding-mobile pt-5 pb-2">
        {liftingExercises.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-4 py-8 text-center">
            <p className="text-body-md text-on-surface-variant">
              Log a lifting workout to see exercise progression.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">
                Top set weight over time
              </p>
              {/* Horizontal scrollable exercise chips */}
              <div className="flex gap-2 overflow-x-auto max-w-[60%] pb-0.5 hide-scrollbar">
                {liftingExercises.map((name) => (
                  <button
                    key={name}
                    onClick={() => setSelectedExercise(name)}
                    className={[
                      'shrink-0 rounded-full px-3 py-1 text-label-sm font-medium transition-all tap-response',
                      selectedExercise === name
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container',
                    ].join(' ')}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {progressionPoints.length < 2 ? (
              <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-4 py-8 text-center">
                <p className="text-body-md text-on-surface-variant">
                  Log <span className="font-semibold text-on-surface">{selectedExercise}</span> a couple more times to see progression.
                </p>
              </div>
            ) : (
              <ProgressionChart points={progressionPoints} exercise={selectedExercise} />
            )}
          </>
        )}
      </div>

      {/* Grouped session list */}
      <div className="flex flex-col">
        {days.map((day) => (
          <div key={day}>
            <div className="sticky top-16 z-[5] bg-surface/95 backdrop-blur px-container-padding-mobile py-2.5">
              <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">
                {dayLabel(day)}
              </p>
            </div>
            <div className="flex flex-col gap-2 px-container-padding-mobile pb-3">
              {(grouped.get(day) ?? []).map((entry) => (
                <WorkoutEntryCard key={entry.id} entry={entry} onDeleted={handleDeleted} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
