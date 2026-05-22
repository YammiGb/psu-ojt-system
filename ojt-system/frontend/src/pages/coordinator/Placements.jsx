import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { placementService, studentService, companyService, applicationService } from '../../services'
import toast from 'react-hot-toast'

const STATUS_STYLE = {
  active:        'bg-green-100 text-green-700',
  completed:     'bg-blue-100 text-blue-700',
  not_completed: 'bg-red-100 text-red-700',
  transferred:   'bg-yellow-100 text-yellow-700',
  withdrawn:     'bg-gray-100 text-gray-500',
}

const OJT_STATUSES = ['active', 'completed', 'not_completed', 'transferred', 'withdrawn']
const SEMESTERS    = ['1st', '2nd', 'Summer']
const CURRENT_YEAR = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

export default function Placements() {
  const qc = useQueryClient()
  const [tab, setTab]         = useState('placements')  // placements | assign | transfers
  const [statusFilter, setStatusFilter] = useState('')

  // Assign form
  const [assignForm, setAssignForm] = useState({
    student_id: '', company_id: '', application_id: '',
    semester: '1st', academic_year: CURRENT_YEAR,
    start_date: '', end_date: '',
  })

  // Transfer review modal
  const [transferModal, setTransferModal] = useState(null)
  const [rejectReason, setRejectReason]   = useState('')

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: placements = [], isLoading } = useQuery({
    queryKey: ['placements', statusFilter],
    queryFn: () => placementService.list(statusFilter ? { ojt_status: statusFilter } : {}).then(r => r.data),
  })

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentService.list().then(r => r.data),
    enabled: tab === 'assign',
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-accredited'],
    queryFn: () => companyService.list({ is_accredited: true }).then(r => r.data),
    enabled: tab === 'assign',
  })

  const { data: approvedApps = [] } = useQuery({
    queryKey: ['approved-apps'],
    queryFn: () => applicationService.list({ status: 'approved' }).then(r => r.data),
    enabled: tab === 'assign',
  })

  const { data: transfers = [] } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => placementService.listTransfers().then(r => r.data),
    enabled: tab === 'transfers',
  })

  // ── Mutations ──────────────────────────────────────────────────────────────
  const assignMut = useMutation({
    mutationFn: (d) => placementService.assign(d),
    onSuccess: () => {
      toast.success('Student assigned!')
      qc.invalidateQueries(['placements'])
      qc.invalidateQueries(['approved-apps'])
      setTab('placements')
      setAssignForm({ student_id: '', company_id: '', application_id: '', semester: '1st', academic_year: CURRENT_YEAR, start_date: '', end_date: '' })
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => placementService.updateStatus(id, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['placements']) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const transferMut = useMutation({
    mutationFn: ({ id, data }) => placementService.reviewTransfer(id, data),
    onSuccess: (_, vars) => {
      toast.success(`Transfer ${vars.data.approved ? 'approved' : 'rejected'}`)
      qc.invalidateQueries(['transfers', 'placements'])
      setTransferModal(null)
      setRejectReason('')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  // When application is selected, auto-fill student + company
  const onAppSelect = (appId) => {
    const app = approvedApps.find(a => a.id === appId)
    if (app) {
      setAssignForm(f => ({
        ...f,
        application_id: appId,
        student_id:     app.student_id,
        company_id:     app.company_id || '',
        semester:       app.semester,
        academic_year:  app.academic_year,
      }))
    } else {
      setAssignForm(f => ({ ...f, application_id: '' }))
    }
  }

  const set = (k) => (e) => setAssignForm(f => ({ ...f, [k]: e.target.value }))

  const pendingTransfers = transfers.filter(t => t.status === 'pending').length

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header + tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Placements</h1>
        <div className="flex gap-2">
          {[
            { key: 'placements', label: 'All Placements' },
            { key: 'assign',     label: '+ Assign Student' },
            { key: 'transfers',  label: `Transfers${pendingTransfers > 0 ? ` (${pendingTransfers})` : ''}` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                tab === key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ASSIGN FORM ─────────────────────────────────────────────────── */}
      {tab === 'assign' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Assign Student to Company</h2>
          <form onSubmit={(e) => { e.preventDefault(); assignMut.mutate(assignForm) }} className="space-y-4">

            {/* Link from approved application */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Approved Application
                <span className="ml-1 text-xs text-gray-400">(optional — auto-fills student + company)</span>
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={assignForm.application_id}
                onChange={e => onAppSelect(e.target.value)}>
                <option value="">-- Select application --</option>
                {approvedApps.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.students?.users?.full_name} — {a.semester} {a.academic_year}
                    {a.companies?.name ? ` @ ${a.companies.name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={assignForm.student_id} onChange={set('student_id')}>
                  <option value="">-- Select student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.users?.full_name} ({s.student_number})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={assignForm.company_id} onChange={set('company_id')}>
                  <option value="">-- Select company --</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (slots: {c.slot_capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={assignForm.semester} onChange={set('semester')}>
                  {SEMESTERS.map(s => <option key={s} value={s}>{s} Semester</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={assignForm.academic_year} onChange={set('academic_year')} placeholder="e.g. 2024-2025" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={assignForm.start_date} onChange={set('start_date')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={assignForm.end_date} onChange={set('end_date')} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={assignMut.isPending}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                {assignMut.isPending ? 'Assigning…' : 'Assign Student'}
              </button>
              <button type="button" onClick={() => setTab('placements')}
                className="border border-gray-300 px-5 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── PLACEMENTS TABLE ────────────────────────────────────────────── */}
      {tab === 'placements' && (
        <>
          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {['', ...OJT_STATUSES].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}>
                {s === '' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center text-gray-400 py-10">Loading…</div>
          ) : placements.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
              No placements found.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    {['Student', 'Program', 'Company', 'Semester', 'Start', 'End', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {placements.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{p.students?.users?.full_name}</p>
                        <p className="text-xs text-gray-400">{p.students?.student_number}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.students?.program}
                        {p.students?.section && <span className="text-gray-400"> · {p.students.section}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.companies?.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.semester} / {p.academic_year}</td>
                      <td className="px-4 py-3 text-gray-500">{p.start_date || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{p.end_date || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[p.ojt_status]}`}>
                          {p.ojt_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                          value={p.ojt_status}
                          onChange={e => statusMut.mutate({ id: p.id, status: e.target.value })}>
                          {OJT_STATUSES.map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
                {placements.length} placement{placements.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TRANSFERS TABLE ──────────────────────────────────────────────── */}
      {tab === 'transfers' && (
        transfers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
            No transfer requests found.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  {['Student', 'From', 'To', 'Reason', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transfers.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {t.placements?.students?.users?.full_name || '—'}
                      <p className="text-xs text-gray-400">{t.placements?.students?.student_number}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.from_company?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{t.to_company?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{t.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        t.status === 'approved' ? 'bg-green-100 text-green-700' :
                        t.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.status === 'pending' && (
                        <button onClick={() => { setTransferModal(t); setRejectReason('') }}
                          className="text-xs border border-gray-300 px-3 py-1 rounded-lg hover:bg-gray-50 text-gray-700">
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Transfer review modal */}
      {transferModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-1">Review Transfer Request</h3>
            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p>Student: <strong>{transferModal.placements?.students?.users?.full_name}</strong></p>
              <p>From: <strong>{transferModal.from_company?.name}</strong></p>
              <p>To: <strong>{transferModal.to_company?.name}</strong></p>
              <p>Reason: <em>{transferModal.reason}</em></p>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection reason <span className="text-xs text-gray-400">(only if rejecting)</span>
            </label>
            <textarea rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Required only if rejecting…" />

            <div className="flex gap-2">
              <button
                onClick={() => transferMut.mutate({ id: transferModal.id, data: { approved: true } })}
                disabled={transferMut.isPending}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
                Approve
              </button>
              <button
                onClick={() => {
                  if (!rejectReason.trim()) { toast.error('Enter rejection reason'); return }
                  transferMut.mutate({ id: transferModal.id, data: { approved: false, rejection_reason: rejectReason } })
                }}
                disabled={transferMut.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium">
                Reject
              </button>
              <button onClick={() => setTransferModal(null)}
                className="border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 ml-auto">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
