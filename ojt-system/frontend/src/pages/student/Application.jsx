import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationService, companyService, studentService } from '../../services'
import toast from 'react-hot-toast'
import { FileText, Plus, ExternalLink, ShieldAlert, Archive, X } from 'lucide-react'

const SEMESTERS     = ['1st', '2nd', 'Summer']
const CURRENT_YEAR  = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

export default function StudentApplication() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    company_id: '',
    semester: '1st',
    academic_year: CURRENT_YEAR,
    consent_form_url: '',
    endorsement_letter_url: '',
    parent_consent_url: '',
  })

  // My profile (to check eligibility)
  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => studentService.me().then(r => r.data),
  })

  // My applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationService.list().then(r => r.data),
  })

  // Accredited companies
  const { data: companies = [] } = useQuery({
    queryKey: ['companies-accredited'],
    queryFn: () => companyService.list({ is_accredited: true }).then(r => r.data),
  })

  const submitMut = useMutation({
    mutationFn: (d) => applicationService.submit(d),
    onSuccess: () => {
      toast.success('Application submitted!')
      qc.invalidateQueries(['my-applications'])
      setShowForm(false)
      setForm({ company_id: '', semester: '1st', academic_year: CURRENT_YEAR, consent_form_url: '', endorsement_letter_url: '', parent_consent_url: '' })
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to submit'),
  })

  const withdrawMut = useMutation({
    mutationFn: (id) => applicationService.withdraw(id),
    onSuccess: () => { toast.success('Application withdrawn'); qc.invalidateQueries(['my-applications']) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const hasActive = applications.some(a => ['pending', 'under_review', 'approved'].includes(a.status))

  const canApply = profile?.portal_verified && !profile?.has_disqualifying_grade && profile?.enrollment_status === 'enrolled'

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            OJT Application
          </h1>
          <p className="text-gray-400 font-medium text-xs lg:text-sm mt-1.5">
            Submit new OJT applications, track review statuses, and review your required credential endorsements.
          </p>
        </div>
        {/* Always show Apply Now — eligibility is enforced inside the modal */}
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 self-start sm:self-center text-xs sm:text-sm py-2.5 px-5 font-extrabold cursor-pointer">
          <Plus size={16} /> Apply Now
        </button>
      </div>

      {/* Eligibility Warning */}
      {!canApply && (
        <div className="card border-2 border-amber-200 bg-amber-50/15 p-5 shadow-md flex gap-4 items-start rounded-2xl">
          <ShieldAlert className="w-7 h-7 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-black text-blue-950 mb-1.5 uppercase tracking-wider">OJT Application Locked</h3>
            <p className="text-xs font-semibold text-gray-500 mb-3">You must resolve the following academic requirements before starting your OJT application:</p>
            <ul className="space-y-1.5">
              {!profile?.portal_verified && (
                <li className="flex items-center gap-2 text-xs text-amber-900 font-bold bg-amber-100/50 py-1.5 px-3 rounded-xl border border-amber-200/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Verify your PSU campus portal
                </li>
              )}
              {profile?.has_disqualifying_grade && (
                <li className="flex items-center gap-2 text-xs text-amber-900 font-bold bg-amber-100/50 py-1.5 px-3 rounded-xl border border-amber-200/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> You have failed or incomplete grades
                </li>
              )}
              {profile?.enrollment_status !== 'enrolled' && (
                <li className="flex items-center gap-2 text-xs text-amber-900 font-bold bg-amber-100/50 py-1.5 px-3 rounded-xl border border-amber-200/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> You must be officially enrolled
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Applications History */}
        <div className="space-y-4">
          <div className="card p-6 shadow-md border border-gray-150 flex justify-between items-center bg-gray-50/20 rounded-3xl">
            <h2 className="text-base sm:text-lg font-black text-blue-950">Submitted OJT Applications</h2>
            <span className="text-xs px-3 py-1 bg-blue-50 text-blue-900 rounded-full font-extrabold uppercase tracking-widest">{applications.length} submitted</span>
          </div>

          {isLoading ? (
            <div className="text-center text-gray-400 py-10 font-bold">Loading applications…</div>
          ) : applications.length === 0 ? (
            <div className="card text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-3xl bg-white">
              <Archive size={40} className="mx-auto mb-3 opacity-20 text-blue-950" />
              <p className="text-base font-bold text-gray-700">No applications filed yet</p>
              {canApply && <p className="text-sm mt-1 text-gray-400">Click "Apply Now" on the header above to draft your submission.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map(app => (
                <div key={app.id} className="card p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-150 rounded-3xl bg-white">
                  <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-gray-100/50">
                    <div>
                      <p className="text-lg font-black text-blue-950">
                        {app.semester} Semester — {app.academic_year}
                      </p>
                      <p className="text-sm text-gray-500 font-semibold mt-1">
                        Company: {app.companies?.name || <span className="italic text-gray-400">Not assigned yet</span>}
                      </p>
                      <p className="text-xs text-gray-400 font-medium mt-1">
                        Submitted: {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`badge text-[10px] py-1.5 px-3 rounded-full font-extrabold uppercase tracking-wider ${
                      app.status === 'approved' ? 'badge-green' : app.status === 'rejected' ? 'badge-red' : app.status === 'withdrawn' ? 'badge-gray' : 'badge-yellow'
                    }`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Document checklist */}
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-600 mt-4 bg-gray-50/50 rounded-2xl p-4 border border-gray-100/40">
                    {[
                      ['Consent Form',       app.consent_form_url],
                      ['Endorsement Letter', app.endorsement_letter_url],
                      ['Parent Consent',     app.parent_consent_url],
                    ].map(([label, url]) => (
                      <div key={label} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                        <span className={`w-2 h-2 rounded-full ${url ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer" className="text-blue-750 hover:text-blue-900 hover:underline flex items-center gap-1 font-extrabold">
                            {label} <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-gray-400">{label}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Rejection reason */}
                  {app.status === 'rejected' && app.rejection_reason && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800 font-semibold shadow-inner">
                      <strong>Rejection Remarks:</strong> {app.rejection_reason}
                    </div>
                  )}

                  {/* Withdraw button */}
                  {['pending', 'under_review'].includes(app.status) && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => { if (window.confirm('Withdraw this application?')) withdrawMut.mutate(app.id) }}
                        className="text-xs text-red-500 font-extrabold hover:text-red-750 transition-colors uppercase tracking-widest flex items-center gap-1 cursor-pointer">
                        Withdraw Application
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Application Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fadeIn">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 px-6 py-5 flex items-center justify-between text-white border-b border-blue-900">
              <div>
                <h2 className="text-lg font-black tracking-tight">OJT Application Form</h2>
                <p className="text-blue-200 text-xs font-medium mt-0.5">Submit your preferred company and required cloud credentials</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            {/* Modal Body */}
            <form onSubmit={(e) => { e.preventDefault(); submitMut.mutate(form) }} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">

                {/* Eligibility block — shown instead of form fields if not eligible */}
                {!canApply && (
                  <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/20 p-5 space-y-3">
                    <p className="text-sm font-black text-amber-800 uppercase tracking-wide">Application Locked</p>
                    <p className="text-xs font-semibold text-gray-500">Resolve the following before you can apply:</p>
                    <ul className="space-y-1.5">
                      {!profile?.portal_verified && (
                        <li className="flex items-center gap-2 text-xs text-amber-900 font-bold bg-amber-100/50 py-1.5 px-3 rounded-xl border border-amber-200/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Verify your PSU campus portal
                        </li>
                      )}
                      {profile?.has_disqualifying_grade && (
                        <li className="flex items-center gap-2 text-xs text-amber-900 font-bold bg-amber-100/50 py-1.5 px-3 rounded-xl border border-amber-200/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> You have failed or incomplete grades
                        </li>
                      )}
                      {profile?.enrollment_status !== 'enrolled' && (
                        <li className="flex items-center gap-2 text-xs text-amber-900 font-bold bg-amber-100/50 py-1.5 px-3 rounded-xl border border-amber-200/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> You must be officially enrolled
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Active application notice */}
                {canApply && hasActive && (
                  <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/20 p-5">
                    <p className="text-sm font-black text-blue-800 uppercase tracking-wide mb-1">Active Application Exists</p>
                    <p className="text-xs font-semibold text-gray-500">You already have a pending or approved application. Withdraw it first before submitting a new one.</p>
                  </div>
                )}

                {/* Form fields — only shown when eligible and no active application */}
                {canApply && !hasActive && (
                  <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-bold text-gray-750 mb-1">Semester *</label>
                    <select required className="input bg-white py-2.5 px-3 text-sm lg:text-sm animate-none"
                      value={form.semester} onChange={set('semester')}>
                      {SEMESTERS.map(s => <option key={s} value={s}>{s} Semester</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs font-bold text-gray-755 mb-1">Academic Year *</label>
                    <input required className="input py-2.5 px-3 text-sm lg:text-sm animate-none"
                      value={form.academic_year} onChange={set('academic_year')} placeholder="e.g. 2024-2025" />
                  </div>
                </div>

                <div>
                  <label className="label text-xs font-bold text-gray-755 mb-1">
                    Preferred Accredited Company
                    <span className="ml-1 text-[10px] text-gray-400 normal-case">(optional)</span>
                  </label>
                  <select className="input bg-white py-2.5 px-3 text-sm lg:text-sm animate-none" value={form.company_id} onChange={set('company_id')}>
                    <option value="">-- No preference --</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.industry ? `(${c.industry})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Document URLs */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-extrabold text-blue-950 uppercase tracking-widest mb-1.5">Required Cloud Credentials</p>
                  <p className="text-[10px] text-gray-450 font-medium mb-3">
                    Upload documents to cloud storage, set sharing permission to "Anyone with link", and paste the URLs:
                  </p>
                  <div className="space-y-3.5">
                    {[
                      ['consent_form_url',        'Consent Form URL'],
                      ['endorsement_letter_url',   'Endorsement Letter URL'],
                      ['parent_consent_url',       'Parent Consent URL'],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <label className="label text-xs font-bold text-gray-750 mb-1">{label}</label>
                        <input type="url"
                          className="input py-2.5 px-3 text-sm lg:text-sm animate-none"
                          placeholder="https://drive.google.com/file/d/..."
                          value={form[key]} onChange={set(key)} />
                      </div>
                    ))}
                  </div>
                </div>
                  </>
                )}
              </div>
              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
                <button type="button" className="border border-gray-350 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-all duration-200" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                {canApply && !hasActive && (
                  <button type="submit" className="bg-blue-900 text-white hover:bg-blue-950 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-blue-900/10 active:scale-95 disabled:opacity-50" disabled={submitMut.isPending}>
                    {submitMut.isPending ? 'Submitting…' : 'Submit Application'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
