import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../auth'
import { supabase } from '../lib/supabase'

type ReviewCase = {
  id: string
  organization_id: string
  organization_name: string
  website: string | null
  phone: string | null
  service_area: string[] | null
  organization_status: string
  organization_verification_status: string
  partner_kind: string
  compensation_expected: boolean
  relationship_status: string
  verification_stage: string
  referral_method: string | null
  eligibility_summary: string | null
  accepts_referrals: boolean
  outcome_updates_supported: boolean
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
  final_review_status: string
  final_reviewed_at: string | null
  final_review_note: string | null
  activation_ready: boolean
  blockers: string[]
}

type ReviewDocument = {
  id: string
  verification_case_id: string
  document_type: string
  document_name: string | null
  storage_path: string | null
  status: string
  viewed_at: string | null
  view_count: number
  reviewed_at: string | null
}

type Decision = {
  id: string
  decision: string
  reviewer_note: string | null
  created_at: string
}

const approvalCertification = 'I reviewed the submitted documentation and verification requirements applicable to this partner relationship. All required blockers have been resolved, and I am authorizing activation based on the information currently available.'

function badge(value: string) {
  return value.replaceAll('_',' ')
}

function demoCase(caseId: string): ReviewCase | null {
  const saved = localStorage.getItem('cfv_demo_partner_queue')
  const items = saved ? JSON.parse(saved) : [
    {
      id:'demo-resource', organization_name:'[DEMO] Veteran Community Resource', partner_kind:'resource_referral',
      compensation_expected:false, w9_required:false, w9_status:'not_required',
      classification_review_required:false, classification_status:'not_applicable',
      agreement_required:false, agreement_status:'not_required', tax_reporting_status:'not_applicable',
      verification_status:'ready_for_review', risk_level:'standard', next_action:'Final partner verification review',
      blockers:[], activation_ready:true
    },
    {
      id:'demo-contractor', organization_name:'[DEMO] Veteran RN Consultant', partner_kind:'independent_contractor',
      compensation_expected:true, w9_required:true, w9_status:'uploaded',
      classification_review_required:true, classification_status:'not_reviewed',
      agreement_required:true, agreement_status:'required', tax_reporting_status:'review_required',
      verification_status:'blocked', risk_level:'elevated',
      next_action:'Resolve onboarding blockers', blockers:['W-9','worker classification','agreement'], activation_ready:false
    },
    {
      id:'demo-vendor', organization_name:'[DEMO] Therapy Vendor Group', partner_kind:'clinical_provider',
      compensation_expected:true, w9_required:true, w9_status:'accepted',
      classification_review_required:false, classification_status:'not_applicable',
      agreement_required:true, agreement_status:'signed', tax_reporting_status:'review_required',
      verification_status:'ready_for_review', risk_level:'standard', next_action:'Final partner verification review',
      blockers:[], activation_ready:true
    }
  ]

  const item = items.find((x:any)=>x.id===caseId)
  if(!item) return null

  return {
    ...item,
    organization_id: item.organization_id ?? `${caseId}-organization`,
    website: 'https://example.test',
    phone: '(419) 555-0100',
    service_area: ['Ohio'],
    organization_status: item.verification_status === 'approved' ? 'active' : 'pending',
    organization_verification_status: item.verification_status === 'approved' ? 'verified' : 'in_review',
    relationship_status: item.verification_status === 'approved' ? 'active' : 'prospect',
    verification_stage: item.verification_status === 'approved' ? 'approved' : 'final_review',
    referral_method: 'Secure referral workflow',
    eligibility_summary: 'Synthetic preview criteria for workflow testing only.',
    accepts_referrals: caseId !== 'demo-resource',
    outcome_updates_supported: true,
    final_review_status: item.final_review_status ?? 'not_started',
    final_reviewed_at: item.final_reviewed_at ?? null,
    final_review_note: item.final_review_note ?? null,
  } as ReviewCase
}

function demoDocuments(caseId: string): ReviewDocument[] {
  const saved = localStorage.getItem('cfv_demo_partner_docs')
  const docs = saved ? JSON.parse(saved) : [
    {
      id:'demo-w9-contractor', verification_case_id:'demo-contractor', document_type:'w9',
      document_name:'DEMO-W9-Veteran-RN-Consultant.pdf', storage_path:null,
      status:'uploaded', viewed_at:null, view_count:0, reviewed_at:null
    },
    {
      id:'demo-w9-vendor', verification_case_id:'demo-vendor', document_type:'w9',
      document_name:'DEMO-W9-Therapy-Vendor-Group.pdf', storage_path:null,
      status:'accepted', viewed_at:new Date().toISOString(), view_count:1, reviewed_at:new Date().toISOString()
    }
  ]
  return docs.filter((d:any)=>d.verification_case_id===caseId)
}

