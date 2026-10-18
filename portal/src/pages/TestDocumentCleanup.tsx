import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../auth'
import { supabase } from '../lib/supabase'

const caseId = '62fdbba6-ac49-4a92-99db-113d148eb9b5'

export default function TestDocumentCleanup() {
  const { user, accountType, loading } = useAuth()
  const [confirmed, setConfirmed] = useState(false)
  const [running, setRunning] = useState(false)
  const [complete, setComplete] = useState(false)
  const [message, setMessage] = useState('')

  async function cleanup() {
    if (!user || accountType !== 'staff' || !confirmed || running || complete) return
    if (!window.confirm('Permanently remove the two test-only documents and their metadata? Historical decision/audit records will be preserved.')) return

    setRunning(true)
    setMessage('')

    const { data: docs, error: lookupError } = await supabase
      .from('partner_verification_documents')
      .select('id,storage_path,document_type')
      .eq('verification_case_id', caseId)
      .in('document_type', ['w9', 'contractor_agreement'])

    if (lookupError) {
      setMessage('Could not load target document records: ' + lookupError.message)
      setRunning(false)
      return
    }

    const paths = (docs ?? []).map(d => d.storage_path).filter(Boolean) as string[]
    if (paths.length) {
      const { error } = await supabase.storage.from('partner-tax-documents').remove(paths)
      if (error) {
        setMessage('Storage deletion failed; no document metadata was removed. ' + error.message)
        setRunning(false)
        return
      }
    }

    const ids = (docs ?? []).map(d => d.id)
    if (ids.length) {
      const { error } = await supabase
        .from('partner_verification_documents')
        .delete()
        .in('id', ids)
        .eq('verification_case_id', caseId)

      if (error) {
        setMessage('Storage files were removed, but metadata cleanup failed. ' + error.message)
        setRunning(false)
        return
      }
    }

    const { error: caseError } = await supabase
      .from('partner_verification_cases')
      .update({
        w9_status: 'required',
        agreement_status: 'required',
        verification_status: 'paused',
        final_review_status: 'paused',
        final_review_note: 'Administrative correction: test-only documents removed. CareForVets is not an active external partner. Prior decision history retained.',
        next_action: 'Closed administratively — test documents removed; not an external partner',
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId)

    if (caseError) {
      setMessage('Documents were removed, but the closed test-case status update failed. ' + caseError.message)
      setRunning(false)
      return
    }

    const { error: auditError } = await supabase.from('audit_events').insert({
      actor_user_id: user.id,
      action: 'test_partner_documents_deleted',
      entity_type: 'partner_verification_case',
      entity_id: caseId,
      metadata: { reason: 'User confirmed uploads were test-only', deleted_document_count: ids.length, prior_decision_history_preserved: true },
    })

    setComplete(true)
    setMessage(auditError
      ? 'The test files and metadata were removed; the case remains closed. Audit insert warning: ' + auditError.message
      : 'Complete: test files and metadata removed. The case remains closed, and decision/audit history was preserved.')
    setRunning(false)
  }

  if (loading) return <Layout><section className="section-card"><p>Checking staff access…</p></section></Layout>
  if (!user || accountType !== 'staff') return <Layout><section className="section-card"><h1>Staff access required</h1><NavLink className="button secondary" to="/admin/partner-verification">Return to verification</NavLink></section></Layout>

  return <Layout>
    <NavLink className="back-link" to="/admin/partner-verification">← Back to verification queue</NavLink>
    <section className="hero compact">
      <p className="eyebrow">One-time administrative cleanup</p>
      <h1>Remove test-only uploads</h1>
      <p className="lead">This permanently removes the test W-9 and contractor agreement from private storage and deletes their document metadata. Historical decision/audit entries are preserved. The internal CareForVets platform organization is not changed.</p>
    </section>
    <section className="section-card cleanup-card">
      <h2>Cleanup scope</h2>
      <ul><li>Test W-9 upload</li><li>Test contractor/vendor agreement upload</li></ul>
      <p><strong>Preserved:</strong> historical approval and administrative-closure decisions.</p>
      <p><strong>Reset:</strong> the closed test case remains paused, with both document requirements reset and no active partner status.</p>
      {complete && <p className="review-clear">Cleanup completed.</p>}
      <label className="checkbox-row"><input type="checkbox" checked={confirmed} disabled={complete || running} onChange={e => setConfirmed(e.target.checked)} /><span>I confirm both uploads were test-only and may be permanently deleted.</span></label>
      <button className="button danger" type="button" disabled={!confirmed || running || complete} onClick={() => void cleanup()}>{running ? 'Removing test files…' : complete ? 'Cleanup completed' : 'Permanently delete test uploads'}</button>
      {message && <p className="form-message" role="status">{message}</p>}
    </section>
  </Layout>
}
