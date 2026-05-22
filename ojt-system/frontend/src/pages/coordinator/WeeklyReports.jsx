import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { monitoringService } from '../../services'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { BookOpen, ChevronDown, ChevronUp, CheckCircle2, RotateCcw } from 'lucide-react'

export default function CoordinatorWeeklyReports() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('submitted')
  const [expanded, setExpanded] = useState({})
  const [reviewModal, setReviewModal] = useState(null) // { report, action }
  const [remarks, setRemarks] = useState('')

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['all-weekly-reports', filter],
    queryFn: () => monitoringService.listAllReports(filter || undefined).then(r => r.data),
  })

  const ackMut = useMutation({
    mutationFn: ({ id, status, remarks }) =>
      monitoringService.acknowledgeReport(id, remarks, status),
    onSuccess: () => {
      toast.success(reviewModal?.action === 'acknowledge' ? 'Report acknowledged!' : 'Report returned to student')
      qc.invalidateQueries(['all-weekly-reports'])
      setReviewModal(null)
      setRemarks('')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed'),
  })

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  if (isLoading) return <LoadingSpinner />

  const pendingCount = reports.filter(r => r.status === 'submitted').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen size={22} /> Weekly Reports
          </h1>
          {pendingCount > 0 && (
            <p className="text-sm text-yellow-600 mt-0.5 font-medium">
              {pendingCount} report{pendingCount > 1 ? 's' : ''} pending review
            </p>
          )}
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { label: 'Pending', value: 'submitted' },
            { label: 'Acknowledged', value: 'acknowledged' },
            { label: 'Returned', value: 'returned' },
            { label: 'All', value: '' },
          ].map(tab => (
            <button key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === tab.value ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {reports.length === 0 && (
        <div className="card text-center text-gray-400 py-12">
          <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
          <p>No reports found.</p>
        </div>
      )}

      <div className="space-y-3">
        {reports.map(r => (
          <div key={r.id} className={`card ${r.status === 'submitted' ? 'border-yellow-200 bg-yellow-50/30' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-800">
                  {r.students?.users?.full_name || 'Unknown Student'} — Week {r.week_number}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {r.week_start} to {r.week_end}
                  {r.students?.section && <span className="ml-2">· Section {r.students.section}</span>}
                  <span className="ml-2">· Submitted {new Date(r.created_at).toLocaleDateString()}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <StatusBadge status={r.status} />
                <button onClick={() => toggle(r.id)} className="text-gray-400 hover:text-gray-600">
                  {expanded[r.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {/* Preview of accomplishments */}
            {!expanded[r.id] && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{r.accomplishments}</p>
            )}

            {expanded[r.id] && (
              <div className="mt-4 space-y-3 text-sm border-t border-gray-100 pt-4">
                <div>
                  <p className="font-medium text-gray-600 mb-1">Accomplishments</p>
                  <p className="text-gray-700 whitespace-pre-line">{r.accomplishments}</p>
                </div>
                {r.challenges && (
                  <div>
                    <p className="font-medium text-gray-600 mb-1">Challenges</p>
                    <p className="text-gray-700">{r.challenges}</p>
                  </div>
                )}
                {r.learnings && (
                  <div>
                    <p className="font-medium text-gray-600 mb-1">Learnings</p>
                    <p className="text-gray-700">{r.learnings}</p>
                  </div>
                )}
                {r.file_url && (
                  <a href={r.file_url} target="_blank" rel="noreferrer"
                    className="text-blue-600 text-xs hover:underline">
                    View attached file →
                  </a>
                )}
                {r.coordinator_remarks && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Your previous remarks</p>
                    <p className="text-gray-700">{r.coordinator_remarks}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons — only on submitted */}
            {r.status === 'submitted' && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => { setReviewModal({ report: r, action: 'acknowledge' }); setRemarks('') }}
                  className="btn-primary text-sm py-1.5 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Acknowledge
                </button>
                <button
                  onClick={() => { setReviewModal({ report: r, action: 'return' }); setRemarks('') }}
                  className="btn-secondary text-sm py-1.5 flex items-center gap-1.5">
                  <RotateCcw size={14} /> Return
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-1">
              {reviewModal.action === 'acknowledge' ? 'Acknowledge Report' : 'Return Report'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {reviewModal.action === 'acknowledge'
                ? 'Mark this report as reviewed and acknowledged.'
                : 'Return this report to the student with feedback.'}
            </p>
            <label className="label">
              Remarks {reviewModal.action === 'return' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              className="input h-24 resize-none"
              placeholder={reviewModal.action === 'acknowledge'
                ? 'Optional comments for the student...'
                : 'Explain what needs to be revised...'}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => ackMut.mutate({
                  id: reviewModal.report.id,
                  status: reviewModal.action === 'acknowledge' ? 'acknowledged' : 'returned',
                  remarks,
                })}
                className={reviewModal.action === 'acknowledge' ? 'btn-primary' : 'btn-secondary'}
                disabled={ackMut.isPending || (reviewModal.action === 'return' && !remarks)}>
                {ackMut.isPending ? 'Saving…'
                  : reviewModal.action === 'acknowledge' ? 'Confirm Acknowledge' : 'Confirm Return'}
              </button>
              <button className="btn-secondary" onClick={() => setReviewModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
