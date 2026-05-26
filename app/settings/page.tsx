import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <SettingsClient
      firstName={profile?.first_name ?? ''}
      lastName={profile?.last_name ?? ''}
      email={user.email ?? ''}
    />
  )
}
