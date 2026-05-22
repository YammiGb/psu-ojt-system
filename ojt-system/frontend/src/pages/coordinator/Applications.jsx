import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationService } from '../../services'
import toast from 'react-hot-toast'

const STATUS_STYLE = {
  pending:      'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  approved:     'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-700',
  withdrawn:    'bg-gray-100 text-gray-500',
}

const FILTERS = ['', 'pending', 'under_review', 'approved', 'rejected', 'withdrawn']

export default function CoordinatorApplications() {
  const qc = useQueryClient()
  const [filter, setFilter]           = useState('')
  const [rejectModal, setRejectModal] = useState(null)   // app object
  const [rejectReason, setRejectReason] = useState('')

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['all-applications', filter],
    queryFn: () => applicationService.list(filter ? { status: filter } : {}).then(r => r.data),
  })

  const reviewMut = useMutation({
    mutationFn: ({ id, data }) => applicationService.review(id, data),
    onSuccess: (_, vars) => {
      toast.success(`Application ${vars.data.status}!`)
      qc.invalidateQueries(['all-applications'])
      setRejectModal(null)
      setRejectReason('')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const approve = (app) => {
    if (window.confirm(`Approve application for ${app.students?.users?.full_name}?`)) {
      reviewMut.mutate({ id: app.id, data: { status: 'approved' } })
    }
  }

  const markUnderReview = (app) => {
    reviewMut.mutate({ id: app.id, data: { status: 'under_review' } })
  }

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason')
      return
    }
    reviewMut.mutate({
      id: rejectModal.id,
      data: { status: 'rejected', rejection_reason: rejectReason },
    })
  }

  const pending  = applications.filter(a => a.status === 'pending').length
  const reviewed = applications.filter(a => ['approved', 'rejected'].includes(a.status)).length

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">OJT Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pending > 0 && <span className="text-yellow-600 font-medium">{pending} pending review · </span>}
            {reviewed} reviewed
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}>
            {f === '' ? 'All' : f.replace('_', ' ')}
            {f === 'pending' && pending > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-10">Loading…</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
          No applications found.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                {['Student', 'Program', 'Company', 'Semester', 'Documents', 'Status', 'Submitted', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map(app => {
                const docs = [app.consent_form_url, app.endorsement_letter_url, app.parent_consent_url].filter(Boolean).length
                const canAct = ['pending', 'under_review'].includes(app.status)

                return (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{app.students?.users?.full_name || '—'}</p>
                      <p className="text-xs text-gray-400">{app.students?.student_number}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {app.students?.program}
                      {app.students?.section && <span className="text-gray-400"> · {app.students.section}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {app.companies?.name || <span className="italic text-gray-400">None</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {app.semester} / {app.academic_year}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {[
                          [app.consent_form_url,       'CF'],
                          [app.endorsement_letter_url, 'EL'],
                          [app.parent_consent_url,     'PC'],
                        ].map(([url, label]) => (
                          url
                            ? <a key={label} href={url} target="_blank" rel="noreferrer"
                                className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium hover:bg-green-200">
                                {label}
                              </a>
                            : <span key={label} className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-medium">
                                {label}
                              </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[app.status]}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {canAct ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {app.status === 'pending' && (
                            <button onClick={() => markUnderReview(app)}
                              className="text-xs border border-blue-300 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50">
                              Review
                            </button>
                          )}
                          <button onClick={() => approve(app)}
                            className="text-xs border border-green-300 text-green-700 px-2 py-1 rounded-lg hover:bg-green-50">
                            Approve
                          </button>
                          <button onClick={() => { setRejectModal(app); setRejectReason('') }}
                            className="text-xs border border-red-300 text-red-600 px-2 py-1 rounded-lg hover:bg-red-50">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-1">Reject Application</h3>
            <p className="text-sm text-gray-500 mb-4">
              Student: <strong>{rejectModal.students?.users?.full_name}</strong>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for rejection <span className="text-red-500">*</span>
            </label>
            <textarea rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Explain why this application is being rejected…"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={confirmReject} disabled={reviewMut.isPending}
                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium">
                {reviewMut.isPending ? 'Rejecting…' : 'Confirm Reject'}
              </button>
              <button onClick={() => setRejectModal(null)}
                className="border border-gray-300 px-5 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
