import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../auth'
import { supabase } from '../lib/supabase'

type VerificationCase = {
  id: string
  organization_name: string
  partner_kind: string
  compensation_expected: boolean
  w9_required: boolean
  w9_status: string
  classification_review_required: boolean
  classification_status: string
  agreement_required: boolean
  agreement_status: string
  tax_reporting_status: string
  verification_status: string
  risk_level: string
  next_action: string | null
  blockers: string[]
  activation_ready: boolean
}

const demoSeed: VerificationCase[] = [
  {
    id: 'demo-resource',
    organization_name: '[DEMO] Veteran Community Resource',
    partner_kind: 'resource_referral',
    compensation_expected: false,
    w9_required: false,
    w9_status: 'not_required',
    classification_review_required: false,
    classification_status: 'not_applicable',
    agreement_required: false,
    agreement_status: 'not_required',
    tax_reporting_status: 'not_applicable',
    verification_status: 'ready_for_review',
    risk_level: 'standard',
    next_action: 'Complete service and provenance verification',
    blockers: [],
    activation_ready: true,
  },
  {
    id: 'demo-contractor',
    organization_name: '[DEMO] Veteran RN Consultant',
    partner_kind: 'independent_contractor',
    compensation_expected: true,
    w9_required: true,
    w9_status: 'required',
    classification_review_required: true,
    classification_status: 'not_reviewed',
    agreement_required: true,
    agreement_status: 'required',
    tax_reporting_status: 'review_required',
    verification_status: 'blocked',
    risk_level: 'elevated',
    next_action: 'Collect W-9, complete worker-classification review, and sign contractor agreement',
    blockers: ['W-9', 'worker classification', 'agreement'],
    activation_ready: false,
  },
  {
    id: 'demo-vendor',
    organization_name: '[DEMO] Therapy Vendor Group',
    partner_kind: 'clinical_provider',
    compensation_expected: true,
    w9_required: true,
    w9_status: 'accepted',
    classification_review_required: false,
    classification_status: 'not_applicable',
    agreement_required: true,
    agreement_status: 'signed',
    tax_reporting_status: 'review_required',
    verification_status: 'ready_for_review',
    risk_level: 'standard',
    next_action: 'Final partner verification review',
    blockers: [],
    activation_ready: true,
  },
]

function recompute(item: VerificationCase): VerificationCase {
  const blockers = [
    item.w9_required && item.w9_status !== 'accepted' ? 'W-9' : null,
    item.classification_review_required && item.classification_status !== 'contractor_supported' ? 'worker classification' : null,
    item.agreement_required && item.agreement_status !== 'signed' ? 'agreement' : null,
  ].filter(Boolean) as string[]

  return {
    ...item,
    blockers,
    activation_ready: blockers.length === 0,
    verification_status: blockers.length === 0 ? 'ready_for_review' : 'blocked',
    next_action: blockers.length === 0
      ? 'Final partner verification review'
      : `Resolve: ${blockers.join(', ')}`,
  }
}

function badge(status: string) {
  return status.replaceAll('_', ' ')
}