export default function FinalPartnerReview() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const { user, accountType, profileLoading, demo } = useAuth()
  const [reviewCase,setReviewCase] = useState<ReviewCase|null>(null)
  const [documents,setDocuments] = useState<ReviewDocument[]>([])
  const [services,setServices] = useState<string[]>([])
  const [decisions,setDecisions] = useState<Decision[]>([])
  const [loading,setLoading] = useState(true)
  const [certified,setCertified] = useState(false)
  const [note,setNote] = useState('')
  const [message,setMessage] = useState('')
  const [submitting,setSubmitting] = useState(false)

  useEffect(()=>{
    if(!caseId) return
    if(!demo && profileLoading) return

    if(demo){
      setReviewCase(demoCase(caseId))
      setDocuments(demoDocuments(caseId))
      setServices(caseId==='demo-resource' ? ['Community'] : caseId==='demo-contractor' ? ['Healthcare','Employment'] : ['Healthcare'])
      const savedDecisions=localStorage.getItem('cfv_demo_partner_decisions')
      setDecisions(savedDecisions ? JSON.parse(savedDecisions).filter((d:any)=>d.verification_case_id===caseId) : [])
      setLoading(false)
      return
    }

    if(!user || accountType !== 'staff'){
      setLoading(false)
      return
    }

    setLoading(true)
    async function load(){
      const [{data:caseData},{data:docData},{data:decisionData}] = await Promise.all([
        supabase.from('partner_final_review_staff_view').select('*').eq('id',caseId).maybeSingle(),
        supabase.from('partner_verification_documents')
          .select('id,verification_case_id,document_type,document_name,storage_path,status,viewed_at,view_count,reviewed_at')
          .eq('verification_case_id',caseId)
          .order('created_at',{ascending:false}),
        supabase.from('partner_verification_decisions')
          .select('id,decision,reviewer_note,created_at')
          .eq('verification_case_id',caseId)
          .order('created_at',{ascending:false})
      ])

      const nextCase=(caseData ?? null) as unknown as ReviewCase|null
      setReviewCase(nextCase)
      setDocuments((docData ?? []) as ReviewDocument[])
      setDecisions((decisionData ?? []) as Decision[])

      if(nextCase?.organization_id){
        const {data:serviceData}=await supabase
          .from('partner_services')
          .select('service_categories(name)')
          .eq('partner_organization_id',nextCase.organization_id)
        setServices((serviceData ?? []).map((row:any)=>row.service_categories?.[0]?.name).filter(Boolean))
      }

      setLoading(false)
    }

    void load()
  },[caseId,demo,user,accountType,profileLoading])

  const blockers=useMemo(()=>reviewCase?.blockers ?? [],[reviewCase])

  async function decide(decision:'approve'|'request_changes'|'pause'|'decline'){
    if(!reviewCase || !caseId) return
    setMessage('')

    if(decision==='approve' && !certified){
      setMessage('Reviewer certification is required before approval.')
      return
    }

    if(decision==='approve' && !reviewCase.activation_ready){
      setMessage('This case still has unresolved activation blockers.')
      return
    }

    if(decision!=='approve' && !note.trim()){
      setMessage('A reviewer note is required for this decision.')
      return
    }

    if((decision==='decline' || decision==='pause') && !window.confirm(`Confirm ${decision === 'decline' ? 'decline' : 'pause'} decision?`)){
      return
    }

    setSubmitting(true)

    if(demo){
      const now=new Date().toISOString()
      const saved=localStorage.getItem('cfv_demo_partner_queue')
      const items=saved ? JSON.parse(saved) : []
      const updated=items.map((item:any)=>{
        if(item.id!==caseId) return item
        if(decision==='approve'){
          return {...item,verification_status:'approved',final_review_status:'approved',final_reviewed_at:now,final_review_note:note||null,next_action:null,blockers:[],activation_ready:true}
        }
        if(decision==='request_changes'){
          return {...item,verification_status:'blocked',final_review_status:'changes_requested',final_reviewed_at:now,final_review_note:note,next_action:note,blockers:['reviewer changes requested'],activation_ready:false}
        }
        if(decision==='decline'){
          return {...item,verification_status:'declined',final_review_status:'declined',final_reviewed_at:now,final_review_note:note,next_action:null,blockers:['declined'],activation_ready:false}
        }
        return {...item,verification_status:'paused',final_review_status:'paused',final_reviewed_at:now,final_review_note:note,next_action:note,blockers:['paused'],activation_ready:false}
      })
      localStorage.setItem('cfv_demo_partner_queue',JSON.stringify(updated))

      const decisionRecord={
        id:`demo-${Date.now()}`,
        verification_case_id:caseId,
        decision,
        reviewer_note:note||null,
        created_at:now
      }
      const allDecisions=localStorage.getItem('cfv_demo_partner_decisions')
      const nextDecisions=allDecisions ? [decisionRecord,...JSON.parse(allDecisions)] : [decisionRecord]
      localStorage.setItem('cfv_demo_partner_decisions',JSON.stringify(nextDecisions))
      setDecisions(nextDecisions.filter((d:any)=>d.verification_case_id===caseId))
      setReviewCase(demoCase(caseId))
      setMessage(decision==='approve' ? 'Synthetic partner approved. Audit-style decision recorded locally.' : 'Synthetic final-review decision recorded locally.')
      setSubmitting(false)
      return
    }

    const {error}=await supabase.rpc('finalize_partner_verification',{
      target_case:caseId,
      target_decision:decision,
      reviewer_certification:decision==='approve' ? approvalCertification : (certified ? approvalCertification : ''),
      reviewer_note:note.trim() || null
    })

    if(error){
      setMessage(error.message)
      setSubmitting(false)
      return
    }

    const {data}=await supabase.from('partner_final_review_staff_view').select('*').eq('id',caseId).maybeSingle()
    setReviewCase((data ?? null) as unknown as ReviewCase|null)

    const {data:history}=await supabase.from('partner_verification_decisions')
      .select('id,decision,reviewer_note,created_at')
      .eq('verification_case_id',caseId)
      .order('created_at',{ascending:false})
    setDecisions((history ?? []) as Decision[])
    setMessage('Final-review decision recorded.')
    setSubmitting(false)
  }

  if(profileLoading && !demo) return <Layout><section className="section-card"><p>Checking staff access…</p></section></Layout>

  if(!demo && !user) {
    return <Layout><section className="login-card"><p className="eyebrow">Final partner review</p><h1>Sign in required.</h1><NavLink className="button primary" to="/login">Sign in</NavLink></section></Layout>
  }

  if(!demo && accountType !== 'staff') {
    return <Layout><section className="login-card"><p className="eyebrow">Final partner review</p><h1>Staff access required.</h1><p>This workflow is restricted to authorized CareForVets staff.</p><NavLink className="button secondary" to="/dashboard">Return to portal</NavLink></section></Layout>
  }

  if(loading) return <Layout><p>Loading final review…</p></Layout>

  if(!reviewCase){
    return (
      <Layout>
        <section className="login-card">
          <p className="eyebrow">Final partner review</p>
          <h1>Review case unavailable.</h1>
          <p>The case either does not exist or your account does not have CareForVets staff access.</p>
          <NavLink className="button secondary" to="/admin/partner-verification">Back to verification queue</NavLink>
        </section>
      </Layout>
    )
  }

  const alreadyFinal=['approved','declined','paused'].includes(reviewCase.final_review_status)

  return (
    <Layout>
      <NavLink className="back-link" to="/admin/partner-verification">← Back to verification queue</NavLink>

      <section className="hero compact">
        <p className="eyebrow">{demo ? 'Synthetic final review' : 'Final partner review'}</p>
        <h1>{reviewCase.organization_name}</h1>
        <p className="lead">Confirm that the partner relationship, required documents, classification review, agreement, and tax-review status support the decision you are about to make.</p>
      </section>

      <section className="final-review-summary">
        <div><span>Partner type</span><strong>{badge(reviewCase.partner_kind)}</strong></div>
        <div><span>Compensation</span><strong>{reviewCase.compensation_expected ? 'Expected' : 'Not expected'}</strong></div>
        <div><span>Risk level</span><strong>{badge(reviewCase.risk_level)}</strong></div>
        <div><span>Current status</span><strong>{badge(reviewCase.final_review_status || reviewCase.verification_status)}</strong></div>
      </section>

      <div className="final-review-grid">
        <section className="section-card">
          <p className="eyebrow">Organization & relationship</p>
          <h2>Partner profile</h2>
          <dl className="review-dl">
            <div><dt>Organization</dt><dd>{reviewCase.organization_name}</dd></div>
            <div><dt>Website</dt><dd>{reviewCase.website ? <a href={reviewCase.website} target="_blank" rel="noreferrer">{reviewCase.website}</a> : 'Not provided'}</dd></div>
            <div><dt>Phone</dt><dd>{reviewCase.phone ?? 'Not provided'}</dd></div>
            <div><dt>Service area</dt><dd>{reviewCase.service_area?.join(', ') || 'Not configured'}</dd></div>
            <div><dt>Services</dt><dd>{services.length ? services.join(', ') : 'No service categories configured'}</dd></div>
            <div><dt>Referral method</dt><dd>{reviewCase.referral_method ?? 'Not configured'}</dd></div>
            <div><dt>Eligibility</dt><dd>{reviewCase.eligibility_summary ?? 'Not configured'}</dd></div>
            <div><dt>Outcome updates</dt><dd>{reviewCase.outcome_updates_supported ? 'Supported' : 'Not supported'}</dd></div>
          </dl>
        </section>

        <section className="section-card">
          <p className="eyebrow">Release gates</p>
          <h2>Requirements</h2>
          <div className="review-gates">
            <div className={reviewCase.w9_required && reviewCase.w9_status!=='accepted' ? 'gate fail' : 'gate pass'}>
              <span>W-9</span><strong>{reviewCase.w9_required ? badge(reviewCase.w9_status) : 'not required'}</strong>
            </div>
            <div className={reviewCase.classification_review_required && reviewCase.classification_status!=='contractor_supported' ? 'gate fail' : 'gate pass'}>
              <span>Worker classification</span><strong>{reviewCase.classification_review_required ? badge(reviewCase.classification_status) : 'not applicable'}</strong>
            </div>
            <div className={reviewCase.agreement_required && reviewCase.agreement_status!=='signed' ? 'gate fail' : 'gate pass'}>
              <span>Agreement</span><strong>{reviewCase.agreement_required ? badge(reviewCase.agreement_status) : 'not required'}</strong>
            </div>
            <div className={reviewCase.risk_level==='high' ? 'gate fail' : 'gate pass'}>
              <span>Risk</span><strong>{badge(reviewCase.risk_level)}</strong>
            </div>
          </div>
          {blockers.length > 0 ? (
            <div className="review-blocker"><strong>Approval blocked:</strong> {blockers.join(', ')}</div>
          ) : (
            <div className="review-clear"><strong>All configured activation gates are clear.</strong></div>
          )}
        </section>
      </div>

      <section className="section-card">
        <p className="eyebrow">Documents</p>
        <h2>Reviewed evidence</h2>
        {documents.length===0 ? <p>No documents are attached to this case.</p> : (
          <div className="review-document-list">
            {documents.map(doc=>(
              <div key={doc.id}>
                <div>
                  <strong>{doc.document_name ?? badge(doc.document_type)}</strong>
                  <span>{badge(doc.status)} · viewed {doc.view_count} time{doc.view_count===1?'':'s'}{doc.reviewed_at ? ' · reviewed' : ''}</span>
                </div>
                <span className={doc.status==='accepted' ? 'status-badge ready' : 'status-badge blocked'}>{badge(doc.status)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section-card">
        <p className="eyebrow">Tax & reporting</p>
        <h2>Tax-review status</h2>
        <p><strong>{badge(reviewCase.tax_reporting_status)}</strong></p>
        <p className="small-note">This status indicates whether tax reporting still requires review; it does not itself determine whether a Form 1099 must be issued.</p>
      </section>

      <section className="section-card final-decision-card">
        <p className="eyebrow">Human approval gate</p>
        <h2>Reviewer decision</h2>

        <label className="certification-row">
          <input type="checkbox" checked={certified} onChange={e=>setCertified(e.target.checked)} />
          <span>{approvalCertification}</span>
        </label>

        <label className="review-note-field">
          Reviewer note
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Required for request changes, pause, or decline. Optional for approval." />
        </label>

        {message && <p className="form-message" role="status">{message}</p>}

        <div className="decision-actions">
          <button className="button primary" type="button" disabled={submitting || !reviewCase.activation_ready || !certified || reviewCase.verification_status==='approved'} onClick={()=>void decide('approve')}>
            Approve partner
          </button>
          <button className="button secondary" type="button" disabled={submitting || alreadyFinal} onClick={()=>void decide('request_changes')}>
            Request changes
          </button>
          <button className="button secondary" type="button" disabled={submitting || alreadyFinal} onClick={()=>void decide('pause')}>
            Pause
          </button>
          <button className="button danger" type="button" disabled={submitting || alreadyFinal} onClick={()=>void decide('decline')}>
            Decline
          </button>
        </div>
      </section>

      <section className="section-card">
        <p className="eyebrow">Decision history</p>
        <h2>Audit trail</h2>
        {decisions.length===0 ? <p>No final-review decisions have been recorded.</p> : (
          <div className="decision-history">
            {decisions.map(item=>(
              <div key={item.id}>
                <strong>{badge(item.decision)}</strong>
                <span>{new Date(item.created_at).toLocaleString()}</span>
                {item.reviewer_note && <p>{item.reviewer_note}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="review-footer-nav">
        <button className="button secondary" type="button" onClick={()=>navigate('/admin/partner-verification')}>Return to queue</button>
      </div>
    </Layout>
  )
}
