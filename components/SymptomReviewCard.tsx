'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { VocaButton, SeverityChip } from '@/components/ui/voca-card'
import { Icon } from '@/components/ui/ms-icon'
import type { SymptomExtraction, SymptomItem, FactorItem, FactorCategory, SeveritySource } from '@/lib/types'
import { FACTOR_CATEGORIES } from '@/lib/types'

interface Props {
  extracted: SymptomExtraction
  transcript: string
  onSave: (edited: SymptomExtraction) => Promise<void>
  isSaving: boolean
}

function blankSymptom(): SymptomItem {
  return { name: '', location: null, severity: null, severity_source: 'unknown', quality: null }
}

function blankFactor(): FactorItem {
  return { name: '', category: 'other', time_offset_days: 0, detail: null }
}

function SeveritySourceBadge({ source }: { source: SeveritySource }) {
  const configs = {
    explicit: { label: 'stated', cls: 'bg-primary-container text-on-primary-container' },
    inferred: { label: 'inferred', cls: 'bg-tertiary-container text-on-tertiary-container' },
    unknown:  { label: 'unknown',  cls: 'bg-surface-container-high text-on-surface-variant' },
  }
  const { label, cls } = configs[source] ?? configs.unknown
  return (
    <span className={`rounded-full px-2 py-0.5 text-label-sm font-medium ${cls}`}>
      {label}
    </span>
  )
}

export function SymptomReviewCard({ extracted, transcript, onSave, isSaving }: Props) {
  const router = useRouter()
  const [data, setData] = useState<SymptomExtraction>(extracted)
  const [showTranscript, setShowTranscript] = useState(false)

  const updateSymptom = (i: number, patch: Partial<SymptomItem>) =>
    setData((d) => ({ ...d, symptoms: d.symptoms.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }))
  const removeSymptom = (i: number) =>
    setData((d) => ({ ...d, symptoms: d.symptoms.filter((_, idx) => idx !== i) }))
  const addSymptom = () =>
    setData((d) => ({ ...d, symptoms: [...d.symptoms, blankSymptom()] }))

  const updateFactor = (i: number, patch: Partial<FactorItem>) =>
    setData((d) => ({ ...d, factors: d.factors.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) }))
  const removeFactor = (i: number) =>
    setData((d) => ({ ...d, factors: d.factors.filter((_, idx) => idx !== i) }))
  const addFactor = () =>
    setData((d) => ({ ...d, factors: [...d.factors, blankFactor()] }))

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
              <Icon name="info" size={16} className="text-on-tertiary-container shrink-0 mt-0.5" fill={1} />
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

      {/* ── Symptoms ── */}
      <section className="flex flex-col gap-3">
        <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">
          Symptoms ({data.symptoms.length})
        </p>

        {data.symptoms.map((s, i) => (
          <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
            {/* Name row */}
            <div className="flex items-center gap-2">
              <Input
                value={s.name}
                onChange={(e) => updateSymptom(i, { name: e.target.value })}
                placeholder="Symptom name"
                className="flex-1 font-semibold"
              />
              <button
                onClick={() => removeSymptom(i)}
                className="text-on-surface-variant hover:text-error transition-colors p-1"
                aria-label="Remove"
              >
                <Icon name="delete" size={18} />
              </button>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1">
              <label className="text-label-sm text-on-surface-variant">Location</label>
              <Input
                value={s.location ?? ''}
                onChange={(e) => updateSymptom(i, { location: e.target.value || null })}
                placeholder="e.g. right knee, lower back"
              />
            </div>

            {/* Severity */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-label-sm text-on-surface-variant">Severity</label>
                <div className="flex items-center gap-2">
                  <SeveritySourceBadge source={s.severity_source} />
                  {s.severity !== null && <SeverityChip severity={s.severity} />}
                </div>
              </div>
              {s.severity === null ? (
                <button
                  onClick={() => updateSymptom(i, { severity: 5, severity_source: 'explicit' })}
                  className="text-caption text-primary text-left hover:underline"
                >
                  Not specified — tap to set
                </button>
              ) : (
                <>
                  <div className="text-center mb-1">
                    <span className="font-headline text-headline-md font-bold text-on-surface tabular-nums">
                      {s.severity}
                    </span>
                    <span className="text-caption text-on-surface-variant">/10</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={s.severity}
                      onChange={(e) =>
                        updateSymptom(i, { severity: Number(e.target.value), severity_source: 'explicit' })
                      }
                      className="flex-1 severity-gradient"
                    />
                    <button
                      onClick={() => updateSymptom(i, { severity: null, severity_source: 'unknown' })}
                      className="text-caption text-on-surface-variant hover:text-on-surface"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Quality */}
            <div className="flex flex-col gap-1">
              <label className="text-label-sm text-on-surface-variant">Quality</label>
              <Input
                value={s.quality ?? ''}
                onChange={(e) => updateSymptom(i, { quality: e.target.value || null })}
                placeholder="e.g. sharp, dull, sore, itchy"
              />
            </div>
          </div>
        ))}

        <button
          onClick={addSymptom}
          className="flex items-center gap-1 text-caption text-primary hover:brightness-110 transition-colors font-semibold text-left"
        >
          <Icon name="add" size={16} /> Add symptom
        </button>
      </section>

      {/* ── Factors ── */}
      <section className="flex flex-col gap-3">
        <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">
          Factors ({data.factors.length})
        </p>

        {data.factors.map((f, i) => (
          <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Input
                value={f.name}
                onChange={(e) => updateFactor(i, { name: e.target.value })}
                placeholder="Factor name"
                className="flex-1 font-semibold"
              />
              <button
                onClick={() => removeFactor(i)}
                className="text-on-surface-variant hover:text-error transition-colors p-1"
                aria-label="Remove"
              >
                <Icon name="delete" size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-sm text-on-surface-variant">Category</label>
              <select
                value={f.category}
                onChange={(e) => updateFactor(i, { category: e.target.value as FactorCategory })}
                className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary transition-all"
              >
                {FACTOR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-sm text-on-surface-variant">Days ago (0 = today, -1 = yesterday)</label>
              <Input
                type="number"
                value={f.time_offset_days}
                onChange={(e) => updateFactor(i, { time_offset_days: Number(e.target.value) })}
                max={0}
                className="w-24"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-label-sm text-on-surface-variant">Detail (optional)</label>
              <Input
                value={f.detail ?? ''}
                onChange={(e) => updateFactor(i, { detail: e.target.value || null })}
                placeholder="e.g. 10+ hours, at lunch"
              />
            </div>
          </div>
        ))}

        <button
          onClick={addFactor}
          className="flex items-center gap-1 text-caption text-primary hover:brightness-110 transition-colors font-semibold text-left"
        >
          <Icon name="add" size={16} /> Add factor
        </button>
      </section>

      {/* ── Mood ── */}
      <section className="flex flex-col gap-1.5">
        <label className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">Mood</label>
        <Input
          value={data.mood ?? ''}
          onChange={(e) => setData((d) => ({ ...d, mood: e.target.value || null }))}
          placeholder="e.g. tired, stressed, low energy"
        />
      </section>

      {/* ── Notes ── */}
      <section className="flex flex-col gap-1.5">
        <label className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">Notes</label>
        <Textarea
          value={data.notes ?? ''}
          onChange={(e) => setData((d) => ({ ...d, notes: e.target.value || null }))}
          placeholder="Anything else worth noting"
          rows={3}
        />
      </section>

      {/* ── Actions ── */}
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