export default function PartnerVerification() {
  const { user, demo } = useAuth()
  const [cases, setCases] = useState<VerificationCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (demo) {
      const saved = localStorage.getItem('cfv_demo_partner_queue')
      setCases(saved ? JSON.parse(saved) : demoSeed)
      setLoading(false)
      return
    }

    if (!user) {
      setCases([])
      setLoading(false)
      return
    }

    supabase
      .from('partner_verification_queue')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setCases((data ?? []) as unknown as VerificationCase[])
        setLoading(false)
      })
  }, [demo, user])

  const counts = useMemo(() => ({
    total: cases.length,
    blocked: cases.filter((c) => !c.activation_ready).length,
    ready: cases.filter((c) => c.activation_ready).length,
    w9: cases.filter((c) => c.w9_required && c.w9_status !== 'accepted').length,
  }), [cases])

  function updateDemo(id: string, field: 'w9' | 'classification' | 'agreement') {
    if (!demo) return
    const next = cases.map((item) => {
      if (item.id !== id) return item
      if (field === 'w9') return recompute({ ...item, w9_status: 'accepted' })
      if (field === 'classification') return recompute({ ...item, classification_status: 'contractor_supported' })
      return recompute({ ...item, agreement_status: 'signed' })
    })
    setCases(next)
    localStorage.setItem('cfv_demo_partner_queue', JSON.stringify(next))
  }

  function resetDemo() {
    if (!demo) return
    localStorage.removeItem('cfv_demo_partner_queue')
    setCases(demoSeed)
  }

  if (!user && !demo) {
    return (
      <Layout>
        <section className="login-card">
          <p className="eyebrow">Partner verification</p>
          <h1>Staff verification workspace</h1>
          <p>This queue is restricted to authorized CareForVets users. Use preview test mode to review the workflow with synthetic data.</p>
          <NavLink className="button primary" to="/login">Sign in / test mode</NavLink>
        </section>
      </Layout>
    )
  }

  return (
    <Layout>
      <section className="hero compact">
        <p className="eyebrow">{demo ? 'Synthetic admin preview' : 'Partner verification'}</p>
        <h1>Verify the relationship before activating the partner.</h1>
        <p className="lead">
          The queue separates ordinary resource/referral partners from compensated vendors and independent contractors, then applies the tax, classification, and agreement requirements that actually fit the relationship.
        </p>
      </section>

      <section className="verification-metrics" aria-label="Verification queue counts">
        <div><span>Total cases</span><strong>{counts.total}</strong></div>
        <div><span>Blocked</span><strong>{counts.blocked}</strong></div>
        <div><span>Ready for review</span><strong>{counts.ready}</strong></div>
        <div><span>W-9 outstanding</span><strong>{counts.w9}</strong></div>
      </section>

      <section className="section-card compliance-rules">
        <div>
          <p className="eyebrow">Automation rules</p>
          <h2>W-9, contractor classification, and 1099 review</h2>
        </div>
        <div className="rule-grid">
          <article>
            <h3>W-9 gate</h3>
            <p><strong>Mandatory before payment activation</strong> for compensated partners, contracted vendors, independent contractors, and paid clinical-provider arrangements.</p>
            <p className="small-note">Unpaid resource/referral partners do not submit a W-9 merely to appear in the network; collecting unnecessary taxpayer IDs would add sensitive data without a tax purpose.</p>
            <a href="https://www.irs.gov/forms-pubs/about-form-w-9" target="_blank" rel="noreferrer">IRS Form W-9 information →</a>
          </article>
          <article>
            <h3>Worker-classification gate</h3>
            <p>An “independent contractor,” “1099,” or contract label does not decide worker status. Individual-contractor engagements require a documented review of behavioral control, financial control, and the relationship of the parties.</p>
            <a href="https://www.irs.gov/businesses/small-businesses-self-employed/independent-contractor-self-employed-or-employee" target="_blank" rel="noreferrer">IRS classification guidance →</a>
          </article>
          <article>
            <h3>1099 review</h3>
            <p>For payments made in 2026, the IRS generally uses a <strong>$2,000</strong> reporting threshold for nonemployee compensation. Reporting may still be required below that amount when backup withholding applies, and entity/payment exceptions must still be reviewed.</p>
            <a href="https://www.irs.gov/businesses/small-businesses-self-employed/am-i-required-to-file-a-form-1099-or-other-information-return" target="_blank" rel="noreferrer">IRS reporting guidance →</a>
          </article>
        </div>
      </section>

      <section className="section-card">
        <div className="queue-header">
          <div><p className="eyebrow">Automated queue</p><h2>Partner verification cases</h2></div>
          {demo && <button className="button secondary" type="button" onClick={resetDemo}>Reset synthetic queue</button>}
        </div>

        {loading ? <p>Loading verification cases…</p> : cases.length === 0 ? (
          <div className="empty-state"><h3>No cases visible.</h3><p>Authorized staff will see partner verification cases here as onboarding begins.</p></div>
        ) : (
          <div className="verification-list">
            {cases.map((item) => (
              <article className="verification-card" key={item.id}>
                <div className="verification-card-head">
                  <div>
                    <p className="job-meta">{badge(item.partner_kind)} · {item.compensation_expected ? 'compensated' : 'no payment expected'}</p>
                    <h3>{item.organization_name}</h3>
                  </div>
                  <span className={item.activation_ready ? 'status-badge ready' : 'status-badge blocked'}>
                    {item.activation_ready ? 'Ready for final review' : 'Blocked'}
                  </span>
                </div>

                <div className="requirement-grid">
                  <div>
                    <span>W-9</span>
                    <strong>{item.w9_required ? badge(item.w9_status) : 'not required'}</strong>
                    {demo && item.w9_required && item.w9_status !== 'accepted' && (
                      <button type="button" onClick={() => updateDemo(item.id, 'w9')}>Simulate W-9 accepted</button>
                    )}
                  </div>
                  <div>
                    <span>Classification</span>
                    <strong>{item.classification_review_required ? badge(item.classification_status) : 'not applicable'}</strong>
                    {demo && item.classification_review_required && item.classification_status !== 'contractor_supported' && (
                      <button type="button" onClick={() => updateDemo(item.id, 'classification')}>Simulate contractor review cleared</button>
                    )}
                  </div>
                  <div>
                    <span>Agreement</span>
                    <strong>{item.agreement_required ? badge(item.agreement_status) : 'not required'}</strong>
                    {demo && item.agreement_required && item.agreement_status !== 'signed' && (
                      <button type="button" onClick={() => updateDemo(item.id, 'agreement')}>Simulate agreement signed</button>
                    )}
                  </div>
                  <div>
                    <span>Tax reporting</span>
                    <strong>{badge(item.tax_reporting_status)}</strong>
                  </div>
                </div>

                <div className="queue-next-action">
                  <strong>Next action:</strong> {item.next_action ?? 'Review case'}
                  {item.blockers.length > 0 && <span> · Blockers: {item.blockers.join(', ')}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section-card acknowledgement-copy">
        <p className="eyebrow">Draft onboarding language</p>
        <h2>1099 / independent-contractor acknowledgement</h2>
        <p>
          Where CareForVets engages a partner or individual as a nonemployee service provider, the parties acknowledge that the written agreement and any anticipated information-reporting form do not, by themselves, determine worker classification. The actual relationship and degree of behavioral and financial control remain relevant. A compensated contractor/vendor must provide a current Form W-9 before payment activation. If the relationship is properly treated as nonemployee compensation, the service provider is responsible for applicable federal, state, local, and self-employment tax obligations, and CareForVets may issue Form 1099-NEC or another information return when required by law.
        </p>
        <p className="small-note">Draft operating language only. Final contract language should be reviewed with employment counsel and the organization's tax professional before production use.</p>
      </section>
    </Layout>
  )
}
