import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Careers from './pages/Careers'
import CareerProfile from './pages/CareerProfile'
import Login from './pages/Login'
import JobDetail from './pages/JobDetail'
import Resources from './pages/Resources'

const pillars = [
  { title: 'Care', body: 'Route veterans and families to the right next step without storing clinical records in this platform.', href: '/care' },
  { title: 'Careers', body: 'Build a veteran talent profile, discover roles, and track applications across clinical and administrative careers.', href: '/careers' },
  { title: 'Benefits & Resources', body: 'Find reviewed resources for benefits, education, entrepreneurship, financial support, and community needs.', href: '/resources' },
  { title: 'Partners Network', body: 'Coordinate verified organizations, referral pathways, and closed-loop status updates.', href: '/partners' },
]

function Dashboard() {
  return (
    <Layout>
      <section className="hero">
        <p className="eyebrow">Veteran services network</p>
        <h1>Care. Careers. Resources. Connection.</h1>
        <p className="lead">CareForVets brings veteran employment, resource navigation, partner collaboration, and non-clinical care routing into one accountable system.</p>
      </section>
      <section className="card-grid" aria-label="CareForVets service areas">
        {pillars.map((pillar) => (
          <a className="pillar-card" href={pillar.href} key={pillar.title}>
            <span className="card-star">★</span><h2>{pillar.title}</h2><p>{pillar.body}</p><span className="card-link">Open →</span>
          </a>
        ))}
      </section>
      <section className="status-panel"><div><span className="status-dot" /><strong>BUILD v2 foundation</strong></div><p>Supabase is active with RLS, occupation taxonomies, resource categories, authentication bootstrap, and private candidate data boundaries.</p></section>
    </Layout>
  )
}

function Care() {
  return <Layout><section className="hero compact"><p className="eyebrow">Care</p><h1>Route needs without turning this portal into an EHR.</h1><p className="lead">CareForVets v2 supports non-clinical inquiry, consent, partner routing, referral status, and outcome confirmation. Clinical records stay outside this platform.</p></section><section className="section-card"><h2>Care navigation boundary</h2><ul className="scope-list"><li>Non-clinical care inquiry</li><li>Veteran consent</li><li>Partner routing</li><li>Referral status</li><li>Outcome confirmation</li><li>No diagnoses, medications, assessments, or clinical records</li></ul></section></Layout>
}

function Partners() {
  return <Layout><section className="hero compact"><p className="eyebrow">Partners network</p><h1>From a links page to a closed-loop network.</h1><p className="lead">Partners will be structured by service, geography, eligibility, verification status, referral method, and their ability to close the loop on outcomes.</p></section><section className="section-card"><div className="empty-state"><h3>Partner verification queue is the next build.</h3><p>Organizations will not appear as CareForVets partners merely because they are useful resources. Relationship and verification status will be explicit.</p></div></section></Layout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/care" element={<Care />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/careers/:jobId" element={<JobDetail />} />
      <Route path="/career-profile" element={<CareerProfile />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/partners" element={<Partners />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
