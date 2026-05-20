'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { Icon } from '@/components/ui/ms-icon'
import type { WorkoutEntryRow, SessionType } from '@/lib/types'
import { timeLabel } from '@/lib/date-utils'

const SESSION_BADGE: Record<SessionType, string> = {
  lifting:  'bg-secondary-container text-on-secondary-container',
  cardio:   'bg-primary-container text-on-primary-container',
  sport:    'bg-tertiary-container text-on-tertiary-container',
  mixed:    'bg-surface-container-high text-on-surface-variant',
}

function activitySummary(entry: WorkoutEntryRow): string {
  const lifting = entry.activities.filter((a) => a.type === 'lifting')
  const cardio = entry.activities.filter((a) => a.type === 'cardio')
  const sport = entry.activities.filter((a) => a.type === 'sport')
  const parts: string[] = []
  if (lifting.length) parts.push(`${lifting.length} exercise${lifting.length !== 1 ? 's' : ''}`)
  const cardioMins = cardio.reduce((s, a) => s + (a.duration_minutes ?? 0), 0)
  const sportMins = sport.reduce((s, a) => s + (a.duration_minutes ?? 0), 0)
  if (cardioMins) parts.push(`${cardioMins} min cardio`)
  if (sportMins && sport.length === 1) parts.push(`${sport[0].name} · ${sportMins} min`)
  else if (sport.length) parts.push(`${sport.length} sport${sport.length !== 1 ? 's' : ''}`)
  return parts.join(' · ') || `${entry.activities.length} activities`
}

const ACTIVITY_BADGE: Record<string, string> = {
  lifting:  'bg-secondary-container text-on-secondary-container',
  cardio:   'bg-primary-container text-on-primary-container',
  sport:    'bg-tertiary-container text-on-tertiary-container',
}

interface Props {
  entry: WorkoutEntryRow
  onDeleted: (id: string) => void
}

export function WorkoutEntryCard({ entry, onDeleted }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/entries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id, mode: 'workout' }),
      })
      if (!res.ok) { toast.error('Failed to delete'); return }
      toast.success('Entry deleted')
      onDeleted(entry.id)
    } catch {
      toast.error('Network error')
    } finally {
      setDeleting(false)
    }
  }

  const badgeCls = SESSION_BADGE[entry.session_type] ?? 'bg-surface-container-high text-on-surface-variant'

  return (
    <>
      <AlertDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this entry?"
        description="This can't be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
        destructive
      />

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        {/* Summary row */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-surface-container transition-colors active:bg-surface-container-high"
        >
          <span className="text-caption text-on-surface-variant w-14 shrink-0 tabular-nums">
            {timeLabel(entry.created_at)}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-body-md font-semibold text-on-surface capitalize truncate">{entry.session_label}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-label-sm font-semibold uppercase shrink-0 ${badgeCls}`}>
                {entry.session_type}
              </span>
              {entry.perceived_effort !== null && (
                <span className="rounded-full px-2.5 py-0.5 text-label-sm font-semibold bg-surface-container-high text-on-surface-variant">
                  RPE {entry.perceived_effort}
                </span>
              )}
            </div>
            <p className="text-caption text-on-surface-variant mt-0.5">{activitySummary(entry)}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {entry.post_session_symptoms?.length > 0 && (
              <span className="inline-block h-2 w-2 rounded-full bg-error" title="Post-session symptoms" />
            )}
            <Icon
              name={expanded ? 'expand_less' : 'expand_more'}
              size={20}
              className="text-on-surface-variant"
            />
          </div>
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t border-outline-variant px-4 py-4 flex flex-col gap-4">
            {/* Actions */}
            <div className="flex justify-end gap-1">
              <button
                onClick={() => router.push(`/entries/workout/${entry.id}/edit`)}
                className="flex items-center gap-1.5 text-caption text-on-surface-variant hover:text-on-surface transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-container"
              >
                <Icon name="edit" size={14} /> Edit
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-caption text-on-surface-variant hover:text-error transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-container"
              >
                <Icon name="delete" size={14} /> Delete
              </button>
            </div>

            {/* Activities */}
            {entry.activities.map((activity, ai) => {
              const actBadge = ACTIVITY_BADGE[activity.type] ?? 'bg-surface-container-high text-on-surface-variant'
              return (
                <div key={ai}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-body-md text-on-surface font-semibold capitalize">{activity.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-label-sm uppercase font-medium ${actBadge}`}>
                      {activity.type}
                    </span>
                  </div>

                  {activity.type === 'lifting' && activity.sets.length > 0 && (
                    <div className="rounded-xl bg-surface-container overflow-hidden">
                      <table className="w-full text-caption font-mono">
                        <thead>
                          <tr className="text-on-surface-variant border-b border-outline-variant">
                            <th className="text-left py-2 px-3 font-medium w-6">#</th>
                            <th className="text-right py-2 px-3 font-medium">Reps</th>
                            <th className="text-right py-2 px-3 font-medium">kg</th>
                            <th className="text-right py-2 px-3 font-medium">RPE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activity.sets.map((set, si) => (
                            <tr key={si} className="border-t border-outline-variant/50">
                              <td className="py-2 px-3 text-on-surface-variant">{si + 1}</td>
                              <td className="py-2 px-3 text-right text-on-surface">{set.reps ?? '—'}</td>
                              <td className="py-2 px-3 text-right text-on-surface">{set.weight_kg ?? '—'}</td>
                              <td className="py-2 px-3 text-right text-on-surface-variant">{set.rpe ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {(activity.type === 'cardio' || activity.type === 'sport') && (
                    <div className="flex gap-4 text-body-md text-on-surface-variant">
                      {activity.duration_minutes && <span>{activity.duration_minutes} min</span>}
                      {activity.intensity_notes && <span>{activity.intensity_notes}</span>}
                    </div>
                  )}

                  {activity.notes && <p className="text-caption text-on-surface-variant mt-1">{activity.notes}</p>}
                </div>
              )
            })}

            {entry.session_notes && (
              <p className="text-body-md text-on-surface-variant border-t border-outline-variant pt-3">{entry.session_notes}</p>
            )}

            {entry.post_session_symptoms?.length > 0 && (
              <div>
                <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">Post-session symptoms</p>
                {entry.post_session_symptoms.map((s, i) => (
                  <p key={i} className="text-body-md text-on-surface capitalize">
                    {s.name}{s.location ? ` (${s.location})` : ''}
                  </p>
                ))}
              </div>
            )}

            {entry.ambiguities?.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {entry.ambiguities.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl bg-tertiary-container/30 border border-tertiary-container/60 px-3 py-2">
                    <Icon name="info" size={14} fill={1} className="text-on-tertiary-container shrink-0 mt-0.5" />
                    <p className="text-caption text-on-surface">{a}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
