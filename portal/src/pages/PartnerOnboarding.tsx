import { FormEvent, useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../auth'
import { supabase } from '../lib/supabase'

type Category={id:string;slug:string;name:string}
type OnboardingState={
  organization_id:string
  verification_case_id:string
  w9_required:boolean
  agreement_required:boolean
  classification_review_required:boolean
}

const demoResult:OnboardingState={
  organization_id:'demo-partner-organization',
  verification_case_id:'demo-partner-onboarding-case',
  w9_required:true,
  agreement_required:true,
  classification_review_required:true,
}

export default function PartnerOnboarding(){
  const {user,demo}=useAuth()
  const [categories,setCategories]=useState<Category[]>([])
  const [orgName,setOrgName]=useState('')
  const [website,setWebsite]=useState('')
  const [phone,setPhone]=useState('')
  const [serviceArea,setServiceArea]=useState('')
  const [partnerKind,setPartnerKind]=useState('resource_referral')
  const [compensation,setCompensation]=useState(false)
  const [referralMethod,setReferralMethod]=useState('')
  const [eligibility,setEligibility]=useState('')
  const [acceptsReferrals,setAcceptsReferrals]=useState(false)
  const [outcomes,setOutcomes]=useState(false)
  const [selectedServices,setSelectedServices]=useState<string[]>([])
  const [state,setState]=useState<OnboardingState|null>(null)
  const [message,setMessage]=useState('')
  const [saving,setSaving]=useState(false)
  const [uploading,setUploading]=useState<string|null>(null)

  useEffect(()=>{
    supabase.from('service_categories').select('id,slug,name').eq('active',true).order('name')
      .then(({data})=>setCategories((data??[]) as Category[]))
  },[])

  useEffect(()=>{
    if(demo || !user || state) return

    async function loadExisting(){
      const {data:memberships}=await supabase
        .from('organization_memberships')
        .select('organization_id')
        .eq('user_id',user.id)
        .eq('status','active')
        .limit(1)

      const orgId=memberships?.[0]?.organization_id
      if(!orgId) return

      const [{data:org},{data:profile},{data:caseData},{data:serviceData}]=await Promise.all([
        supabase.from('organizations').select('id,name,website,phone,service_area').eq('id',orgId).maybeSingle(),
        supabase.from('partner_profiles').select('partner_kind,compensation_expected,referral_method,eligibility_summary,accepts_referrals,outcome_updates_supported').eq('organization_id',orgId).maybeSingle(),
        supabase.from('partner_verification_cases').select('id,w9_required,agreement_required,classification_review_required').eq('organization_id',orgId).maybeSingle(),
        supabase.from('partner_services').select('service_categories(slug)').eq('partner_organization_id',orgId),
      ])

      if(org){
        setOrgName(org.name??'')
        setWebsite(org.website??'')
        setPhone(org.phone??'')
        setServiceArea((org.service_area??[]).join(', '))
      }
      if(profile){
        setPartnerKind(profile.partner_kind??'resource_referral')
        setCompensation(Boolean(profile.compensation_expected))
        setReferralMethod(profile.referral_method??'')
        setEligibility(profile.eligibility_summary??'')
        setAcceptsReferrals(Boolean(profile.accepts_referrals))
        setOutcomes(Boolean(profile.outcome_updates_supported))
      }
      if(serviceData){
        setSelectedServices(serviceData.flatMap((row:any)=>row.service_categories?.map((x:any)=>x.slug)??[]).filter(Boolean))
      }
      if(caseData){
        setState({
          organization_id:orgId,
          verification_case_id:caseData.id,
          w9_required:Boolean(caseData.w9_required),
          agreement_required:Boolean(caseData.agreement_required),
          classification_review_required:Boolean(caseData.classification_review_required),
        })
      }
    }

    void loadExisting()
  },[demo,user,state])

  useEffect(()=>{
    if(!demo || state) return
    const saved=localStorage.getItem('cfv_demo_partner_onboarding')
    if(saved){
      const parsed=JSON.parse(saved)
      setOrgName(parsed.orgName??'')
      setWebsite(parsed.website??'')
      setPhone(parsed.phone??'')
      setServiceArea(parsed.serviceArea??'')
      setPartnerKind(parsed.partnerKind??'resource_referral')
      setCompensation(Boolean(parsed.compensation))
      setReferralMethod(parsed.referralMethod??'')
      setEligibility(parsed.eligibility??'')
      setAcceptsReferrals(Boolean(parsed.acceptsReferrals))
      setOutcomes(Boolean(parsed.outcomes))
      setSelectedServices(parsed.selectedServices??[])
      setState(parsed.state??null)
    }
  },[demo,state])

  async function save(event:FormEvent){
    event.preventDefault()
    setMessage('')
    if(!orgName.trim()){
      setMessage('Organization name is required.')
      return
    }
    setSaving(true)

    if(demo){
      const next={
        orgName,website,phone,serviceArea,partnerKind,compensation,
        referralMethod,eligibility,acceptsReferrals,outcomes,selectedServices,
        state:demoResult,
      }
      localStorage.setItem('cfv_demo_partner_onboarding',JSON.stringify(next))
      setState(demoResult)
      setMessage('Synthetic partner onboarding saved in this browser only.')
      setSaving(false)
      return
    }

    if(!user){
      setMessage('Sign in with a partner account to continue.')
      setSaving(false)
      return
    }

    const {data,error}=await supabase.rpc('start_partner_onboarding',{
      org_name:orgName.trim(),
      org_website:website.trim()||null,
      org_phone:phone.trim()||null,
      org_service_area:serviceArea.split(',').map(x=>x.trim()).filter(Boolean),
      requested_partner_kind:partnerKind,
      requested_compensation:compensation,
      requested_referral_method:referralMethod.trim()||null,
      requested_eligibility_summary:eligibility.trim()||null,
      requested_accepts_referrals:acceptsReferrals,
      requested_outcome_updates:outcomes,
      requested_service_slugs:selectedServices,
    })

    if(error){
      setMessage(error.message)
      setSaving(false)
      return
    }

    setState(data as OnboardingState)
    setMessage('Partner onboarding saved. Complete any required documents below.')
    setSaving(false)
  }

  async function uploadDocument(docType:'w9'|'contractor_agreement',file:File){
    if(!state) return
    setMessage('')
    setUploading(docType)

    if(demo){
      const key=`cfv_demo_partner_doc_${docType}`
      localStorage.setItem(key,JSON.stringify({name:file.name,type:file.type||'application/octet-stream',uploadedAt:new Date().toISOString()}))
      setMessage(`Synthetic ${docType==='w9'?'W-9':'agreement'} upload recorded locally.`)
      setUploading(null)
      return
    }

    if(!user){
      setMessage('Sign in to upload documents.')
      setUploading(null)
      return
    }

    const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'-')
    const path=`${state.organization_id}/${state.verification_case_id}/${docType}/${crypto.randomUUID()}-${safeName}`
    const {error:uploadError}=await supabase.storage.from('partner-tax-documents').upload(path,file,{upsert:false,contentType:file.type||undefined})
    if(uploadError){
      setMessage(uploadError.message)
      setUploading(null)
      return
    }

    const {error}=await supabase.rpc('submit_partner_document',{
      target_case:state.verification_case_id,
      target_document_type:docType,
      target_storage_path:path,
      target_document_name:file.name,
      target_content_type:file.type||'application/octet-stream',
    })

    if(error){
      setMessage(error.message)
    }else{
      setMessage(`${docType==='w9'?'W-9':'Agreement'} submitted for CareForVets review.`)
    }
    setUploading(null)
  }

  function toggleService(slug:string){
    setSelectedServices(current=>current.includes(slug)?current.filter(x=>x!==slug):[...current,slug])
  }

  if(!user && !demo){
    return <Layout><section className="login-card"><p className="eyebrow">Partner onboarding</p><h1>Sign in to begin partner verification.</h1><p>Create or use a partner account to submit your organization profile and required onboarding documents.</p><NavLink className="button primary" to="/login">Sign in</NavLink></section></Layout>
  }

  const taxDocsRequired=state?.w9_required ?? (compensation || ['contracted_vendor','independent_contractor','clinical_provider'].includes(partnerKind))

  return <Layout>
    <section className="hero compact">
      <p className="eyebrow">{demo?'Synthetic partner onboarding':'Partner onboarding'}</p>
      <h1>Build the partner record once. Verify it before activation.</h1>
      <p className="lead">This workflow collects organization, service, referral, and tax-onboarding information. Do not upload medical records or clinical information.</p>
    </section>

    <form className="profile-form onboarding-form" onSubmit={save}>
      <div className="form-grid">
        <label>Organization name<input value={orgName} onChange={e=>setOrgName(e.target.value)} required /></label>
        <label>Relationship type<select value={partnerKind} onChange={e=>setPartnerKind(e.target.value)}>
          <option value="resource_referral">Resource / referral partner</option>
          <option value="employer">Employer</option>
          <option value="contracted_vendor">Contracted vendor</option>
          <option value="independent_contractor">Individual independent contractor</option>
          <option value="clinical_provider">Clinical provider / entity</option>
          <option value="other">Other</option>
        </select></label>
        <label>Website<input type="url" value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://..." /></label>
        <label>Phone<input value={phone} onChange={e=>setPhone(e.target.value)} /></label>
      </div>

      <label>Service area<input value={serviceArea} onChange={e=>setServiceArea(e.target.value)} placeholder="Ohio, Michigan, National" /></label>

      <fieldset className="service-selector">
        <legend>Services offered</legend>
        <div>
          {categories.map(category=><label key={category.id} className="service-check"><input type="checkbox" checked={selectedServices.includes(category.slug)} onChange={()=>toggleService(category.slug)} /> <span>{category.name}</span></label>)}
        </div>
      </fieldset>

      <label>Referral method<input value={referralMethod} onChange={e=>setReferralMethod(e.target.value)} placeholder="Secure portal, phone, email, warm handoff..." /></label>
      <label>Eligibility summary<textarea value={eligibility} onChange={e=>setEligibility(e.target.value)} placeholder="Who is eligible for this service?" /></label>

      <div className="onboarding-checks">
        <label className="checkbox-row"><input type="checkbox" checked={acceptsReferrals} onChange={e=>setAcceptsReferrals(e.target.checked)} /><span>This organization accepts referrals from CareForVets.</span></label>
        <label className="checkbox-row"><input type="checkbox" checked={outcomes} onChange={e=>setOutcomes(e.target.checked)} /><span>This organization can provide referral/outcome status updates.</span></label>
        <label className="checkbox-row"><input type="checkbox" checked={compensation} onChange={e=>setCompensation(e.target.checked)} /><span>CareForVets expects to make payments to this partner/vendor/contractor.</span></label>
      </div>

      {taxDocsRequired && <div className="tax-notice"><strong>Tax onboarding required.</strong><p>A current Form W-9 and applicable signed contractor/vendor agreement are required before payment activation. A 1099 label or contract does not by itself determine worker classification.</p></div>}

      <button className="button primary" type="submit" disabled={saving}>{saving?'Saving…':'Save & continue'}</button>
      {message && <p className="form-message" role="status">{message}</p>}
    </form>

    {state && <section className="section-card onboarding-documents">
      <p className="eyebrow">Required documents</p>
      <h2>Document submission</h2>
      {!state.w9_required && !state.agreement_required ? <div className="review-clear">No tax documents are required for this relationship as currently configured.</div> : <>
        {state.w9_required && <div className="upload-row"><div><strong>Form W-9</strong><p>Required before payment activation. Taxpayer IDs remain inside the private document.</p></div><label className="button secondary file-button">{uploading==='w9'?'Uploading…':'Upload W-9'}<input type="file" accept=".pdf,image/*" disabled={Boolean(uploading)} onChange={e=>{const f=e.target.files?.[0]; if(f) void uploadDocument('w9',f)}} /></label></div>}
        {state.agreement_required && <div className="upload-row"><div><strong>Signed contractor/vendor agreement</strong><p>Upload the fully executed agreement for CareForVets review.</p></div><label className="button secondary file-button">{uploading==='contractor_agreement'?'Uploading…':'Upload agreement'}<input type="file" accept=".pdf,image/*" disabled={Boolean(uploading)} onChange={e=>{const f=e.target.files?.[0]; if(f) void uploadDocument('contractor_agreement',f)}} /></label></div>}
        {state.classification_review_required && <div className="review-blocker"><strong>Worker-classification review required.</strong> CareForVets staff must document behavioral control, financial control, and the relationship of the parties before activation.</div>}
      </>}
    </section>}
  </Layout>
}
