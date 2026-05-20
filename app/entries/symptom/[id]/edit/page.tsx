import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { SymptomEditClient } from './SymptomEditClient'
import type { SymptomEntryRow } from '@/lib/types'

interface Props {
  params: { id: string }
}

export default async function EditSymptomPage({ params }: Props) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('symptom_entries')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()

  return <SymptomEditClient entry={data as SymptomEntryRow} />
}
