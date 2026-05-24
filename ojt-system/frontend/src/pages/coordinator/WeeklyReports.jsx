import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { monitoringService } from '../../services'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { BookOpen, ChevronDown, ChevronUp, CheckCircle2, RotateCcw, Calendar, FileText, Send, X, ClipboardCheck, ArrowUpRight, HelpCircle } from 'lucide-react'

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
    <div className="w-full max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            Weekly Accomplishment Reports
          </h1>
          <p className="text-gray-400 font-medium text-xs lg:text-sm mt-1.5">
            Review weekly student submissions, verify learnings, and record academic evaluations.
          </p>
        </div>
        
        {/* Statistics Badge */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3.5 py-2.5 rounded-xl border border-amber-100 text-xs font-black uppercase tracking-wider self-start sm:self-center animate-pulse">
            <ClipboardCheck size={14} />
            <span>{pendingCount} Pending Review</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white/40 p-1.5 rounded-2xl border border-gray-100 max-w-max flex-wrap">
        {[
          { label: 'Pending review', value: 'submitted' },
          { label: 'Acknowledged', value: 'acknowledged' },
          { label: 'Returned', value: 'returned' },
          { label: 'All Reports', value: '' },
        ].map(tab => (
          <button 
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-[13px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              filter === tab.value
                ? 'bg-blue-950 text-white shadow-md'
                : 'text-gray-500 hover:text-blue-950 hover:bg-gray-100/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* No Reports State */}
      {reports.length === 0 && (
        <div className="text-center text-gray-400 py-16 bg-white rounded-3xl border border-gray-150 shadow-md">
          <BookOpen size={48} className="mx-auto mb-3 opacity-20 text-blue-950" />
          <p className="text-base font-bold text-gray-700">No accomplishment reports found</p>
          <p className="text-sm mt-1">Student submissions for this category will appear here.</p>
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map(r => {
          const isExpanded = expanded[r.id]
          return (
            <div 
              key={r.id} 
              className={`bg-white border border-gray-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group ${
                r.status === 'submitted' 
                  ? 'border-l-4 border-l-amber-500' 
                  : r.status === 'acknowledged' 
                    ? 'border-l-4 border-l-green-500' 
                    : 'border-l-4 border-l-rose-500'
              }`}
            >
              
              {/* Top Row Title / Meta */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100/60">
                <div>
                  <h3 className="font-black text-blue-950 text-base tracking-tight">
                    {r.students?.users?.full_name || 'Unknown Student'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-gray-400 mt-1">
                    <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                      Week {r.week_number}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {r.week_start} to {r.week_end}
                    </span>
                    {r.students?.section && (
                      <span>· Section {r.students.section}</span>
                    )}
                    <span>· Submitted {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
                  <StatusBadge status={r.status} />
                  <button 
                    onClick={() => toggle(r.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-xl transition-all cursor-pointer text-gray-400 hover:text-gray-600"
                  >
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>
                </div>
              </div>

              {/* Preview of Accomplishments */}
              {!isExpanded && (
                <div className="mt-3">
                  <p className="text-xs font-black uppercase text-gray-400 tracking-wider mb-1">Accomplishments preview:</p>
                  <p className="text-sm font-semibold text-gray-600 line-clamp-2 leading-relaxed">{r.accomplishments}</p>
                </div>
              )}

              {/* Expanded Journal Sections */}
              {isExpanded && (
                <div className="mt-4 space-y-4 text-xs sm:text-sm border-t border-gray-100 pt-4">
                  {/* Accomplishments */}
                  <div className="bg-blue-50/20 border border-blue-100/50 rounded-2xl p-4.5 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-blue-900 tracking-wider mb-1.5">Weekly Accomplishments</p>
                    <p className="text-sm text-gray-700 font-semibold leading-relaxed whitespace-pre-line">{r.accomplishments}</p>
                  </div>

                  {/* Challenges */}
                  {r.challenges && (
                    <div className="bg-rose-50/20 border border-rose-100/40 rounded-2xl p-4.5 shadow-sm">
                      <p className="text-[10px] font-black uppercase text-rose-800 tracking-wider mb-1.5">Challenges Encountered</p>
                      <p className="text-sm text-gray-755 font-semibold leading-relaxed">{r.challenges}</p>
                    </div>
                  )}

                  {/* Learnings */}
                  {r.learnings && (
                    <div className="bg-emerald-50/20 border border-emerald-100/40 rounded-2xl p-4.5 shadow-sm">
                      <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider mb-1.5">Key Learnings & Takeaways</p>
                      <p className="text-sm text-gray-755 font-semibold leading-relaxed">{r.learnings}</p>
                    </div>
                  )}

                  {/* Document Attachment Link */}
                  {r.file_url && (
                    <a href={r.file_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 border border-indigo-200/50 hover:bg-indigo-100/80 text-indigo-700 font-extrabold px-3.5 py-2 rounded-xl transition-all cursor-pointer">
                      <FileText size={12} /> View Attached Weekly File <ArrowUpRight size={12} />
                    </a>
                  )}

                  {/* Previous Remarks History */}
                  {r.coordinator_remarks && (
                    <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 shadow-sm">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Previous Coordinator Feedback</p>
                      <p className="text-xs text-gray-600 font-bold leading-relaxed">{r.coordinator_remarks}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons (Submitted Status Only) */}
              {r.status === 'submitted' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100/60 flex-wrap">
                  <button
                    onClick={() => { setReviewModal({ report: r, action: 'acknowledge' }); setRemarks('') }}
                    className="btn-primary text-xs font-black uppercase tracking-wider py-2.5 px-5 flex items-center gap-1.5 text-white"
                  >
                    <CheckCircle2 size={14} /> Acknowledge Report
                  </button>
                  <button
                    onClick={() => { setReviewModal({ report: r, action: 'return' }); setRemarks('') }}
                    className="btn-secondary text-xs font-black uppercase tracking-wider py-2.5 px-5 flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} /> Return to Student
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Review Dialog Sheets */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fadeIn">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
            
            <h3 className="text-lg font-black text-blue-950 mb-1 flex items-center gap-2">
              {reviewModal.action === 'acknowledge' ? (
                <>
                  <CheckCircle2 className="text-green-600" size={20} />
                  Acknowledge Weekly Journal
                </>
              ) : (
                <>
                  <RotateCcw className="text-rose-500" size={20} />
                  Return Weekly Journal
                </>
              )}
            </h3>
            
            <p className="text-xs text-gray-500 mb-5 font-semibold">
              {reviewModal.action === 'acknowledge'
                ? 'Mark this Weekly accomplishment report as approved, complete, and signed.'
                : 'Send this report back to the student with clear correction guidelines.'}
            </p>
            
            <label className="label">
              Feedback Remarks {reviewModal.action === 'return' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              className="input h-24 resize-none placeholder:text-gray-400 placeholder:font-semibold"
              placeholder={reviewModal.action === 'acknowledge'
                ? 'Provide any supportive comments for the student (optional)...'
                : 'State clearly what corrections or details must be added...'}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
            
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => ackMut.mutate({
                  id: reviewModal.report.id,
                  status: reviewModal.action === 'acknowledge' ? 'acknowledged' : 'returned',
                  remarks,
                })}
                className={`flex-1 py-3 text-xs uppercase font-extrabold tracking-wider text-white ${
                  reviewModal.action === 'acknowledge' ? 'btn-primary' : 'bg-rose-600 hover:bg-rose-700 px-5 rounded-xl font-bold cursor-pointer transition-all active:scale-95'
                }`}
                disabled={ackMut.isPending || (reviewModal.action === 'return' && !remarks)}
              >
                {ackMut.isPending ? 'Processing…' : 'Confirm Action'}
              </button>
              <button 
                className="btn-secondary flex-1 py-3 text-xs uppercase font-extrabold tracking-wider" 
                onClick={() => setReviewModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
