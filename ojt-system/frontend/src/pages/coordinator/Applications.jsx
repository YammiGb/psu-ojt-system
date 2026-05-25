import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationService } from '../../services'
import toast from 'react-hot-toast'
import { FileText, CheckCircle, XCircle, Clock, Eye, Search, X, RotateCcw, AlertTriangle, ExternalLink, Users } from 'lucide-react'
import { ensureAbsoluteUrl } from '../../utils/url'


const STATUS_STYLE = {
  pending:      'bg-amber-50 text-amber-800 border border-amber-200/50',
  under_review: 'bg-blue-50 text-blue-800 border border-blue-200/50',
  approved:     'bg-green-50 text-green-700 border border-green-200/50',
  rejected:     'bg-rose-50 text-rose-800 border border-rose-200/50',
  withdrawn:    'bg-gray-50 text-gray-500 border border-gray-200/50',
}

const STATUS_LABELS = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

const FILTERS = ['', 'pending', 'under_review', 'approved', 'rejected', 'withdrawn']

export default function CoordinatorApplications() {
  const qc = useQueryClient()
  const [filter, setFilter]           = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [searchText, setSearchText] = useState('')

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['all-applications', filter],
    queryFn: () => applicationService.list(filter ? { status: filter } : {}).then(r => r.data),
  })

  // Client-side search
  const filteredApps = useMemo(() => {
    if (!searchText.trim()) return applications
    const q = searchText.trim().toLowerCase()
    return applications.filter(app => {
      const name = (app.students?.users?.full_name || '').toLowerCase()
      const num = (app.students?.student_number || '').toLowerCase()
      const company = (app.companies?.name || '').toLowerCase()
      return name.includes(q) || num.includes(q) || company.includes(q)
    })
  }, [applications, searchText])

  const reviewMut = useMutation({
    mutationFn: ({ id, data }) => applicationService.review(id, data),
    onSuccess: (_, vars) => {
      toast.success(`Application ${vars.data.status}!`)
      qc.invalidateQueries(['all-applications'])
      setRejectModal(null)
      setRejectReason('')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to process application'),
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
    <div className="w-full max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            OJT Applications
          </h1>
          <p className="text-gray-400 font-medium text-xs lg:text-sm mt-1.5">
            Review, approve, or reject student OJT applications. Track document submissions and manage placement queues.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          {pending > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-100">
              <Clock size={13} />
              <span>{pending} Pending</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-3 py-1.5 rounded-xl border border-blue-100">
            <Users size={13} />
            <span>{applications.length} Total</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white/40 p-1.5 rounded-2xl border border-gray-100 max-w-max flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-[13px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              filter === f
                ? 'bg-blue-950 text-white shadow-md shadow-blue-950/15'
                : 'text-gray-500 hover:text-blue-950 hover:bg-gray-100/50'
            }`}>
            {f === '' ? 'All' : STATUS_LABELS[f] || f.replace('_', ' ')}
            {f === 'pending' && pending > 0 && (
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'
              }`}>
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-150 rounded-3xl shadow-sm p-5">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            className="w-full border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white placeholder:text-gray-500 placeholder:font-semibold"
            placeholder="Search by student name, student number, or company…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-3xl border border-gray-150 shadow-md">
          <FileText size={48} className="mx-auto mb-3 opacity-20 text-blue-950" />
          <p className="text-base font-bold text-gray-700">
            {searchText ? 'No applications match your search' : 'No applications found'}
          </p>
          <p className="text-sm mt-1 text-gray-400">
            {searchText
              ? 'Try adjusting your search term or changing the status filter.'
              : 'Applications will appear here once students submit their OJT forms.'}
          </p>
          {searchText && (
            <button onClick={() => setSearchText('')}
              className="mt-4 text-xs font-black uppercase tracking-wider text-blue-800 hover:text-blue-950 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 cursor-pointer transition-all inline-flex items-center gap-1.5">
              <RotateCcw size={12} /> Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-150 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-blue-950 text-white text-[10px] uppercase font-black tracking-widest border-b border-blue-900">
                <tr>
                  {['Student', 'Program', 'Company', 'Semester', 'Documents', 'Status', 'Submitted', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-left font-black tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApps.map(app => {
                  const docs = [app.consent_form_url, app.endorsement_letter_url, app.parent_consent_url].filter(Boolean).length
                  const canAct = ['pending', 'under_review'].includes(app.status)

                  return (
                    <tr key={app.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-blue-800 flex items-center justify-center font-black text-xs shadow-inner uppercase flex-shrink-0 border border-blue-200/50">
                            {app.students?.users?.full_name?.substring(0, 2) || 'ST'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-blue-950 text-sm tracking-tight truncate" title={app.students?.users?.full_name}>
                              {app.students?.users?.full_name || '—'}
                            </p>
                            <p className="text-[11px] text-gray-400 font-semibold mt-0.5 truncate">{app.students?.student_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="bg-blue-50/80 border border-blue-100 text-blue-800 px-2.5 py-1 rounded-lg text-[11px] font-extrabold">
                          {app.students?.program}
                        </span>
                        {app.students?.section && (
                          <span className="text-gray-400 text-[11px] font-semibold ml-1.5">· {app.students.section}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {app.companies?.name
                          ? <span className="font-bold text-gray-700 text-xs">{app.companies.name}</span>
                          : <span className="text-xs text-gray-300 italic font-medium">None selected</span>
                        }
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-gray-600 text-xs">{app.semester} / {app.academic_year}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          {[
                            [app.consent_form_url,       'CF', 'Consent Form'],
                            [app.endorsement_letter_url, 'EL', 'Endorsement Letter'],
                            [app.parent_consent_url,     'PC', 'Parent Consent'],
                          ].map(([url, label, title]) => (
                             url
                              ? <a key={label} href={ensureAbsoluteUrl(url)} target="_blank" rel="noreferrer" title={title}
                                  className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-lg font-black uppercase tracking-wider hover:bg-green-100 border border-green-200/50 transition-colors inline-flex items-center gap-0.5">
                                  {label} <ExternalLink size={8} />
                                </a>
                              : <span key={label} title={`${title} — Not uploaded`}
                                  className="text-[10px] bg-gray-50 text-gray-300 px-2 py-1 rounded-lg font-black uppercase tracking-wider border border-gray-100">
                                  {label}
                                </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-sm ${STATUS_STYLE[app.status]}`}>
                          {STATUS_LABELS[app.status] || app.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-400 font-bold">
                          {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {canAct ? (
                          <div className="flex gap-1.5 flex-wrap">
                            {app.status === 'pending' && (
                              <button onClick={() => markUnderReview(app)}
                                className="text-[10px] font-black uppercase tracking-wider border border-blue-300 text-blue-800 px-3 py-1.5 rounded-xl hover:bg-blue-50 cursor-pointer flex items-center gap-1 transition-all">
                                <Eye size={10} /> Review
                              </button>
                            )}
                            <button onClick={() => approve(app)}
                              className="text-[10px] font-black uppercase tracking-wider border border-green-300 text-green-700 px-3 py-1.5 rounded-xl hover:bg-green-50 cursor-pointer flex items-center gap-1 transition-all">
                              <CheckCircle size={10} /> Approve
                            </button>
                            <button onClick={() => { setRejectModal(app); setRejectReason('') }}
                              className="text-[10px] font-black uppercase tracking-wider border border-rose-300 text-rose-600 px-3 py-1.5 rounded-xl hover:bg-rose-50 cursor-pointer flex items-center gap-1 transition-all">
                              <XCircle size={10} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 font-bold">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Showing {filteredApps.length} of {applications.length} application{applications.length !== 1 ? 's' : ''}
            </span>
            {searchText && (
              <button onClick={() => setSearchText('')}
                className="text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer transition-all">
                <RotateCcw size={10} /> Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-700 to-rose-600 px-6 py-5 flex items-center justify-between text-white border-b border-rose-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <XCircle className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">Reject Application</h2>
                  <p className="text-rose-200 text-[10px] sm:text-xs font-medium mt-0.5">
                    {rejectModal.students?.users?.full_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="p-2 hover:bg-white/10 rounded-xl text-rose-200 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-4 flex-1">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                  Reason for Rejection <span className="text-rose-500">*</span>
                </label>
                <textarea rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none bg-white"
                  placeholder="Explain why this application is being rejected…"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
              <button onClick={() => setRejectModal(null)}
                className="border border-gray-300 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-all duration-200">
                Cancel
              </button>
              <button onClick={confirmReject} disabled={reviewMut.isPending}
                className="bg-rose-600 text-white hover:bg-rose-700 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-rose-600/10 active:scale-95 disabled:opacity-50">
                {reviewMut.isPending ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
