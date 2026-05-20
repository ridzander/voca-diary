'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { SeverityChip } from '@/components/ui/voca-card'
import { Icon } from '@/components/ui/ms-icon'
import type { SymptomEntryRow } from '@/lib/types'
import { timeLabel } from '@/lib/date-utils'

interface Props {
  entry: SymptomEntryRow
  onDeleted: (id: string) => void
}

export function SymptomEntryCard({ entry, onDeleted }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const first = entry.symptoms[0] ?? null
  const extraCount = entry.symptoms.length - 1

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/entries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id, mode: 'symptom' }),
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
            <span className="text-body-md font-semibold text-on-surface capitalize truncate block">
              {first?.name ?? 'entry'}
            </span>
            {entry.factors.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {entry.factors.slice(0, 3).map((f, i) => (
                  <span key={i} className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-label-sm text-on-surface-variant">
                    {f.name}
                  </span>
                ))}
                {entry.factors.length > 3 && (
                  <span className="text-caption text-on-surface-variant">+{entry.factors.length - 3}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {first && <SeverityChip severity={first.severity} />}
            {extraCount > 0 && (
              <span className="text-caption text-on-surface-variant">+{extraCount}</span>
            )}
            <Icon
              name={expanded ? 'expand_less' : 'expand_more'}
              size={20}
              className="text-on-surface-variant ml-1"
            />
          </div>
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t border-outline-variant px-4 py-4 flex flex-col gap-4">
            {/* Actions */}
            <div className="flex justify-end gap-1">
              <button
                onClick={() => router.push(`/entries/symptom/${entry.id}/edit`)}
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

            {/* Transcript */}
            {entry.transcript && (
              <div>
                <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">Transcript</p>
                <p className="text-caption text-on-surface-variant leading-relaxed italic">&ldquo;{entry.transcript}&rdquo;</p>
              </div>
            )}

            {/* All symptoms */}
            {entry.symptoms.length > 0 && (
              <div>
                <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-2">Symptoms</p>
                <div className="flex flex-col gap-2">
                  {entry.symptoms.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 flex-wrap">
                      <span className="text-body-md text-on-surface capitalize font-semibold">{s.name}</span>
                      {s.location && <span className="text-caption text-on-surface-variant">({s.location})</span>}
                      <SeverityChip severity={s.severity} />
                      {s.quality && <span className="text-caption text-on-surface-variant">· {s.quality}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All factors */}
            {entry.factors.length > 0 && (
              <div>
                <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-2">Factors</p>
                <div className="flex flex-col gap-2">
                  {entry.factors.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 flex-wrap">
                      <span className="text-body-md text-on-surface capitalize">{f.name}</span>
                      <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-label-sm text-on-surface-variant">
                        {f.category.replace('_', ' ')}
                      </span>
                      {f.time_offset_days < 0 && (
                        <span className="text-caption text-on-surface-variant">{Math.abs(f.time_offset_days)}d ago</span>
                      )}
                      {f.detail && <span className="text-caption text-on-surface-variant">· {f.detail}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mood + notes */}
            {entry.mood && (
              <p className="text-body-md text-on-surface">
                <span className="text-on-surface-variant">Mood: </span>{entry.mood}
              </p>
            )}
            {entry.notes && <p className="text-body-md text-on-surface-variant">{entry.notes}</p>}

            {/* Ambiguities */}
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
