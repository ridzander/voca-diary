'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@/components/ui/ms-icon'
import { TopAppBar } from '@/components/ui/top-app-bar'
import { BottomNav } from '@/components/ui/bottom-nav'
import { QuickLogSheet } from '@/components/QuickLogSheet'
import { LogWorkoutSheet } from '@/components/LogWorkoutSheet'
import { FAB } from '@/components/FAB'
import { timeLabel, dayLabel } from '@/lib/date-utils'
import type { RecentEntry } from './page'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function severityLabel(avg: number): string {
  if (avg <= 3) return 'Feeling good'
  if (avg <= 6) return 'Moderate'
  if (avg <= 8) return 'High'
  return 'Severe'
}

interface Props {
  entries: RecentEntry[]
  weekWorkouts: number
  avgSeverityThisWeek: number | null
  hasSymptomData: boolean
  firstName: string | null
  userEmail: string | null
}

export function HomeClient({ entries, weekWorkouts, avgSeverityThisWeek, hasSymptomData, firstName, userEmail }: Props) {
  const [quickLogOpen, setQuickLogOpen] = useState(false)
  const [workoutSheetOpen, setWorkoutSheetOpen] = useState(false)

  const displayName = firstName || (userEmail ? userEmail.split('@')[0] : null)

  return (
    <>
      <TopAppBar />
      <main className="mt-20 pb-28 px-container-padding-mobile max-w-[1140px] mx-auto">

        {/* Greeting */}
        <div className="mb-6 pt-4">
          <p className="text-caption text-on-surface-variant">{greeting()}</p>
          {displayName && (
            <h1 className="font-headline text-headline-md font-bold text-on-surface mt-0.5 capitalize">{displayName}</h1>
          )}
        </div>

        {/* Hero stat card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 mb-4">
          {!hasSymptomData && weekWorkouts === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
              <Icon name="monitoring" size={36} className="text-on-surface-variant/60" />
              <p className="font-headline text-body-lg font-semibold text-on-surface">Start logging</p>
              <p className="text-caption text-on-surface-variant">
                Your weekly stats appear here once you have entries.
              </p>
            </div>
          ) : hasSymptomData && avgSeverityThisWeek !== null ? (
            <div className="flex items-end justify-between">
              <div>
                <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-1">
                  Avg severity · this week
                </p>
                <span className="font-headline text-display-lg-mobile font-bold text-on-surface tabular-nums">
                  {avgSeverityThisWeek.toFixed(1)}
                </span>
                <p className="text-caption text-on-surface-variant mt-1">
                  {severityLabel(avgSeverityThisWeek)}
                </p>
              </div>
              <div className={`flex items-center gap-1 text-label-md font-semibold ${
                avgSeverityThisWeek <= 5 ? 'text-primary' : 'text-error'
              }`}>
                <Icon
                  name={avgSeverityThisWeek <= 5 ? 'trending_down' : 'trending_up'}
                  size={20}
                  fill={1}
                />
                <span>{avgSeverityThisWeek <= 5 ? 'On track' : 'Elevated'}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-end justify-between">
              <div>
                <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-1">
                  Workouts · this week
                </p>
                <span className="font-headline text-display-lg-mobile font-bold text-on-surface tabular-nums">
                  {weekWorkouts}
                </span>
                <p className="text-caption text-on-surface-variant mt-1">
                  {weekWorkouts === 1 ? 'session logged' : 'sessions logged'}
                </p>
              </div>
              <Icon name="fitness_center" size={32} fill={1} className="text-primary/60" />
            </div>
          )}
        </div>

        {/* Daily Check-in — hero action */}
        <Link
          href="/checkin"
          className="relative rounded-xl overflow-hidden h-[160px] active:scale-95 transition-transform duration-150 block mb-3"
        >
          <Image
            src="/images/daily-checkin.jpeg"
            alt=""
            aria-hidden
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
          <div className="absolute inset-0 z-10 flex flex-col items-start justify-end p-4">
            <Icon name="mic" size={22} fill={1} className="text-white mb-1" />
            <p className="font-headline text-headline-md font-semibold text-white drop-shadow-sm leading-tight">Daily Check-in</p>
            <p className="text-caption text-white/80 mt-0.5 drop-shadow-sm">Sleep · Mood · Food · Symptoms · Workout</p>
          </div>
        </Link>

        {/* Secondary action cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/record/symptom"
            className="relative rounded-xl overflow-hidden h-[100px] active:scale-95 transition-transform duration-150 block"
            style={{ backgroundImage: 'url(/images/log-symptom.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
            <div className="absolute inset-0 z-10 flex flex-col items-start justify-end p-3">
              <Icon name="mic" size={18} fill={1} className="text-white mb-0.5" />
              <p className="font-headline text-body-md font-semibold text-white leading-tight">Log Symptom</p>
            </div>
          </Link>

          <button
            onClick={() => setWorkoutSheetOpen(true)}
            className="relative rounded-xl overflow-hidden h-[100px] active:scale-95 transition-transform duration-150 text-left"
            style={{ backgroundImage: 'url(/images/log-workout.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
            <div className="absolute inset-0 z-10 flex flex-col items-start justify-end p-3">
              <Icon name="fitness_center" size={18} fill={1} className="text-white mb-0.5" />
              <p className="font-headline text-body-md font-semibold text-white leading-tight">Log Workout</p>
            </div>
          </button>
        </div>

        {/* Recent entries */}
        {entries.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="font-headline text-body-lg font-semibold text-on-surface">Recent</h2>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-center gap-4"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  entry.kind === 'symptom'
                    ? 'bg-primary-container'
                    : entry.kind === 'workout'
                    ? 'bg-tertiary-container'
                    : 'bg-secondary-container'
                }`}>
                  <Icon
                    name={entry.kind === 'symptom' ? 'mic' : entry.kind === 'workout' ? 'fitness_center' : 'calendar_today'}
                    size={20}
                    fill={1}
                    className={
                      entry.kind === 'symptom'
                        ? 'text-on-primary-container'
                        : entry.kind === 'workout'
                        ? 'text-on-tertiary-container'
                        : 'text-on-secondary-container'
                    }
                  />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  {entry.kind === 'checkin' && (
                    <span className="text-label-sm font-semibold text-on-secondary-container bg-secondary-container rounded-full px-2 py-0.5 w-fit mb-1">
                      Daily Check-in
                    </span>
                  )}
                  <p className="text-body-md font-semibold text-on-surface truncate capitalize">{entry.label}</p>
                  <p className="text-caption text-on-surface-variant">
                    {dayLabel(entry.created_at.slice(0, 10))} · {timeLabel(entry.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Sheets */}
      <QuickLogSheet open={quickLogOpen} onClose={() => setQuickLogOpen(false)} />
      <LogWorkoutSheet open={workoutSheetOpen} onClose={() => setWorkoutSheetOpen(false)} />

      <FAB />
      <BottomNav />
    </>
  )
}
