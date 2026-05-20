'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { VocaButton } from '@/components/ui/voca-card'
import { Icon } from '@/components/ui/ms-icon'
import type {
  WorkoutExtraction,
  ActivityItem,
  SetItem,
  PostSessionSymptom,
  ActivityType,
} from '@/lib/types'

interface Props {
  extracted: WorkoutExtraction
  transcript: string
  onSave: (edited: WorkoutExtraction) => Promise<void>
  isSaving: boolean
}

function blankSet(): SetItem {
  return { reps: null, weight_kg: null, rpe: null, notes: null }
}

function blankActivity(type: ActivityType): ActivityItem {
  return { type, name: '', sets: type === 'lifting' ? [blankSet()] : [], duration_minutes: null, intensity_notes: null, notes: null }
}

const ACTIVITY_BADGE: Record<ActivityType, string> = {
  lifting: 'bg-secondary-container text-on-secondary-container',
  cardio: 'bg-primary-container text-on-primary-container',
  sport: 'bg-tertiary-container text-on-tertiary-container',
}

export function WorkoutReviewCard({ extracted, transcript, onSave, isSaving }: Props) {
  const router = useRouter()
  const [data, setData] = useState<WorkoutExtraction>(extracted)
  const [showTranscript, setShowTranscript] = useState(false)
  const [addingActivity, setAddingActivity] = useState(false)

  const updateActivity = (i: number, patch: Partial<ActivityItem>) =>
    setData((d) => ({ ...d, activities: d.activities.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) }))
  const removeActivity = (i: number) =>
    setData((d) => ({ ...d, activities: d.activities.filter((_, idx) => idx !== i) }))
  const addActivity = (type: ActivityType) => {
    setData((d) => ({ ...d, activities: [...d.activities, blankActivity(type)] }))
    setAddingActivity(false)
  }

  const updateSet = (actIdx: number, setIdx: number, patch: Partial<SetItem>) =>
    setData((d) => ({
      ...d,
      activities: d.activities.map((a, ai) =>
        ai === actIdx ? { ...a, sets: a.sets.map((s, si) => (si === setIdx ? { ...s, ...patch } : s)) } : a
      ),
    }))
  const removeSet = (actIdx: number, setIdx: number) =>
    setData((d) => ({
      ...d,
      activities: d.activities.map((a, ai) =>
        ai === actIdx ? { ...a, sets: a.sets.filter((_, si) => si !== setIdx) } : a
      ),
    }))
  const addSet = (actIdx: number) =>
    setData((d) => ({
      ...d,
      activities: d.activities.map((a, ai) =>
        ai === actIdx ? { ...a, sets: [...a.sets, blankSet()] } : a
      ),
    }))

  const updatePostSymptom = (i: number, patch: Partial<PostSessionSymptom>) =>
    setData((d) => ({
      ...d,
      post_session_symptoms: d.post_session_symptoms.map((s, idx) => idx === i ? { ...s, ...patch } : s),
    }))
  const removePostSymptom = (i: number) =>
    setData((d) => ({ ...d, post_session_symptoms: d.post_session_symptoms.filter((_, idx) => idx !== i) }))
  const addPostSymptom = () =>
    setData((d) => ({ ...d, post_session_symptoms: [...d.post_session_symptoms, { name: '', location: null }] }))

  return (
    <div className="flex flex-col gap-5 w-full max-w-lg mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="font-headline text-headline-md font-bold text-on-surface">Review entry</h2>
        <p className="text-caption text-on-surface-variant mt-1">Edit anything Claude got wrong, then save.</p>
      </div>

      {/* Ambiguities */}
      {data.ambiguities.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.ambiguities.map((a, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl bg-tertiary-container/30 border border-tertiary-container/60 px-3 py-2.5">
              <Icon name="info" size={16} fill={1} className="text-on-tertiary-container shrink-0 mt-0.5" />
              <p className="text-caption leading-relaxed text-on-surface">{a}</p>
            </div>
          ))}
        </div>
      )}

      {/* Transcript collapsible */}
      <button
        onClick={() => setShowTranscript((v) => !v)}
        className="flex items-center gap-1.5 text-caption text-on-surface-variant hover:text-on-surface transition-colors text-left"
      >
        <Icon name={showTranscript ? 'expand_less' : 'expand_more'} size={16} />
        {showTranscript ? 'Hide' : 'Show'} transcript
      </button>
      {showTranscript && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 -mt-2">
          <p className="text-caption text-on-surface-variant leading-relaxed">{transcript}</p>
        </div>
      )}

      {/* Session meta */}
      <section className="flex flex-col gap-3">
        <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">Session</p>
        <div className="flex flex-col gap-1.5">
          <label className="text-label-sm text-on-surface-variant">Session label</label>
          <Input
            value={data.session_label}
            onChange={(e) => setData((d) => ({ ...d, session_label: e.target.value }))}
            placeholder="e.g. chest and triceps"
          />
        </div>
      </section>

      {/* ── Activities ── */}
      <section className="flex flex-col gap-3">
        <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">
          Activities ({data.activities.length})
        </p>

        {data.activities.map((activity, ai) => {
          const badgeCls = ACTIVITY_BADGE[activity.type] ?? 'bg-surface-container-high text-on-surface-variant'
          return (
            <div key={ai} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
              {/* Activity header */}
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-label-sm font-semibold uppercase shrink-0 ${badgeCls}`}>
                  {activity.type}
                </span>
                <Input
                  value={activity.name}
                  onChange={(e) => updateActivity(ai, { name: e.target.value })}
                  placeholder="Exercise name"
                  className="flex-1 font-semibold"
                />
                <button
                  onClick={() => removeActivity(ai)}
                  className="text-on-surface-variant hover:text-error transition-colors p-1 shrink-0"
                  aria-label="Remove"
                >
                  <Icon name="delete" size={18} />
                </button>
              </div>

              {/* Lifting: sets table */}
              {activity.type === 'lifting' && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-1.5 px-1">
                    <span className="text-label-sm text-on-surface-variant w-5">#</span>
                    <span className="text-label-sm text-on-surface-variant">Reps</span>
                    <span className="text-label-sm text-on-surface-variant">kg</span>
                    <span className="text-label-sm text-on-surface-variant">RPE</span>
                    <span className="w-5" />
                  </div>
                  {activity.sets.map((set, si) => (
                    <div key={si} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-1.5 items-center font-mono">
                      <span className="text-caption text-on-surface-variant w-5 text-right">{si + 1}</span>
                      <Input
                        type="number"
                        value={set.reps ?? ''}
                        onChange={(e) => updateSet(ai, si, { reps: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="—"
                        className="h-8 px-2 text-center text-caption font-mono"
                        min={0}
                      />
                      <Input
                        type="number"
                        value={set.weight_kg ?? ''}
                        onChange={(e) => updateSet(ai, si, { weight_kg: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="—"
                        className="h-8 px-2 text-center text-caption font-mono"
                        min={0}
                        step={0.5}
                      />
                      <Input
                        type="number"
                        value={set.rpe ?? ''}
                        onChange={(e) => updateSet(ai, si, { rpe: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="—"
                        className="h-8 px-2 text-center text-caption font-mono"
                        min={1}
                        max={10}
                      />
                      <button
                        onClick={() => removeSet(ai, si)}
                        className="text-on-surface-variant hover:text-error transition-colors w-5"
                        aria-label="Remove set"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addSet(ai)}
                    className="flex items-center gap-1 text-caption text-primary hover:brightness-110 transition-colors font-semibold mt-1"
                  >
                    <Icon name="add" size={14} /> Add set
                  </button>
                </div>
              )}

              {/* Cardio / Sport */}
              {(activity.type === 'cardio' || activity.type === 'sport') && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-label-sm text-on-surface-variant">Duration (min)</label>
                      <Input
                        type="number"
                        value={activity.duration_minutes ?? ''}
                        onChange={(e) => updateActivity(ai, { duration_minutes: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="—"
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-label-sm text-on-surface-variant">Intensity notes</label>
                    <Input
                      value={activity.intensity_notes ?? ''}
                      onChange={(e) => updateActivity(ai, { intensity_notes: e.target.value || null })}
                      placeholder="e.g. light, moderate, exhaustive"
                    />
                  </div>
                </div>
              )}

              {/* Activity notes */}
              <div className="flex flex-col gap-1">
                <label className="text-label-sm text-on-surface-variant">Notes (optional)</label>
                <Input
                  value={activity.notes ?? ''}
                  onChange={(e) => updateActivity(ai, { notes: e.target.value || null })}
                  placeholder="e.g. bodyweight, machine, felt strong"
                />
              </div>
            </div>
          )
        })}

        {addingActivity ? (
          <div className="flex gap-2">
            {(['lifting', 'cardio', 'sport'] as ActivityType[]).map((t) => {
              const cls = ACTIVITY_BADGE[t]
              return (
                <button
                  key={t}
                  onClick={() => addActivity(t)}
                  className={`flex-1 rounded-xl py-2.5 text-caption font-semibold capitalize transition-all hover:brightness-95 ${cls}`}
                >
                  {t}
                </button>
              )
            })}
            <button onClick={() => setAddingActivity(false)} className="text-caption text-on-surface-variant px-2">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingActivity(true)}
            className="flex items-center gap-1 text-caption text-primary hover:brightness-110 transition-colors font-semibold text-left"
          >
            <Icon name="add" size={16} /> Add activity
          </button>
        )}
      </section>

      {/* Session notes */}
      <section className="flex flex-col gap-1.5">
        <label className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">Session notes</label>
        <Textarea
          value={data.session_notes ?? ''}
          onChange={(e) => setData((d) => ({ ...d, session_notes: e.target.value || null }))}
          placeholder="How did the session feel overall?"
          rows={2}
        />
      </section>

      {/* Perceived effort */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">Perceived effort (RPE)</label>
          {data.perceived_effort !== null && (
            <span className="font-headline text-headline-md font-bold text-primary tabular-nums">{data.perceived_effort}</span>
          )}
        </div>
        {data.perceived_effort === null ? (
          <button
            onClick={() => setData((d) => ({ ...d, perceived_effort: 7 }))}
            className="text-caption text-primary text-left hover:underline"
          >
            Not specified — tap to set
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={10}
              value={data.perceived_effort}
              onChange={(e) => setData((d) => ({ ...d, perceived_effort: Number(e.target.value) }))}
              className="flex-1"
            />
            <button
              onClick={() => setData((d) => ({ ...d, perceived_effort: null }))}
              className="text-caption text-on-surface-variant hover:text-on-surface"
            >
              Clear
            </button>
          </div>
        )}
      </section>

      {/* Post-session symptoms */}
      <section className="flex flex-col gap-3">
        <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">
          Post-session symptoms
        </p>
        {data.post_session_symptoms.map((sym, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={sym.name}
              onChange={(e) => updatePostSymptom(i, { name: e.target.value })}
              placeholder="e.g. knee pain"
              className="flex-1"
            />
            <Input
              value={sym.location ?? ''}
              onChange={(e) => updatePostSymptom(i, { location: e.target.value || null })}
              placeholder="location"
              className="w-28"
            />
            <button
              onClick={() => removePostSymptom(i)}
              className="text-on-surface-variant hover:text-error transition-colors p-1 shrink-0"
              aria-label="Remove"
            >
              <Icon name="delete" size={18} />
            </button>
          </div>
        ))}
        <button
          onClick={addPostSymptom}
          className="flex items-center gap-1 text-caption text-primary hover:brightness-110 transition-colors font-semibold text-left"
        >
          <Icon name="add" size={16} /> Add post-session symptom
        </button>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <VocaButton variant="primary" onClick={() => onSave(data)} disabled={isSaving} className="w-full">
          {isSaving ? 'Saving…' : 'Save entry'}
        </VocaButton>
        <VocaButton variant="ghost" onClick={() => router.push('/')} disabled={isSaving} className="w-full">
          Discard
        </VocaButton>
      </div>
    </div>
  )
}
