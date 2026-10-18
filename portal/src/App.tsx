import { FormEvent, ReactNode, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const pillars = [
  { title: 'Care', body: 'Route veterans and families to the right next step without storing clinical records in this platform.', href: '/care' },
  { title: 'Careers', body: 'Build a veteran talent profile, discover roles, and track applications across clinical and administrative careers.', href: '/careers' },
  { title: 'Benefits & Resources', body: 'Find reviewed resources for benefits, education, entrepreneurship, financial support, and community needs.', href: '/resources' },
  { title: 'Partners Network', body: 'Coordinate verified organizations, referral pathways, and closed-loop status updates.', href: '/partners' },
]

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/dashboard" className="brand" aria-label="CareForVets portal home">
          <span className="brand-star">★</span>
          <span><strong>CareForVets</strong><small>Portal</small></span>
        </NavLink>
        <nav aria-label="Portal navigation">
          <NavLink to="/care">Care</NavLink>
          <NavLink to="/careers">Careers</NavLink>
          <NavLink to="/resources">Resources</NavLink>
          <NavLink to="/partners">Partners</NavLink>
        </nav>
      </header>
      <div className="dev-banner">
        BUILD v2 · non-PHI development environment · do not enter diagnoses, medications, medical records, or other clinical information
      </div>
      <main className="page">{children}</main>
    </div>
  )
}

function Dashboard() {
  return (
    <Layout>
      <section className="hero">
        <p className="eyebrow">Veteran services network</p>
        <h1>Care. Careers. Resources. Connection.</h1>
        <p className="lead">
          The CareForVets portal brings veteran employment, resource navigation, partner collaboration, and non-clinical care routing into one accountable system.
        </p>
      </section>
      <section className="card-grid" aria-label="CareForVets service areas">
        {pillars.map((pillar) => (
          <NavLink className="pillar-card" to={pillar.href} key={pillar.title}>
            <span className="card-star">★</span>
            <h2>{pillar.title}</h2>
            <p>{pillar.body}</p>
            <span className="card-link">Open →</span>
          </NavLink>
        ))}
      </section>
      <section className="status-panel">
        <div><span className="status-dot" /><strong>Foundation build</strong></div>
        <p>Authentication, role-based access, workforce entities, partner records, referrals, and audit history will be activated against a dedicated CareForVets Supabase project.</p>
      </section>
    </Layout>
  )
}

function SectionPage({ eyebrow, title, body, items }: { eyebrow: string; title: string; body: string; items: string[] }) {
  return (
    <Layout>
      <section className="hero compact">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lead">{body}</p>
      </section>
      <section className="list-card">
        <h2>BUILD v2 scope</h2>
        <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </Layout>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    if (!supabase) {
      setMessage('Supabase is not connected yet. The portal scaffold is ready for environment configuration.')
      return
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    setMessage(error ? error.message : 'Check your email for a secure sign-in link.')
  }

  return (
    <Layout>
      <section className="login-card">
        <p className="eyebrow">Secure access</p>
        <h1>Sign in to CareForVets</h1>
        <p>Use your email to receive a passwordless sign-in link.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit">Send sign-in link</button>
        </form>
        {!isSupabaseConfigured && <p className="setup-note">Development note: Supabase environment variables have not been configured yet.</p>}
        {message && <p className="form-message" role="status">{message}</p>}
      </section>
    </Layout>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/care" element={<SectionPage eyebrow="Care" title="Route needs without turning the portal into an EHR." body="CareForVets v2 supports non-clinical inquiry, navigation, consent, referral status, and partner handoff." items={['Non-clinical care inquiry','Veteran consent','Partner routing','Referral status','Outcome confirmation','No PHI in v2']} />} />
      <Route path="/careers" element={<SectionPage eyebrow="Careers" title="A veteran healthcare and operations talent network." body="The workforce model supports licensed, certified, assistant-level, administrative, operational, and leadership roles." items={['Veteran career profile','RN, LPN/LVN, CNA/STNA, HHA','PT, PTA, OT, COTA, SLP and applicable assistants','MSW / social work','Scheduling, intake, authorization and credentialing','Billing, recruiting, quality, operations and leadership','Jobs and application tracking']} />} />
      <Route path="/resources" element={<SectionPage eyebrow="Benefits & resources" title="Reviewed resources with provenance and re-verification." body="Resources are categorized, sourced, reviewed, and dated so a directory does not quietly become stale or misleading." items={['Benefits and service-connection support','Education and training','Entrepreneurship and business resources','Emergency financial support','Housing, legal and transportation resources','Verification status and last-reviewed date']} />} />
      <Route path="/partners" element={<SectionPage eyebrow="Partners network" title="From a links page to a closed-loop partner network." body="Partner records define what an organization does, who it serves, how referrals are made, and whether outcomes can be confirmed." items={['Organization profile','Service categories','Eligibility and geography','Referral pathway','Verification status','Referral event history','Outcome confirmation']} />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
