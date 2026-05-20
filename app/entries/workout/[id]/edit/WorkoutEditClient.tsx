'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { WorkoutReviewCard } from '@/components/WorkoutReviewCard'
import type { WorkoutEntryRow, WorkoutExtraction } from '@/lib/types'

interface Props {
  entry: WorkoutEntryRow
}

export function WorkoutEditClient({ entry }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const handleSave = async (edited: WorkoutExtraction) => {
    setSaving(true)
    try {
      const res = await fetch('/api/entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id, mode: 'workout', data: edited, transcript: entry.transcript }),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Failed to update'); setSaving(false); return }
      toast.success('Entry updated!')
      router.push('/timeline/workouts')
    } catch {
      toast.error('Network error')
      setSaving(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-background px-6 py-10">
      <div className="w-full max-w-sm mx-auto flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
          ← Back
        </button>
        <span className="text-sm font-semibold">Edit entry</span>
        <div className="w-12" />
      </div>
      <WorkoutReviewCard
        extracted={entry}
        transcript={entry.transcript}
        onSave={handleSave}
        isSaving={saving}
      />
    </main>
  )
}
