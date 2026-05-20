import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { WorkoutsTimelineClient } from './WorkoutsTimelineClient'
import { FAB } from '@/components/FAB'
import { BottomNav } from '@/components/ui/bottom-nav'
import { Icon } from '@/components/ui/ms-icon'
import type { WorkoutEntryRow } from '@/lib/types'

export default async function WorkoutsTimelinePage() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('workout_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-surface">
        <p className="text-error text-body-md">Failed to load entries.</p>
      </main>
    )
  }

  const entries = (data ?? []) as WorkoutEntryRow[]

  return (
    <main className="flex min-h-screen flex-col bg-surface pb-28">
      {/* Top bar */}
      <div className="sticky top-0 z-10 glass-nav border-b border-outline-variant">
        <div className="flex items-center gap-3 px-container-padding-mobile h-16 max-w-lg mx-auto">
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <Icon name="arrow_back" size={24} className="text-on-surface-variant" />
          </Link>
          <h1 className="font-headline font-bold text-headline-md text-on-surface flex-1">Workouts</h1>
          <Link
            href="/record/workout"
            className="flex items-center gap-1 text-label-md text-primary hover:opacity-80 font-semibold transition-opacity"
          >
            <Icon name="add" size={18} /> Log
          </Link>
        </div>
      </div>

      <WorkoutsTimelineClient entries={entries} />
      <FAB />
      <BottomNav />
    </main>
  )
}
