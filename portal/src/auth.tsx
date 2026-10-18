import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

type AuthState = {
  session: Session | null
  user: User | null
  demo: boolean
  loading: boolean
  signOut: () => Promise<void>
  enterDemo: () => void
  exitDemo: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  demo: false,
  loading: true,
  signOut: async () => {},
  enterDemo: () => {},
  exitDemo: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [demo, setDemo] = useState(() => sessionStorage.getItem('cfv_demo_mode') === '1')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

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

  function enterDemo() {
    sessionStorage.setItem('cfv_demo_mode', '1')
    setDemo(true)
  }

  async function exitDemo() {
    sessionStorage.removeItem('cfv_demo_mode')
    setDemo(false)
    if (supabase) await supabase.auth.signOut()
  }

  async function signOut() {
    await exitDemo()
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, demo, loading, signOut, enterDemo, exitDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
