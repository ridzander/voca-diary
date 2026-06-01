'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/ms-icon'
import { VocaButton } from '@/components/ui/voca-card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FACTOR_CATEGORIES } from '@/lib/types'
import type {
  DailyCheckinExtraction,
  SleepBlock, MoodBlock, NutritionBlock, SymptomsBlock, WorkoutBlock,
  MealItem, SymptomItem, FactorItem, ActivityItem, SetItem,
  SleepQuality, MoodLabel, MoodSource, MealType, SessionType,
} from '@/lib/types'

// ── Small shared primitives ───────────────────────────────────────────────────

function SourceBadge({ source }: { source: MoodSource }) {
  const map: Record<MoodSource, { label: string; cls: string }> = {
    explicit: { label: 'stated', cls: 'bg-primary-container text-on-primary-container' },
    inferred: { label: 'inferred', cls: 'bg-secondary-container text-on-secondary-container' },
    unknown:  { label: 'unknown',  cls: 'bg-surface-container-high text-on-surface-variant' },
  }
  const { label, cls } = map[source] ?? map.unknown
  return <span className={`rounded-full px-2 py-0.5 text-label-sm font-medium ${cls}`}>{label}</span>
}

function ToggleGroup<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[]
  value: T | null
  onChange: (v: T | null) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? null : opt.value)}
          className={`px-3 py-1 rounded-full text-label-sm font-medium transition-colors ${
            value === opt.value
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function SectionCard({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 relative">
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
        >
          <Icon name="delete" size={18} />
        </button>
      )}
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-3">{children}</p>
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-caption text-on-surface-variant mb-1">{children}</p>
}

function NullBlock({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 flex items-center justify-between">
      <span className="text-body-md text-on-surface-variant italic">Not mentioned</span>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1 text-primary text-label-sm font-semibold hover:opacity-80 transition-opacity"
      >
        <Icon name="add" size={16} />
        Add {label}
      </button>
    </div>
  )
}

// ── Sleep ─────────────────────────────────────────────────────────────────────

function SleepSection({
  block, onChange, onRemove,
}: {
  block: SleepBlock
  onChange: (b: SleepBlock) => void
  onRemove: () => void
}) {
  const qualityOpts: { value: SleepQuality; label: string }[] = [
    { value: 'good', label: 'Good' },
    { value: 'okay', label: 'Okay' },
    { value: 'bad', label: 'Bad' },
  ]
  return (
    <SectionCard onRemove={onRemove}>
      <SectionLabel>Sleep</SectionLabel>
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel>Hours</FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={block.hours ?? ''}
              onChange={(e) => onChange({ ...block, hours: e.target.value === '' ? null : Number(e.target.value) })}
              className="w-24"
              placeholder="6.5"
            />
            <span className="text-on-surface-variant text-body-md">h</span>
          </div>
        </div>
        <div>
          <FieldLabel>Quality</FieldLabel>
          <ToggleGroup<SleepQuality> options={qualityOpts} value={block.quality} onChange={(v) => onChange({ ...block, quality: v })} />
        </div>
        <div>
          <FieldLabel>Wake state</FieldLabel>
          <Input
            value={block.wake_state ?? ''}
            onChange={(e) => onChange({ ...block, wake_state: e.target.value || null })}
            placeholder="groggy, rested, tired…"
          />
        </div>
      </div>
    </SectionCard>
  )
}

// ── Mood ──────────────────────────────────────────────────────────────────────

function labelFromScore(score: number): MoodLabel {
  if (score <= 3) return 'bad'
  if (score <= 6) return 'okay'
  return 'good'
}

function MoodSection({
  block, onChange, onRemove,
}: {
  block: MoodBlock
  onChange: (b: MoodBlock) => void
  onRemove: () => void
}) {
  const labelOpts: { value: MoodLabel; label: string }[] = [
    { value: 'good', label: 'Good' },
    { value: 'okay', label: 'Okay' },
    { value: 'bad', label: 'Bad' },
  ]
  const score = block.score ?? 5

  return (
    <SectionCard onRemove={onRemove}>
      <SectionLabel>Mood</SectionLabel>
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-end justify-between mb-1">
            <FieldLabel>Score</FieldLabel>
            <span className="font-headline text-display-lg-mobile font-bold text-on-surface tabular-nums leading-none">{score}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={score}
            onChange={(e) => {
              const s = Number(e.target.value)
              onChange({ ...block, score: s, label: labelFromScore(s) })
            }}
            className="w-full severity-gradient"
          />
          <div className="flex justify-between mt-1">
            <span className="text-caption text-on-surface-variant">1</span>
            <span className="text-caption text-on-surface-variant">10</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FieldLabel>Label</FieldLabel>
            <SourceBadge source={block.source} />
          </div>
          <ToggleGroup<MoodLabel> options={labelOpts} value={block.label} onChange={(v) => onChange({ ...block, label: v })} />
        </div>
        <div>
          <FieldLabel>Notes</FieldLabel>
          <Input
            value={block.notes ?? ''}
            onChange={(e) => onChange({ ...block, notes: e.target.value || null })}
            placeholder="felt productive, low energy…"
          />
        </div>
      </div>
    </SectionCard>
  )
}

// ── Nutrition ─────────────────────────────────────────────────────────────────

function NutritionSection({
  block, onChange, onRemove,
}: {
  block: NutritionBlock
  onChange: (b: NutritionBlock) => void
  onRemove: () => void
}) {
  const [drinkInput, setDrinkInput] = useState('')
  const mealTypes: { value: MealType; label: string }[] = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
    { value: 'general', label: 'General' },
  ]

  const updateMeal = (i: number, patch: Partial<MealItem>) =>
    onChange({ ...block, meals: block.meals.map((m, idx) => idx === i ? { ...m, ...patch } : m) })
  const removeMeal = (i: number) =>
    onChange({ ...block, meals: block.meals.filter((_, idx) => idx !== i) })
  const addMeal = () =>
    onChange({ ...block, meals: [...block.meals, { meal: 'general', items: [] }] })

  const updateMealItem = (mealIdx: number, itemIdx: number, val: string) =>
    updateMeal(mealIdx, { items: block.meals[mealIdx].items.map((it, idx) => idx === itemIdx ? val : it) })
  const removeMealItem = (mealIdx: number, itemIdx: number) =>
    updateMeal(mealIdx, { items: block.meals[mealIdx].items.filter((_, idx) => idx !== itemIdx) })
  const addMealItem = (mealIdx: number) =>
    updateMeal(mealIdx, { items: [...block.meals[mealIdx].items, ''] })

  const addDrink = (val: string) => {
    const trimmed = val.trim()
    if (trimmed && !block.drinks.includes(trimmed))
      onChange({ ...block, drinks: [...block.drinks, trimmed] })
    setDrinkInput('')
  }
  const removeDrink = (i: number) =>
    onChange({ ...block, drinks: block.drinks.filter((_, idx) => idx !== i) })

  return (
    <SectionCard onRemove={onRemove}>
      <SectionLabel>Nutrition</SectionLabel>
      <div className="flex flex-col gap-4">
        {/* Meals */}
        <div>
          <FieldLabel>Meals</FieldLabel>
          <div className="flex flex-col gap-3">
            {block.meals.map((meal, mealIdx) => (
              <div key={mealIdx} className="border border-outline-variant rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <select
                    value={meal.meal ?? 'general'}
                    onChange={(e) => updateMeal(mealIdx, { meal: e.target.value as MealType })}
                    className="text-label-sm font-medium text-on-surface bg-transparent outline-none border border-outline-variant rounded-lg px-2 py-1"
                  >
                    {mealTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <button type="button" onClick={() => removeMeal(mealIdx)} className="text-on-surface-variant hover:text-error transition-colors">
                    <Icon name="close" size={16} />
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {meal.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateMealItem(mealIdx, itemIdx, e.target.value)}
                        placeholder="food item"
                        className="flex-1 h-9 text-body-md"
                      />
                      <button type="button" onClick={() => removeMealItem(mealIdx, itemIdx)} className="text-on-surface-variant hover:text-error transition-colors">
                        <Icon name="close" size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addMealItem(mealIdx)}
                    className="text-label-sm text-primary font-semibold flex items-center gap-1 mt-1 hover:opacity-80"
                  >
                    <Icon name="add" size={14} /> Add item
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addMeal}
              className="text-label-sm text-primary font-semibold flex items-center gap-1 hover:opacity-80"
            >
              <Icon name="add" size={16} /> Add meal
            </button>
          </div>
        </div>

        {/* Drinks */}
        <div>
          <FieldLabel>Drinks</FieldLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {block.drinks.map((d, i) => (
              <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface text-label-sm">
                {d}
                <button type="button" onClick={() => removeDrink(i)} className="text-on-surface-variant hover:text-error ml-0.5">
                  <Icon name="close" size={12} />
                </button>
              </span>
            ))}
          </div>
          <Input
            value={drinkInput}
            onChange={(e) => setDrinkInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addDrink(drinkInput) } }}
            onBlur={() => { if (drinkInput.trim()) addDrink(drinkInput) }}
            placeholder="coffee, tea… (press Enter to add)"
            className="text-body-md"
          />
        </div>

        {/* Protein */}
        <div>
          <FieldLabel>Protein</FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={500}
              value={block.protein_grams ?? ''}
              onChange={(e) => onChange({ ...block, protein_grams: e.target.value === '' ? null : Number(e.target.value) })}
              className="w-24"
              placeholder="100"
            />
            <span className="text-on-surface-variant text-body-md">g</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <FieldLabel>Notes</FieldLabel>
          <Input
            value={block.notes ?? ''}
            onChange={(e) => onChange({ ...block, notes: e.target.value || null })}
            placeholder="optional notes"
          />
        </div>
      </div>
    </SectionCard>
  )
}

// ── Symptoms ──────────────────────────────────────────────────────────────────

function SymptomsSection({
  block, onChange, onRemove,
}: {
  block: SymptomsBlock
  onChange: (b: SymptomsBlock) => void
  onRemove: () => void
}) {
  const updateItem = (i: number, patch: Partial<SymptomItem>) =>
    onChange({ ...block, items: block.items.map((s, idx) => idx === i ? { ...s, ...patch } : s) })
  const removeItem = (i: number) =>
    onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) })
  const addItem = () =>
    onChange({ ...block, items: [...block.items, { name: '', location: null, severity: null, severity_source: 'unknown', quality: null }] })

  const updateFactor = (i: number, patch: Partial<FactorItem>) =>
    onChange({ ...block, factors: block.factors.map((f, idx) => idx === i ? { ...f, ...patch } : f) })
  const removeFactor = (i: number) =>
    onChange({ ...block, factors: block.factors.filter((_, idx) => idx !== i) })
  const addFactor = () =>
    onChange({ ...block, factors: [...block.factors, { name: '', category: 'other', time_offset_days: 0, detail: null }] })

  return (
    <SectionCard onRemove={onRemove}>
      <SectionLabel>Symptoms</SectionLabel>
      <div className="flex flex-col gap-4">
        {block.items.map((item, i) => (
          <div key={i} className="border border-outline-variant rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <SourceBadge source={item.severity_source} />
              <button type="button" onClick={() => removeItem(i)} className="text-on-surface-variant hover:text-error transition-colors">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <FieldLabel>Name</FieldLabel>
                <Input value={item.name} onChange={(e) => updateItem(i, { name: e.target.value })} placeholder="headache, knee pain…" />
              </div>
              <div>
                <FieldLabel>Location</FieldLabel>
                <Input value={item.location ?? ''} onChange={(e) => updateItem(i, { location: e.target.value || null })} placeholder="optional" />
              </div>
              <div>
                <div className="flex items-end justify-between mb-1">
                  <FieldLabel>Severity</FieldLabel>
                  <span className="font-headline text-headline-md font-bold text-on-surface tabular-nums">{item.severity ?? '—'}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={item.severity ?? 5}
                  onChange={(e) => updateItem(i, { severity: Number(e.target.value), severity_source: 'explicit' })}
                  className="w-full severity-gradient"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-caption text-on-surface-variant">1</span>
                  <span className="text-caption text-on-surface-variant">10</span>
                </div>
              </div>
              <div>
                <FieldLabel>Quality</FieldLabel>
                <Input value={item.quality ?? ''} onChange={(e) => updateItem(i, { quality: e.target.value || null })} placeholder="sharp, dull, throbbing…" />
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={addItem} className="text-label-sm text-primary font-semibold flex items-center gap-1 hover:opacity-80">
          <Icon name="add" size={16} /> Add symptom
        </button>

        {/* Factors */}
        {(block.factors.length > 0 || true) && (
          <div>
            <FieldLabel>Factors</FieldLabel>
            <div className="flex flex-col gap-2">
              {block.factors.map((factor, i) => (
                <div key={i} className="border border-outline-variant rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-label-sm text-on-surface-variant font-medium">Factor {i + 1}</span>
                    <button type="button" onClick={() => removeFactor(i)} className="text-on-surface-variant hover:text-error transition-colors">
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Input value={factor.name} onChange={(e) => updateFactor(i, { name: e.target.value })} placeholder="factor name" />
                    <div className="flex gap-2">
                      <select
                        value={factor.category}
                        onChange={(e) => updateFactor(i, { category: e.target.value as FactorItem['category'] })}
                        className="flex-1 text-label-sm text-on-surface bg-surface border border-outline-variant rounded-lg px-2 py-1.5 outline-none"
                      >
                        {FACTOR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={factor.time_offset_days}
                          onChange={(e) => updateFactor(i, { time_offset_days: Number(e.target.value) })}
                          className="w-16 h-9"
                          placeholder="0"
                        />
                        <span className="text-caption text-on-surface-variant whitespace-nowrap">days</span>
                      </div>
                    </div>
                    <Input value={factor.detail ?? ''} onChange={(e) => updateFactor(i, { detail: e.target.value || null })} placeholder="detail (optional)" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addFactor} className="text-label-sm text-primary font-semibold flex items-center gap-1 hover:opacity-80">
                <Icon name="add" size={16} /> Add factor
              </button>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

// ── Workout ───────────────────────────────────────────────────────────────────

function WorkoutSection({
  block, onChange, onRemove,
}: {
  block: WorkoutBlock
  onChange: (b: WorkoutBlock) => void
  onRemove: () => void
}) {
  const sessionTypes: { value: SessionType; label: string }[] = [
    { value: 'lifting', label: 'Lifting' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'sport', label: 'Sport' },
    { value: 'mixed', label: 'Mixed' },
  ]

  const updateActivity = (i: number, patch: Partial<ActivityItem>) =>
    onChange({ ...block, activities: block.activities.map((a, idx) => idx === i ? { ...a, ...patch } : a) })
  const removeActivity = (i: number) =>
    onChange({ ...block, activities: block.activities.filter((_, idx) => idx !== i) })
  const addActivity = () =>
    onChange({ ...block, activities: [...block.activities, { type: 'lifting', name: '', sets: [], duration_minutes: null, intensity_notes: null, notes: null }] })

  const updateSet = (actIdx: number, setIdx: number, patch: Partial<SetItem>) =>
    updateActivity(actIdx, { sets: block.activities[actIdx].sets.map((s, idx) => idx === setIdx ? { ...s, ...patch } : s) })
  const removeSet = (actIdx: number, setIdx: number) =>
    updateActivity(actIdx, { sets: block.activities[actIdx].sets.filter((_, idx) => idx !== setIdx) })
  const addSet = (actIdx: number) =>
    updateActivity(actIdx, { sets: [...block.activities[actIdx].sets, { reps: null, weight_kg: null, rpe: null, notes: null }] })

  if (!block.did_workout) {
    return (
      <SectionCard onRemove={onRemove}>
        <SectionLabel>Workout</SectionLabel>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-lg">
            <Icon name="block" size={18} className="text-on-surface-variant" />
            <span className="text-body-md text-on-surface font-medium">Skipped</span>
          </div>
          <div>
            <FieldLabel>Reason</FieldLabel>
            <Input
              value={block.skip_reason ?? ''}
              onChange={(e) => onChange({ ...block, skip_reason: e.target.value || null })}
              placeholder="why skipped…"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...block, did_workout: true, skip_reason: null })}
            className="text-label-sm text-primary font-semibold flex items-center gap-1 hover:opacity-80"
          >
            <Icon name="undo" size={16} /> Actually I did work out
          </button>
        </div>
      </SectionCard>
    )
  }

  return (
    <SectionCard onRemove={onRemove}>
      <SectionLabel>Workout</SectionLabel>
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel>Session label</FieldLabel>
          <Input
            value={block.session_label ?? ''}
            onChange={(e) => onChange({ ...block, session_label: e.target.value || null })}
            placeholder="chest and triceps, back day…"
          />
        </div>
        <div>
          <FieldLabel>Session type</FieldLabel>
          <ToggleGroup<SessionType> options={sessionTypes} value={block.session_type} onChange={(v) => onChange({ ...block, session_type: v })} />
        </div>

        {/* Activities */}
        <div>
          <FieldLabel>Activities</FieldLabel>
          <div className="flex flex-col gap-3">
            {block.activities.map((activity, actIdx) => (
              <div key={actIdx} className="border border-outline-variant rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container text-label-sm font-medium capitalize">
                    {activity.type}
                  </span>
                  <button type="button" onClick={() => removeActivity(actIdx)} className="text-on-surface-variant hover:text-error transition-colors">
                    <Icon name="close" size={16} />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <select
                      value={activity.type}
                      onChange={(e) => updateActivity(actIdx, { type: e.target.value as ActivityItem['type'] })}
                      className="text-label-sm text-on-surface bg-surface border border-outline-variant rounded-lg px-2 py-1.5 outline-none"
                    >
                      <option value="lifting">Lifting</option>
                      <option value="cardio">Cardio</option>
                      <option value="sport">Sport</option>
                    </select>
                    <Input value={activity.name} onChange={(e) => updateActivity(actIdx, { name: e.target.value })} placeholder="exercise name" className="flex-1 h-9" />
                  </div>

                  {activity.type === 'lifting' ? (
                    <div>
                      <p className="text-caption text-on-surface-variant mb-1">Sets</p>
                      {activity.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex items-center gap-2 mb-1.5">
                          <Input type="number" value={set.reps ?? ''} onChange={(e) => updateSet(actIdx, setIdx, { reps: e.target.value === '' ? null : Number(e.target.value) })} placeholder="reps" className="w-16 h-8 text-body-md" />
                          <Input type="number" value={set.weight_kg ?? ''} onChange={(e) => updateSet(actIdx, setIdx, { weight_kg: e.target.value === '' ? null : Number(e.target.value) })} placeholder="kg" className="w-16 h-8 text-body-md" />
                          <Input type="number" value={set.rpe ?? ''} onChange={(e) => updateSet(actIdx, setIdx, { rpe: e.target.value === '' ? null : Number(e.target.value) })} placeholder="RPE" className="w-16 h-8 text-body-md" />
                          <button type="button" onClick={() => removeSet(actIdx, setIdx)} className="text-on-surface-variant hover:text-error transition-colors">
                            <Icon name="close" size={14} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addSet(actIdx)} className="text-label-sm text-primary font-semibold flex items-center gap-1 hover:opacity-80">
                        <Icon name="add" size={14} /> Add set
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <p className="text-caption text-on-surface-variant mb-1">Duration (min)</p>
                        <Input type="number" value={activity.duration_minutes ?? ''} onChange={(e) => updateActivity(actIdx, { duration_minutes: e.target.value === '' ? null : Number(e.target.value) })} placeholder="30" className="h-9" />
                      </div>
                      <div className="flex-1">
                        <p className="text-caption text-on-surface-variant mb-1">Intensity notes</p>
                        <Input value={activity.intensity_notes ?? ''} onChange={(e) => updateActivity(actIdx, { intensity_notes: e.target.value || null })} placeholder="10K steps…" className="h-9" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button type="button" onClick={addActivity} className="text-label-sm text-primary font-semibold flex items-center gap-1 hover:opacity-80">
              <Icon name="add" size={16} /> Add activity
            </button>
          </div>
        </div>

        <div>
          <FieldLabel>Session notes</FieldLabel>
          <Input value={block.session_notes ?? ''} onChange={(e) => onChange({ ...block, session_notes: e.target.value || null })} placeholder="optional" />
        </div>
        <div>
          <FieldLabel>Perceived effort (1–10)</FieldLabel>
          <Input type="number" min={1} max={10} value={block.perceived_effort ?? ''} onChange={(e) => onChange({ ...block, perceived_effort: e.target.value === '' ? null : Number(e.target.value) })} placeholder="7" className="w-24" />
        </div>

        <button
          type="button"
          onClick={() => onChange({ ...block, did_workout: false, activities: [], session_type: null, session_label: null })}
          className="text-label-sm text-on-surface-variant font-semibold flex items-center gap-1 hover:opacity-80"
        >
          <Icon name="undo" size={16} /> Mark as skipped instead
        </button>
      </div>
    </SectionCard>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  extracted: DailyCheckinExtraction
  transcript: string
  onSave: (edited: DailyCheckinExtraction) => Promise<void>
}

export function DailyCheckinReviewCard({ extracted, transcript, onSave }: Props) {
  const [sleep, setSleep]         = useState<SleepBlock | null>(extracted.sleep)
  const [mood, setMood]           = useState<MoodBlock | null>(extracted.mood)
  const [nutrition, setNutrition] = useState<NutritionBlock | null>(extracted.nutrition)
  const [symptoms, setSymptoms]   = useState<SymptomsBlock | null>(extracted.symptoms)
  const [workout, setWorkout]     = useState<WorkoutBlock | null>(extracted.workout)
  const [dailyNotes, setDailyNotes] = useState(extracted.daily_notes ?? '')
  const [showTranscript, setShowTranscript] = useState(false)
  const [saving, setSaving] = useState(false)

  const topAmbiguities = extracted.ambiguities ?? []

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        sleep,
        mood,
        nutrition,
        symptoms,
        workout,
        daily_notes: dailyNotes || null,
        ambiguities: extracted.ambiguities,
        raw_transcript: extracted.raw_transcript,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Transcript collapsible */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTranscript((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">Raw transcript</span>
          <Icon name={showTranscript ? 'expand_less' : 'expand_more'} size={20} className="text-on-surface-variant" />
        </button>
        {showTranscript && (
          <div className="px-4 pb-4 border-t border-outline-variant">
            <p className="text-body-md text-on-surface leading-relaxed mt-3">{transcript}</p>
          </div>
        )}
      </div>

      {/* Ambiguities banner */}
      {topAmbiguities.length > 0 && (
        <div className="flex gap-3 px-4 py-3 rounded-xl bg-secondary-container border border-outline-variant">
          <Icon name="info" size={18} className="text-on-secondary-container shrink-0 mt-0.5" />
          <div>
            <p className="text-label-sm font-semibold text-on-secondary-container mb-1">AI flagged these for your review</p>
            <ul className="flex flex-col gap-1">
              {topAmbiguities.map((a, i) => (
                <li key={i} className="text-caption text-on-secondary-container">· {a}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Sleep */}
      <div>
        {sleep === null ? (
          <NullBlock label="sleep" onAdd={() => setSleep({ hours: null, quality: null, wake_state: null, ambiguities: [] })} />
        ) : (
          <SleepSection block={sleep} onChange={setSleep} onRemove={() => setSleep(null)} />
        )}
      </div>

      {/* Mood */}
      <div>
        {mood === null ? (
          <NullBlock label="mood" onAdd={() => setMood({ score: 5, source: 'inferred', label: 'okay', notes: null })} />
        ) : (
          <MoodSection block={mood} onChange={setMood} onRemove={() => setMood(null)} />
        )}
      </div>

      {/* Nutrition */}
      <div>
        {nutrition === null ? (
          <NullBlock label="nutrition" onAdd={() => setNutrition({ meals: [], drinks: [], protein_grams: null, notes: null, ambiguities: [] })} />
        ) : (
          <NutritionSection block={nutrition} onChange={setNutrition} onRemove={() => setNutrition(null)} />
        )}
      </div>

      {/* Symptoms */}
      <div>
        {symptoms === null ? (
          <NullBlock label="symptoms" onAdd={() => setSymptoms({ items: [], factors: [] })} />
        ) : (
          <SymptomsSection block={symptoms} onChange={setSymptoms} onRemove={() => setSymptoms(null)} />
        )}
      </div>

      {/* Workout */}
      <div>
        {workout === null ? (
          <NullBlock label="workout" onAdd={() => setWorkout({ did_workout: true, skip_reason: null, session_type: null, session_label: null, activities: [], session_notes: null, perceived_effort: null })} />
        ) : (
          <WorkoutSection block={workout} onChange={setWorkout} onRemove={() => setWorkout(null)} />
        )}
      </div>

      {/* Daily notes */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
        <SectionLabel>Daily notes</SectionLabel>
        <Textarea
          value={dailyNotes}
          onChange={(e) => setDailyNotes(e.target.value)}
          placeholder="Productivity, social context, anything else…"
          rows={3}
          className="resize-none text-body-md"
        />
      </div>

      {/* Actions */}
      <VocaButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save check-in'}
      </VocaButton>
    </div>
  )
}
