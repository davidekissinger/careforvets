import { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../auth'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export default function Login() {
  const { user, demo, enterDemo } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [userType, setUserType] = useState('veteran')
  const [message, setMessage] = useState('')
  const isPreview = window.location.hostname.includes('netlify.app') || window.location.hostname === 'localhost'

  if (user || demo) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    if (!supabase) {
      setMessage('Supabase is not configured for this deployment yet.')
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { user_type: userType },
      },
    })

    setMessage(error ? error.message : 'Check your email for a secure sign-in link.')
  }

  function startDemo() {
    enterDemo()
    navigate('/dashboard')
  }

  return (
    <Layout>
      <section className="login-card">
        <p className="eyebrow">Secure access</p>
        <h1>Sign in to CareForVets</h1>
        <p>Use your email to receive a passwordless sign-in link.</p>

        {isPreview && (
          <div className="test-panel">
            <strong>Preview testing</strong>
            <p>Enter test mode to review the portal without creating an account. Career-profile changes stay only in this browser and are labeled synthetic.</p>
            <button className="button secondary" type="button" onClick={startDemo}>Enter test mode</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="account-type">I am joining as</label>
          <select id="account-type" value={userType} onChange={(e) => setUserType(e.target.value)}>
            <option value="veteran">Veteran / candidate</option>
            <option value="employer">Employer representative</option>
            <option value="partner">Partner organization</option>
          </select>
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit">Send sign-in link</button>
        </form>
        {!isSupabaseConfigured && <p className="setup-note">Supabase environment variables are not configured.</p>}
        {message && <p className="form-message" role="status">{message}</p>}
      </section>
    </Layout>
  )
}
