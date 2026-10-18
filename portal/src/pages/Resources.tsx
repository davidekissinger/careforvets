import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

type Resource = {
  id: string
  title: string
  provider_name: string | null
  description: string
  geography: string | null
  website: string | null
  verification_status: string
  last_reviewed_at: string | null
  service_categories: { name: string }[] | null
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase
      .from('resources')
      .select('id,title,provider_name,description,geography,website,verification_status,last_reviewed_at,service_categories(name)')
      .eq('publication_status', 'published')
      .order('title')
      .then(({ data }) => {
        setResources((data ?? []) as Resource[])
        setLoading(false)
      })
  }, [])

  return (
    <Layout>
      <section className="hero compact">
        <p className="eyebrow">Benefits & resources</p>
        <h1>Useful resources should have a source, status, and review date.</h1>
        <p className="lead">CareForVets is building a reviewed resource network for benefits, service connection, education, entrepreneurship, financial support, housing, legal needs, transportation, and community support.</p>
      </section>

      <section className="section-card">
        {loading ? <p>Loading resources…</p> : resources.length === 0 ? (
          <div className="empty-state">
            <h3>No resources are published yet.</h3>
            <p>Prospective resources will stay unpublished until they have been reviewed and their provenance recorded.</p>
          </div>
        ) : (
          <div className="resource-grid">
            {resources.map((resource) => (
              <article className="resource-card" key={resource.id}>
                <p className="job-meta">{resource.service_categories?.[0]?.name ?? 'Resource'} · {resource.verification_status}</p>
                <h3>{resource.title}</h3>
                {resource.provider_name && <strong>{resource.provider_name}</strong>}
                <p>{resource.description}</p>
                {resource.geography && <p className="muted">{resource.geography}</p>}
                {resource.website && <a href={resource.website} target="_blank" rel="noreferrer">Visit source →</a>}
              </article>
            ))}
          </div>
        )}
      </section>
    </Layout>
  )
}
