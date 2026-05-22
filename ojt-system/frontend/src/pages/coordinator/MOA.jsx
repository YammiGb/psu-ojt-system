import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { moaService, companyService } from '../../services'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { Shield, ChevronRight, X, CheckCircle2, Clock, XCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react'

const MOA_STEPS = [
  { key: 'campus_coordinator', label: 'Campus Coordinator' },
  { key: 'ced',                label: 'CED' },
  { key: 'lingayen',           label: 'Lingayen Campus' },
  { key: 'legal',              label: 'Legal Office' },
  { key: 'ojt_director',       label: 'OJT Director' },
  { key: 'vp',                 label: 'VP' },
  { key: 'bordsec',            label: 'BORDSEC' },
  { key: 'president',          label: 'President' },
]

function stepState(moa, idx) {
  if (moa.status === 'rejected' && moa.current_step === idx) return 'rejected'
  if (idx < moa.current_step) return 'done'
  if (idx === moa.current_step && moa.status !== 'signed' && moa.status !== 'rejected') return 'active'
  return 'pending'
}

function StepIcon({ state }) {
  if (state === 'done')     return <CheckCircle2 size={16} className="text-green-600" />
  if (state === 'active')   return <Clock size={16} className="text-blue-600" />
  if (state === 'rejected') return <XCircle size={16} className="text-red-500" />
  return <div className="w-4 h-4 rounded-full border border-gray-300" />
}

export default function MOATracker() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ company_id: '', document_url: '', semester: '', academic_year: '' })
  const [rejectForm, setRejectForm] = useState({ id: null, reason: '' })
  const [advanceForm, setAdvanceForm] = useState({ id: null, remarks: '' })
  const [expanded, setExpanded] = useState({})

  // FIX: unwrap axios response with .then(r => r.data)
  const { data: moas = [], isLoading } = useQuery({
    queryKey: ['moas'],
    queryFn: () => moaService.list().then(r => r.data),
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.list().then(r => r.data),
  })

  const initMut = useMutation({
    mutationFn: (f) => moaService.initiate(f.company_id, f.document_url || null, f.semester || null, f.academic_year || null),
    onSuccess: () => {
      toast.success('MOA initiated!')
      qc.invalidateQueries(['moas'])
      setShowNew(false)
      setNewForm({ company_id: '', document_url: '', semester: '', academic_year: '' })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to initiate'),
  })

  const advanceMut = useMutation({
    mutationFn: ({ id, remarks }) => moaService.advance(id, remarks),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'MOA advanced!')
      qc.invalidateQueries(['moas'])
      setAdvanceForm({ id: null, remarks: '' })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to advance'),
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => moaService.reject(id, reason),
    onSuccess: () => {
      toast.success('MOA rejected')
      qc.invalidateQueries(['moas'])
      setRejectForm({ id: null, reason: '' })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to reject'),
  })

  if (isLoading) return <LoadingSpinner />

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const statusCounts = moas.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Shield size={22} className="text-indigo-600" /> MOA Tracker
        </h1>
        <button onClick={() => setShowNew(true)} className="btn-primary text-sm">
          + Initiate MOA
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: moas.length,                                                                                          color: 'text-gray-700' },
          { label: 'In Review', value: Object.entries(statusCounts).filter(([k]) => !['signed','rejected'].includes(k)).reduce((s,[,v])=>s+v,0), color: 'text-blue-600' },
          { label: 'Signed',    value: statusCounts['signed']   || 0,                                                                        color: 'text-green-600' },
          { label: 'Rejected',  value: statusCounts['rejected'] || 0,                                                                        color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="card text-center py-3">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* New MOA Form */}
      {showNew && (
        <div className="card border-indigo-200 bg-indigo-50">
          <h2 className="font-semibold text-gray-800 mb-4">Initiate New MOA</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Company *</label>
              <select className="input" value={newForm.company_id}
                onChange={e => setNewForm({ ...newForm, company_id: e.target.value })}>
                <option value="">-- Select Company --</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Semester</label>
              <input className="input" placeholder="e.g. 2024-1" value={newForm.semester}
                onChange={e => setNewForm({ ...newForm, semester: e.target.value })} />
            </div>
            <div>
              <label className="label">Academic Year</label>
              <input className="input" placeholder="e.g. 2024-2025" value={newForm.academic_year}
                onChange={e => setNewForm({ ...newForm, academic_year: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Document URL (optional)</label>
              <input type="url" className="input" placeholder="https://drive.google.com/..."
                value={newForm.document_url}
                onChange={e => setNewForm({ ...newForm, document_url: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => initMut.mutate(newForm)} className="btn-primary"
              disabled={!newForm.company_id || initMut.isPending}>
              {initMut.isPending ? 'Initiating…' : 'Initiate MOA'}
            </button>
            <button className="btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* MOA List */}
      {moas.length === 0 && (
        <div className="card text-center text-gray-400 py-12">
          <FileText size={32} className="mx-auto mb-2 opacity-40" />
          <p>No MOA requests yet. Click "Initiate MOA" to start.</p>
        </div>
      )}

      <div className="space-y-3">
        {moas.map(moa => {
          const progressPct = moa.status === 'signed'   ? 100
                            : moa.status === 'rejected' ? 0
                            : Math.round((moa.current_step / 8) * 100)
          const isExpanded = expanded[moa.id]

          return (
            <div key={moa.id} className={`card transition-all ${moa.status === 'signed' ? 'border-green-200' : moa.status === 'rejected' ? 'border-red-200' : ''}`}>

              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{moa.companies?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {moa.semester      && <span className="mr-2">Sem: {moa.semester}</span>}
                    {moa.academic_year && <span className="mr-2">AY: {moa.academic_year}</span>}
                    Initiated: {new Date(moa.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <StatusBadge status={moa.status} />
                  {moa.document_url && (
                    <a href={moa.document_url} target="_blank" rel="noreferrer"
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
                      <FileText size={12} /> Doc
                    </a>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {moa.status !== 'rejected' && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Approval Progress</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className={`h-full rounded-full transition-all ${moa.status === 'signed' ? 'bg-green-500' : 'bg-indigo-500'}`}
                      style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              )}

              {/* Step chips */}
              <div className="flex flex-wrap gap-1 mb-3">
                {MOA_STEPS.map((step, i) => {
                  const state = stepState(moa, i)
                  return (
                    <span key={step.key} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                      state === 'done'     ? 'bg-green-50 border-green-300 text-green-700' :
                      state === 'active'   ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold' :
                      state === 'rejected' ? 'bg-red-50 border-red-300 text-red-600' :
                                            'bg-gray-50 border-gray-200 text-gray-400'
                    }`}>
                      <StepIcon state={state} />
                      {step.label}
                    </span>
                  )
                })}
                {moa.status === 'signed' && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 border border-green-400 text-green-800 font-semibold">
                    <CheckCircle2 size={12} /> Fully Signed
                  </span>
                )}
              </div>

              {/* Rejection info */}
              {moa.status === 'rejected' && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                  <span className="font-medium">Rejected at {moa.rejected_at_step}:</span> {moa.rejection_reason}
                </div>
              )}

              {/* Expand audit trail */}
              <button onClick={() => toggleExpand(moa.id)}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-2">
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {isExpanded ? 'Hide' : 'Show'} signing history
              </button>

              {isExpanded && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1.5">
                  {MOA_STEPS.map((step, i) => {
                    const signedAt = moa[`${step.key}_signed_at`]
                    const signedBy = moa[`${step.key}_name`]
                    const remarks  = moa[`${step.key}_remarks`]
                    return (
                      <div key={step.key} className="flex items-start gap-2 text-xs">
                        <StepIcon state={stepState(moa, i)} />
                        <div>
                          <span className="font-medium text-gray-700">{step.label}</span>
                          {signedAt ? (
                            <span className="text-gray-500 ml-2">
                              Signed by {signedBy || 'Unknown'} on {new Date(signedAt).toLocaleDateString()}
                              {remarks && <span className="italic ml-1">— "{remarks}"</span>}
                            </span>
                          ) : (
                            <span className="text-gray-400 ml-2">Pending</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Actions */}
              {!['signed', 'rejected'].includes(moa.status) && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button onClick={() => setAdvanceForm({ id: moa.id, remarks: '' })}
                    className="btn-primary text-sm py-1.5 flex items-center gap-1">
                    Sign & Advance <ChevronRight size={14} />
                  </button>
                  <button onClick={() => setRejectForm({ id: moa.id, reason: '' })}
                    className="btn-danger text-sm py-1.5 flex items-center gap-1">
                    Reject <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Advance Modal */}
      {advanceForm.id && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-1">Sign & Advance MOA</h3>
            <p className="text-sm text-gray-500 mb-4">This will mark the current step as signed and move to the next signatory.</p>
            <label className="label">Remarks (optional)</label>
            <textarea className="input h-20 resize-none" placeholder="Any notes for this signing step..."
              value={advanceForm.remarks}
              onChange={e => setAdvanceForm({ ...advanceForm, remarks: e.target.value })} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => advanceMut.mutate(advanceForm)} className="btn-primary"
                disabled={advanceMut.isPending}>
                {advanceMut.isPending ? 'Processing…' : 'Confirm Sign'}
              </button>
              <button className="btn-secondary" onClick={() => setAdvanceForm({ id: null, remarks: '' })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectForm.id && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-1">Reject MOA</h3>
            <p className="text-sm text-gray-500 mb-4">This action will halt the MOA workflow at the current step.</p>
            <label className="label">Reason for rejection *</label>
            <textarea className="input h-20 resize-none" placeholder="State the reason clearly..."
              value={rejectForm.reason}
              onChange={e => setRejectForm({ ...rejectForm, reason: e.target.value })} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => rejectMut.mutate(rejectForm)} className="btn-danger"
                disabled={!rejectForm.reason || rejectMut.isPending}>
                {rejectMut.isPending ? 'Processing…' : 'Confirm Reject'}
              </button>
              <button className="btn-secondary" onClick={() => setRejectForm({ id: null, reason: '' })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
