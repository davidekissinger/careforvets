import { FormEvent, useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../auth'
import { supabase } from '../lib/supabase'

type Occupation = { id: string; name: string; category: string }

type DemoProfile = {
  primaryOccupation: string
  summary: string
  years: string
  geographies: string
  remote: string
  status: string
  veteranAttested: boolean
}

export default function CareerProfile() {
  const { user, demo, loading: authLoading } = useAuth()
  const [occupations, setOccupations] = useState<Occupation[]>([])
  const [primaryOccupation, setPrimaryOccupation] = useState('')
  const [summary, setSummary] = useState('')
  const [years, setYears] = useState('')
  const [geographies, setGeographies] = useState('')
  const [remote, setRemote] = useState('open')
  const [status, setStatus] = useState('open')
  const [veteranAttested, setVeteranAttested] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!supabase) return
    supabase.from('occupations').select('id,name,category').eq('active', true).order('category').order('name')
      .then(({ data }) => setOccupations((data ?? []) as Occupation[]))
  }, [])

  useEffect(() => {
    if (demo) {
      const saved = localStorage.getItem('cfv_demo_profile')
      if (saved) {
        const p = JSON.parse(saved) as DemoProfile
        setPrimaryOccupation(p.primaryOccupation ?? '')
        setSummary(p.summary ?? '')
        setYears(p.years ?? '')
        setGeographies(p.geographies ?? '')
        setRemote(p.remote ?? 'open')
        setStatus(p.status ?? 'open')
        setVeteranAttested(Boolean(p.veteranAttested))
      }
      return
    }

    if (!supabase || !user) return
    Promise.all([
      supabase.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('candidate_occupations').select('occupation_id').eq('candidate_id', user.id).eq('primary_flag', true).maybeSingle(),
    ]).then(([profileResult, occupationResult]) => {
      const p = profileResult.data
      if (p) {
        setSummary(p.career_summary ?? '')
        setYears(p.years_experience?.toString() ?? '')
        setGeographies((p.preferred_geographies ?? []).join(', '))
        setRemote(p.remote_preference ?? 'open')
        setStatus(p.active_search_status ?? 'open')
        setVeteranAttested(Boolean(p.veteran_status_attested))
      }
      if (occupationResult.data?.occupation_id) setPrimaryOccupation(occupationResult.data.occupation_id)
    })
  }, [user, demo])

  async function save(event: FormEvent) {
    event.preventDefault()
    setMessage('')

    if (demo) {
      const payload: DemoProfile = { primaryOccupation, summary, years, geographies, remote, status, veteranAttested }
      localStorage.setItem('cfv_demo_profile', JSON.stringify(payload))
      setMessage('Synthetic test profile saved in this browser only.')
      return
    }

    if (!supabase || !user) return

    const { error: profileError } = await supabase.from('candidate_profiles').upsert({
      user_id: user.id,
      veteran_status_attested: veteranAttested,
      career_summary: summary || null,
      years_experience: years ? Number(years) : null,
      preferred_geographies: geographies.split(',').map((x) => x.trim()).filter(Boolean),
      remote_preference: remote,
      active_search_status: status,
    })

    if (profileError) {
      setMessage(profileError.message)
      return
    }

    if (primaryOccupation) {
      await supabase.from('candidate_occupations').delete().eq('candidate_id', user.id)
      const { error } = await supabase.from('candidate_occupations').insert({
        candidate_id: user.id,
        occupation_id: primaryOccupation,
        primary_flag: true,
      })
      if (error) {
        setMessage(error.message)
        return
      }
    }

    setMessage('Career profile saved.')
  }

  if (authLoading) return <Layout><p>Loading…</p></Layout>
  if (!user && !demo) return (
    <Layout>
      <section className="login-card">
        <p className="eyebrow">Career profile</p>
        <h1>Sign in to build your veteran career profile.</h1>
        <p>Your profile is private by default and can be expanded as the employer-matching workflow is released.</p>
        <NavLink className="button primary" to="/login">Sign in</NavLink>
      </section>
    </Layout>
  )

  return (
    <Layout>
      <section className="hero compact">
        <p className="eyebrow">{demo ? 'Synthetic test profile' : 'My career profile'}</p>
        <h1>Translate your experience into the work you want next.</h1>
        <p className="lead">{demo ? 'Use fictional information while testing. Nothing on this form will be written to the CareForVets database.' : 'BUILD v2 starts with a simple profile. Credentials, documents, skills, applications, and employer matching will layer onto this foundation.'}</p>
      </section>

      <form className="profile-form" onSubmit={save}>
        <label className="checkbox-row">
          <input type="checkbox" checked={veteranAttested} onChange={(e) => setVeteranAttested(e.target.checked)} />
          <span>{demo ? 'Synthetic test veteran/service-member attestation' : 'I attest that I am a veteran or service member using this veteran career network.'}</span>
        </label>

        <label>
          Primary career area
          <select value={primaryOccupation} onChange={(e) => setPrimaryOccupation(e.target.value)}>
            <option value="">Select an occupation</option>
            {occupations.map((o) => <option key={o.id} value={o.id}>{o.category} — {o.name}</option>)}
          </select>
        </label>

        <label>
          Career summary
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Use fictional professional information in test mode. Do not include medical information." />
        </label>

        <div className="form-grid">
          <label>
            Years of experience
            <input type="number" min="0" max="80" value={years} onChange={(e) => setYears(e.target.value)} />
          </label>
          <label>
            Work setting preference
            <select value={remote} onChange={(e) => setRemote(e.target.value)}>
              <option value="open">Open to options</option>
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </label>
        </div>

        <label>
          Preferred geographies
          <input value={geographies} onChange={(e) => setGeographies(e.target.value)} placeholder="Toledo, Detroit, Remote" />
        </label>

        <label>
          Search status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">Actively looking</option>
            <option value="passive">Open to the right role</option>
            <option value="not_searching">Not currently searching</option>
          </select>
        </label>

        <button className="button primary" type="submit">Save {demo ? 'test' : 'career'} profile</button>
        {message && <p className="form-message" role="status">{message}</p>}
      </form>
    </Layout>
  )
}
