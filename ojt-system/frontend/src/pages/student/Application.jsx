import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationService, companyService, studentService } from '../../services'
import toast from 'react-hot-toast'

const STATUS_STYLE = {
  pending:      'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  approved:     'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-700',
  withdrawn:    'bg-gray-100 text-gray-500',
}

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
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">OJT Application</h1>
        {!hasActive && canApply && (
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            + Apply Now
          </button>
        )}
      </div>

      {/* Eligibility warning */}
      {!canApply && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="font-semibold text-yellow-800 text-sm mb-1">⚠️ Cannot apply yet</p>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-0.5">
            {!profile?.portal_verified && <li>You must verify your PSU portal first</li>}
            {profile?.has_disqualifying_grade && <li>You have failed or incomplete subjects</li>}
            {profile?.enrollment_status !== 'enrolled' && <li>You must be enrolled</li>}
          </ul>
        </div>
      )}

      {/* Application form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Submit OJT Application</h2>
          <form onSubmit={(e) => { e.preventDefault(); submitMut.mutate(form) }} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.semester} onChange={set('semester')}>
                  {SEMESTERS.map(s => <option key={s} value={s}>{s} Semester</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.academic_year} onChange={set('academic_year')} placeholder="e.g. 2024-2025" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Company
                <span className="ml-1 text-xs text-gray-400">(optional — coordinator may assign)</span>
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.company_id} onChange={set('company_id')}>
                <option value="">-- No preference --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.industry ? `(${c.industry})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Document URLs */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Document URLs</p>
              <p className="text-xs text-gray-400 mb-3">
                Upload documents to Google Drive or any storage, then paste the link here.
              </p>
              <div className="space-y-3">
                {[
                  ['consent_form_url',        'Consent Form URL'],
                  ['endorsement_letter_url',   'Endorsement Letter URL'],
                  ['parent_consent_url',       'Parent Consent URL'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type="url"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://drive.google.com/..."
                      value={form[key]} onChange={set(key)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitMut.isPending}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                {submitMut.isPending ? 'Submitting…' : 'Submit Application'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-300 px-5 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Applications list */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-10">Loading…</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
          <p className="text-lg">No applications yet.</p>
          {canApply && <p className="text-sm mt-1">Click "Apply Now" to get started.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-gray-800">
                    {app.semester} Semester — {app.academic_year}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Company: {app.companies?.name || <span className="italic">Not specified</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submitted: {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_STYLE[app.status]}`}>
                  {app.status.replace('_', ' ')}
                </span>
              </div>

              {/* Document checklist */}
              <div className="flex flex-wrap gap-3 text-xs mt-3">
                {[
                  ['Consent Form',       app.consent_form_url],
                  ['Endorsement Letter', app.endorsement_letter_url],
                  ['Parent Consent',     app.parent_consent_url],
                ].map(([label, url]) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className={url ? 'text-green-500' : 'text-gray-300'}>
                      {url ? '✓' : '○'}
                    </span>
                    {url
                      ? <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{label}</a>
                      : <span className="text-gray-400">{label}</span>
                    }
                  </div>
                ))}
              </div>

              {/* Rejection reason */}
              {app.status === 'rejected' && app.rejection_reason && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <strong>Rejected:</strong> {app.rejection_reason}
                </div>
              )}

              {/* Withdraw button */}
              {['pending', 'under_review'].includes(app.status) && (
                <button
                  onClick={() => { if (window.confirm('Withdraw this application?')) withdrawMut.mutate(app.id) }}
                  className="mt-3 text-xs text-red-500 hover:underline">
                  Withdraw application
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
