import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

type AuthState = {
  session: Session | null
  user: User | null
  accountType: string | null
  profileLoading: boolean
  demo: boolean
  loading: boolean
  signOut: () => Promise<void>
  enterDemo: () => void
  exitDemo: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  accountType: null,
  profileLoading: true,
  demo: false,
  loading: true,
  signOut: async () => {},
  enterDemo: () => {},
  exitDemo: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [accountType, setAccountType] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [demo, setDemo] = useState(() => sessionStorage.getItem('cfv_demo_mode') === '1')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setAccountType(null)
      setProfileLoading(false)
      return
    }

    let active = true
    setProfileLoading(true)
    supabase
      .from('profiles')
      .select('user_type')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) {
          setAccountType(data?.user_type ?? null)
          setProfileLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [session?.user.id])

  function enterDemo() {
    sessionStorage.setItem('cfv_demo_mode', '1')
    setDemo(true)
  }

  async function exitDemo() {
    sessionStorage.removeItem('cfv_demo_mode')
    setDemo(false)
    await supabase.auth.signOut()
  }

  async function signOut() {
    await exitDemo()
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, accountType, profileLoading, demo, loading, signOut, enterDemo, exitDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
