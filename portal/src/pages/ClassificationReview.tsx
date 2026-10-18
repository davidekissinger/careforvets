import { FormEvent, useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../auth'
import { supabase } from '../lib/supabase'

export default function ClassificationReview(){
  const {caseId}=useParams()
  const {user,demo}=useAuth()
  const [behavioral,setBehavioral]=useState('')
  const [financial,setFinancial]=useState('')
  const [relationship,setRelationship]=useState('')
  const [determination,setDetermination]=useState('contractor_supported')
  const [rationale,setRationale]=useState('')
  const [message,setMessage]=useState('')
  const [saving,setSaving]=useState(false)

  useEffect(()=>{
    if(!demo || !caseId) return
    const saved=localStorage.getItem(`cfv_demo_classification_${caseId}`)
    if(saved){
      const p=JSON.parse(saved)
      setBehavioral(p.behavioral??'')
      setFinancial(p.financial??'')
      setRelationship(p.relationship??'')
      setDetermination(p.determination??'contractor_supported')
      setRationale(p.rationale??'')
    }
  },[demo,caseId])

  async function save(event:FormEvent){
    event.preventDefault()
    if(!caseId) return
    setSaving(true)
    setMessage('')

    if(demo){
      localStorage.setItem(`cfv_demo_classification_${caseId}`,JSON.stringify({behavioral,financial,relationship,determination,rationale}))
      const saved=localStorage.getItem('cfv_demo_partner_queue')
      if(saved){
        const items=JSON.parse(saved).map((item:any)=>item.id===caseId?{
          ...item,
          classification_status:determination,
          blockers:determination==='contractor_supported'?(item.blockers??[]).filter((x:string)=>x!=='worker classification'):[...new Set([...(item.blockers??[]),'worker classification'])],
        }:item)
        for(const item of items){
          item.activation_ready=(item.blockers??[]).length===0
          if(item.activation_ready) item.next_action='Final partner verification review'
        }
        localStorage.setItem('cfv_demo_partner_queue',JSON.stringify(items))
      }
      setMessage('Synthetic classification review saved locally.')
      setSaving(false)
      return
    }

    if(!user){
      setMessage('Staff authentication required.')
      setSaving(false)
      return
    }

    const {error}=await supabase.rpc('save_partner_classification_review',{
      target_case:caseId,
      behavioral_summary:behavioral,
      financial_summary:financial,
      relationship_summary:relationship,
      target_determination:determination,
      target_rationale:rationale,
    })

    setMessage(error?error.message:'Classification review saved.')
    setSaving(false)
  }

  if(!user && !demo){
    return <Layout><section className="login-card"><p className="eyebrow">Worker classification</p><h1>Staff access required.</h1><NavLink className="button secondary" to="/admin/partner-verification">Back to queue</NavLink></section></Layout>
  }

  return <Layout>
    <NavLink className="back-link" to="/admin/partner-verification">← Back to verification queue</NavLink>
    <section className="hero compact"><p className="eyebrow">{demo?'Synthetic classification review':'Worker-classification review'}</p><h1>Document the relationship—not just the label.</h1><p className="lead">Review behavioral control, financial control, and the relationship of the parties before supporting an independent-contractor engagement.</p></section>

    <form className="profile-form classification-form" onSubmit={save}>
      <label>Behavioral control<textarea value={behavioral} onChange={e=>setBehavioral(e.target.value)} placeholder="Who directs how, when, and where the work is performed? What instructions or training are provided?" required /></label>
      <label>Financial control<textarea value={financial} onChange={e=>setFinancial(e.target.value)} placeholder="Describe investment, unreimbursed expenses, opportunity for profit/loss, and payment structure." required /></label>
      <label>Relationship of the parties<textarea value={relationship} onChange={e=>setRelationship(e.target.value)} placeholder="Describe contracts, benefits, permanency, integration into operations, and the parties’ intended relationship." required /></label>
      <label>Determination<select value={determination} onChange={e=>setDetermination(e.target.value)}>
        <option value="contractor_supported">Independent contractor supported</option>
        <option value="employee_risk">Employee-classification risk</option>
        <option value="legal_review">Legal/employment review required</option>
      </select></label>
      <label>Rationale<textarea value={rationale} onChange={e=>setRationale(e.target.value)} placeholder="Explain the basis for the determination." required /></label>
      <button className="button primary" type="submit" disabled={saving}>{saving?'Saving…':'Save classification review'}</button>
      {message && <p className="form-message" role="status">{message}</p>}
    </form>
  </Layout>
}
