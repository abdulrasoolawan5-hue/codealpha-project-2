import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export function getSessionId(): string {
  let sid = localStorage.getItem('commerce_session_id')
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem('commerce_session_id', sid)
  }
  return sid
}
