import { useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../auth'
import { demoJobs } from '../demoData'
import { supabase } from '../lib/supabase'

type JobDetailRecord = {
  id: string
  title: string
  description: string
  requirements: string | null
  location_text: string | null
  employment_type: string | null
  remote_status: string | null
  compensation_text: string | null
  published_at: string | null
  organizations: { name: string; website: string | null }[] | null
  occupations: { name: string; category: string }[] | null
}

export default function JobDetail() {
  const { jobId } = useParams()
  const { demo } = useAuth()
  const [job, setJob] = useState<JobDetailRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!jobId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    if (demo) {
      const found = demoJobs.find((item) => item.id === jobId)
      if (found) setJob(found as unknown as JobDetailRecord)
      else setNotFound(true)
      setLoading(false)
      return
    }

    supabase
      .from('jobs')
      .select('id,title,description,requirements,location_text,employment_type,remote_status,compensation_text,published_at,organizations(name,website),occupations(name,category)')
      .eq('id', jobId)
      .eq('status', 'published')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setJob(data as unknown as JobDetailRecord)
        setLoading(false)
      })
  }, [jobId, demo])

  if (loading) return <Layout><section className="section-card"><p>Loading job description…</p></section></Layout>

  if (notFound || !job) {
    return <Layout><section className="section-card job-detail-card"><p className="eyebrow">Careers</p><h1>Job not found.</h1><p>This opportunity may no longer be published.</p><NavLink className="button secondary" to="/careers">Back to careers</NavLink></section></Layout>
  }

  const employer = job.organizations?.[0]
  const occupation = job.occupations?.[0]

  return (
    <Layout>
      <NavLink className="back-link" to="/careers">← Back to careers</NavLink>
      <section className="job-detail-hero">
        <p className="eyebrow">{employer?.name ?? 'Employer'} · {occupation?.name ?? 'Opportunity'}</p>
        <h1>{job.title}</h1>
        <div className="job-facts" aria-label="Job facts">
          {job.location_text && <span>{job.location_text}</span>}
          {job.remote_status && <span>{job.remote_status}</span>}
          {job.employment_type && <span>{job.employment_type}</span>}
          {job.compensation_text && <span className="job-pay">{job.compensation_text}</span>}
        </div>
      </section>

      <div className="job-detail-grid">
        <article className="section-card job-description">
          <p className="eyebrow">Job description</p>
          <h2>About this opportunity</h2>
          <p className="preserve-lines">{job.description}</p>
          {job.requirements && <><h2>Qualifications & expectations</h2><p className="preserve-lines">{job.requirements}</p></>}
        </article>

        <aside className="section-card job-sidebar">
          <p className="eyebrow">Career network</p>
          <h2>Interested?</h2>
          <p>{demo ? 'This listing is synthetic test data and is not a real opening.' : 'Build your CareForVets career profile to prepare for application and employer-matching workflows.'}</p>
          <NavLink className="button primary" to="/career-profile">Build my career profile</NavLink>
        </aside>
      </div>
    </Layout>
  )
}
