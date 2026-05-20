import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { WorkoutEditClient } from './WorkoutEditClient'
import type { WorkoutEntryRow } from '@/lib/types'

interface Props {
  params: { id: string }
}

export default async function EditWorkoutPage({ params }: Props) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('workout_entries')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()

  return <WorkoutEditClient entry={data as WorkoutEntryRow} />
}
