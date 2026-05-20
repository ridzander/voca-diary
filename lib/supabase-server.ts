import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Authenticated server client — uses the user's session cookies, respects RLS.
// Use this in API routes and Server Components to get the current user.
export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Components can't set cookies; Route Handlers can.
        }
      },
    },
  })
}

// Service-role server client — bypasses RLS. Only use in trusted server code.
export function createSupabaseServiceRoleClient() {
  return createServerClient(supabaseUrl, supabaseServiceRoleKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  })
}
