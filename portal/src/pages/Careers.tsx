import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

type Job = {
  id: string
  title: string
  location_text: string | null
  employment_type: string | null
  remote_status: string | null
  compensation_text: string | null
  organizations: { name: string }[] | null
  occupations: { name: string }[] | null
}

export default function Careers() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase
      .from('jobs')
      .select('id,title,location_text,employment_type,remote_status,compensation_text,organizations(name),occupations(name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setJobs((data ?? []) as Job[])
        setLoading(false)
      })
  }, [])

  return (
    <Layout>
      <section className="hero compact">
        <p className="eyebrow">Careers</p>
        <h1>A veteran healthcare and operations talent network.</h1>
        <p className="lead">Clinical, therapy, social work, administrative, operations, quality, recruiting, and leadership careers can all live in one veteran-centered network.</p>
        <div className="hero-actions">
          <NavLink className="button primary" to="/career-profile">Build my career profile</NavLink>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading"><div><p className="eyebrow">Open roles</p><h2>Published opportunities</h2></div></div>
        {loading ? <p>Loading opportunities…</p> : jobs.length === 0 ? (
          <div className="empty-state">
            <h3>No published jobs yet.</h3>
            <p>The workforce foundation is live. Employer onboarding and the first verified opportunities are the next release step.</p>
          </div>
        ) : (
          <div className="job-list">
            {jobs.map((job) => (
              <article className="job-card" key={job.id}>
                <div>
                  <p className="job-meta">{job.organizations?.[0]?.name ?? 'Employer'} · {job.occupations?.[0]?.name ?? 'Healthcare / operations'}</p>
                  <h3>{job.title}</h3>
                  <p>{[job.location_text, job.remote_status, job.employment_type].filter(Boolean).join(' · ')}</p>
                </div>
                {job.compensation_text && <strong>{job.compensation_text}</strong>}
              </article>
            ))}
          </div>
        )}
      </section>
    </Layout>
  )
}
