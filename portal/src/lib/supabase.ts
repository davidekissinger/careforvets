import { createClient } from '@supabase/supabase-js'

// BUILD v2 uses the CareForVets Dev project. These fallback values are intentionally
// browser-safe: the Supabase project URL and publishable key are public client config.
// RLS remains the authorization boundary.
const defaultSupabaseUrl = 'https://nokelqwbbhjsamyndoby.supabase.co'
const defaultSupabasePublishableKey = 'sb_publishable_a0nxV_S4czf_aBvYgU3ZOg_sM8cUXZf'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || defaultSupabasePublishableKey

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
