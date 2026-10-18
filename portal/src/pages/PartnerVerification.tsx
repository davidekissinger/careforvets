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

type VerificationDocument = {
  id: string
  verification_case_id: string
  document_type: string
  storage_path: string | null
  document_name: string | null
  content_type: string | null
  status: string
  viewed_at: string | null
  view_count: number
  reviewed_at: string | null
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
    w9_status: 'uploaded',
    classification_review_required: true,
    classification_status: 'not_reviewed',
    agreement_required: true,
    agreement_status: 'required',
    tax_reporting_status: 'review_required',
    verification_status: 'blocked',
    risk_level: 'elevated',
    next_action: 'Review W-9, complete worker-classification review, and sign contractor agreement',
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

const demoDocumentSeed: VerificationDocument[] = [
  {
    id: 'demo-w9-contractor',
    verification_case_id: 'demo-contractor',
    document_type: 'w9',
    storage_path: null,
    document_name: 'DEMO-W9-Veteran-RN-Consultant.pdf',
    content_type: 'application/pdf',
    status: 'uploaded',
    viewed_at: null,
    view_count: 0,
    reviewed_at: null,
  },
  {
    id: 'demo-w9-vendor',
    verification_case_id: 'demo-vendor',
    document_type: 'w9',
    storage_path: null,
    document_name: 'DEMO-W9-Therapy-Vendor-Group.pdf',
    content_type: 'application/pdf',
    status: 'accepted',
    viewed_at: new Date().toISOString(),
    view_count: 1,
    reviewed_at: new Date().toISOString(),
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
    next_action: blockers.length === 0 ? 'Final partner verification review' : `Resolve: ${blockers.join(', ')}`,
  }
}

function badge(status: string) {
  return status.replaceAll('_', ' ')
}

export default function PartnerVerification() {
  const { user, demo } = useAuth()
  const [cases, setCases] = useState<VerificationCase[]>([])
  const [documents, setDocuments] = useState<VerificationDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerDocument, setViewerDocument] = useState<VerificationDocument | null>(null)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    if (!viewerDocument) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setViewerDocument(null)
        setViewerUrl(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [viewerDocument])

  useEffect(() => {
    if (demo) {
      const savedCases = localStorage.getItem('cfv_demo_partner_queue')
      const savedDocs = localStorage.getItem('cfv_demo_partner_docs')
      setCases(savedCases ? JSON.parse(savedCases) : demoSeed)
      setDocuments(savedDocs ? JSON.parse(savedDocs) : demoDocumentSeed)
      setLoading(false)
      return
    }

    if (!user) {
      setCases([])
      setDocuments([])
      setLoading(false)
      return
    }

    async function loadQueue() {
      const { data: queueData } = await supabase
        .from('partner_verification_queue')
        .select('*')
        .order('updated_at', { ascending: false })

      const nextCases = (queueData ?? []) as unknown as VerificationCase[]
      setCases(nextCases)

      if (nextCases.length > 0) {
        const { data: docData } = await supabase
          .from('partner_verification_documents')
          .select('id,verification_case_id,document_type,storage_path,document_name,content_type,status,viewed_at,view_count,reviewed_at')
          .in('verification_case_id', nextCases.map((item) => item.id))
          .order('created_at', { ascending: false })
        setDocuments((docData ?? []) as VerificationDocument[])
      } else {
        setDocuments([])
      }

      setLoading(false)
    }

    void loadQueue()
  }, [demo, user])

  const counts = useMemo(() => ({
    total: cases.length,
    blocked: cases.filter((c) => !c.activation_ready).length,
    ready: cases.filter((c) => c.activation_ready).length,
    w9: cases.filter((c) => c.w9_required && c.w9_status !== 'accepted').length,
  }), [cases])

  function persistDemo(nextCases: VerificationCase[], nextDocs: VerificationDocument[]) {
    setCases(nextCases)
    setDocuments(nextDocs)
    localStorage.setItem('cfv_demo_partner_queue', JSON.stringify(nextCases))
    localStorage.setItem('cfv_demo_partner_docs', JSON.stringify(nextDocs))
  }

  function updateDemoRequirement(id: string, field: 'classification' | 'agreement') {
    if (!demo) return
    const nextCases = cases.map((item) => {
      if (item.id !== id) return item
      if (field === 'classification') return recompute({ ...item, classification_status: 'contractor_supported' })
      return recompute({ ...item, agreement_status: 'signed' })
    })
    persistDemo(nextCases, documents)
  }

  async function viewDocument(doc: VerificationDocument) {
    setActionMessage('')

    if (demo) {
      const now = new Date().toISOString()
      const nextDocs = documents.map((item) =>
        item.id === doc.id
          ? { ...item, viewed_at: now, view_count: item.view_count + 1, status: item.status === 'uploaded' ? 'under_review' : item.status }
          : item
      )
      persistDemo(cases, nextDocs)
      setViewerDocument({ ...doc, viewed_at: now, view_count: doc.view_count + 1, status: doc.status === 'uploaded' ? 'under_review' : doc.status })
      setViewerUrl(null)
      return
    }

    if (!user || !doc.storage_path) {
      setActionMessage('No reviewable file is attached to this document record.')
      return
    }

    const { data, error } = await supabase.storage
      .from('partner-tax-documents')
      .createSignedUrl(doc.storage_path, 300)

    if (error || !data?.signedUrl) {
      setActionMessage(error?.message ?? 'Unable to open document.')
      return
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('partner_verification_documents')
      .update({
        viewed_at: now,
        viewed_by: user.id,
        view_count: doc.view_count + 1,
        status: doc.status === 'uploaded' ? 'under_review' : doc.status,
      })
      .eq('id', doc.id)

    if (updateError) {
      setActionMessage(updateError.message)
      return
    }

    const updated = { ...doc, viewed_at: now, view_count: doc.view_count + 1, status: doc.status === 'uploaded' ? 'under_review' : doc.status }
    setDocuments((current) => current.map((item) => item.id === doc.id ? updated : item))
    setViewerDocument(updated)
    setViewerUrl(data.signedUrl)
  }

  async function acceptW9(doc: VerificationDocument) {
    setActionMessage('')
    if (!doc.viewed_at) {
      setActionMessage('Open and review the W-9 before marking it accepted.')
      return
    }

    if (demo) {
      const now = new Date().toISOString()
      const nextDocs = documents.map((item) =>
        item.id === doc.id ? { ...item, status: 'accepted', reviewed_at: now } : item
      )
      const nextCases = cases.map((item) =>
        item.id === doc.verification_case_id ? recompute({ ...item, w9_status: 'accepted' }) : item
      )
      persistDemo(nextCases, nextDocs)
      setViewerDocument((current) => current?.id === doc.id ? { ...current, status: 'accepted', reviewed_at: now } : current)
      setActionMessage('Synthetic W-9 accepted after document review.')
      return
    }

    if (!user) return
    const now = new Date().toISOString()

    const { error: docError } = await supabase
      .from('partner_verification_documents')
      .update({
        status: 'accepted',
        reviewed_by: user.id,
        reviewed_at: now,
      })
      .eq('id', doc.id)

    if (docError) {
      setActionMessage(docError.message)
      return
    }

    const { error: caseError } = await supabase
      .from('partner_verification_cases')
      .update({ w9_status: 'accepted', updated_at: now })
      .eq('id', doc.verification_case_id)

    if (caseError) {
      setActionMessage(caseError.message)
      return
    }

    setDocuments((current) => current.map((item) => item.id === doc.id ? { ...item, status: 'accepted', reviewed_at: now } : item))
    setCases((current) => current.map((item) => item.id === doc.verification_case_id ? recompute({ ...item, w9_status: 'accepted' }) : item))
    setActionMessage('W-9 accepted after document review.')
  }

  function resetDemo() {
    if (!demo) return
    localStorage.removeItem('cfv_demo_partner_queue')
    localStorage.removeItem('cfv_demo_partner_docs')
    setCases(demoSeed)
    setDocuments(demoDocumentSeed)
    setViewerDocument(null)
    setViewerUrl(null)
    setActionMessage('')
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
        <p className="lead">Documents must be opened and reviewed before an authorized reviewer can mark them accepted.</p>
      </section>

      <section className="verification-metrics" aria-label="Verification queue counts">
        <div><span>Total cases</span><strong>{counts.total}</strong></div>
        <div><span>Blocked</span><strong>{counts.blocked}</strong></div>
        <div><span>Ready for review</span><strong>{counts.ready}</strong></div>
        <div><span>W-9 outstanding</span><strong>{counts.w9}</strong></div>
      </section>

      <section className="section-card compliance-rules">
        <div><p className="eyebrow">Automation rule</p><h2>View before accept</h2></div>
        <p>A W-9 cannot be marked accepted until a reviewer has opened the submitted document. The system records the view timestamp and review count before enabling acceptance.</p>
      </section>

      <section className="section-card">
        <div className="queue-header">
          <div><p className="eyebrow">Automated queue</p><h2>Partner verification cases</h2></div>
          {demo && <button className="button secondary" type="button" onClick={resetDemo}>Reset synthetic queue</button>}
        </div>

        {actionMessage && <p className="form-message" role="status">{actionMessage}</p>}

        {loading ? <p>Loading verification cases…</p> : cases.length === 0 ? (
          <div className="empty-state"><h3>No cases visible.</h3><p>Authorized staff will see partner verification cases here as onboarding begins.</p></div>
        ) : (
          <div className="verification-list">
            {cases.map((item) => {
              const caseDocs = documents.filter((doc) => doc.verification_case_id === item.id)
              const w9Docs = caseDocs.filter((doc) => doc.document_type === 'w9')
              return (
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
                      {w9Docs.map((doc) => (
                        <div className="document-actions" key={doc.id}>
                          <button type="button" onClick={() => void viewDocument(doc)}>View document</button>
                          <small>{doc.viewed_at ? `Viewed · ${doc.view_count} time${doc.view_count === 1 ? '' : 's'}` : 'Not yet viewed'}</small>
                          {doc.status !== 'accepted' && (
                            <button
                              type="button"
                              className="accept-document"
                              disabled={!doc.viewed_at}
                              onClick={() => void acceptW9(doc)}
                            >
                              Accept W-9
                            </button>
                          )}
                        </div>
                      ))}
                      {item.w9_required && w9Docs.length === 0 && <small>No W-9 uploaded yet.</small>}
                    </div>
                    <div>
                      <span>Classification</span>
                      <strong>{item.classification_review_required ? badge(item.classification_status) : 'not applicable'}</strong>
                      {demo && item.classification_review_required && item.classification_status !== 'contractor_supported' && (
                        <button type="button" onClick={() => updateDemoRequirement(item.id, 'classification')}>Simulate contractor review cleared</button>
                      )}
                    </div>
                    <div>
                      <span>Agreement</span>
                      <strong>{item.agreement_required ? badge(item.agreement_status) : 'not required'}</strong>
                      {demo && item.agreement_required && item.agreement_status !== 'signed' && (
                        <button type="button" onClick={() => updateDemoRequirement(item.id, 'agreement')}>Simulate agreement signed</button>
                      )}
                    </div>
                    <div><span>Tax reporting</span><strong>{badge(item.tax_reporting_status)}</strong></div>
                  </div>

                  <div className="queue-next-action">
                    <div>
                      <strong>Next action:</strong> {item.next_action ?? (item.verification_status === 'approved' ? 'Partner approved' : 'Review case')}
                      {item.blockers.length > 0 && <span> · Blockers: {item.blockers.join(', ')}</span>}
                    </div>
                    {item.activation_ready && item.verification_status !== 'approved' && item.verification_status !== 'declined' && item.verification_status !== 'paused' && (
                      <NavLink className="button primary final-review-button" to={`/admin/partner-verification/${item.id}/review`}>
                        Final review
                      </NavLink>
                    )}
                    {item.verification_status === 'approved' && <span className="status-badge ready">Approved</span>}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {viewerDocument && (
        <div
          className="document-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setViewerDocument(null)
              setViewerUrl(null)
            }
          }}
        >
          <section className="document-modal" role="dialog" aria-modal="true" aria-labelledby="document-review-title">
            <div className="document-modal-header">
              <div>
                <p className="eyebrow">Document review</p>
                <h2 id="document-review-title">{viewerDocument.document_name ?? badge(viewerDocument.document_type)}</h2>
              </div>
              <button
                className="document-modal-close"
                type="button"
                aria-label="Close document viewer"
                onClick={() => { setViewerDocument(null); setViewerUrl(null) }}
              >
                ×
              </button>
            </div>

            <div className="document-modal-body">
              {demo ? (
                <div className="synthetic-w9">
                  <div className="synthetic-w9-head"><strong>FORM W-9 · SYNTHETIC PREVIEW</strong><span>Not a real tax document</span></div>
                  <dl>
                    <div><dt>Name</dt><dd>{viewerDocument.verification_case_id === 'demo-contractor' ? 'Alex Veteran Consulting' : 'Demo Therapy Vendor Group'}</dd></div>
                    <div><dt>Business name</dt><dd>CareForVets test data only</dd></div>
                    <div><dt>Federal tax classification</dt><dd>Demo classification</dd></div>
                    <div><dt>Address</dt><dd>123 Demo Street · Toledo, OH 43604</dd></div>
                    <div><dt>Taxpayer identification number</dt><dd>[REDACTED IN PREVIEW]</dd></div>
                    <div><dt>Certification</dt><dd>Synthetic document for workflow testing only.</dd></div>
                  </dl>
                </div>
              ) : viewerUrl ? (
                <iframe className="document-frame" src={viewerUrl} title={viewerDocument.document_name ?? 'Partner document'} />
              ) : (
                <p>Document URL unavailable.</p>
              )}
            </div>

            <div className="document-review-footer">
              <span>Viewed: {viewerDocument.viewed_at ? new Date(viewerDocument.viewed_at).toLocaleString() : 'Not viewed'}</span>
              <div className="document-footer-actions">
                <button className="button secondary" type="button" onClick={() => { setViewerDocument(null); setViewerUrl(null) }}>Close</button>
                {viewerDocument.status !== 'accepted' && (
                  <button className="button primary" type="button" disabled={!viewerDocument.viewed_at} onClick={() => void acceptW9(viewerDocument)}>
                    Accept reviewed W-9
                  </button>
                )}
                {viewerDocument.status === 'accepted' && <span className="status-badge ready">Accepted</span>}
              </div>
            </div>
          </section>
        </div>
      )}
    </Layout>
  )
}
