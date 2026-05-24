import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { placementService, studentService, companyService, applicationService } from '../../services'
import toast from 'react-hot-toast'
import { MapPin, Plus, ArrowRightLeft, Search, X, RotateCcw, Users, CheckCircle, XCircle, Eye, Building, Calendar, ArrowRight } from 'lucide-react'

const STATUS_STYLE = {
  active:        'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
  completed:     'bg-blue-50 text-blue-800 border border-blue-200/50',
  not_completed: 'bg-rose-50 text-rose-800 border border-rose-200/50',
  transferred:   'bg-amber-50 text-amber-800 border border-amber-200/50',
  withdrawn:     'bg-gray-50 text-gray-500 border border-gray-200/50',
}

const STATUS_LABELS = {
  active: 'Active',
  completed: 'Completed',
  not_completed: 'Not Completed',
  transferred: 'Transferred',
  withdrawn: 'Withdrawn',
}

const TRANSFER_STATUS_STYLE = {
  pending:  'bg-amber-50 text-amber-800 border border-amber-200/50',
  approved: 'bg-green-50 text-green-700 border border-green-200/50',
  rejected: 'bg-rose-50 text-rose-800 border border-rose-200/50',
}

const OJT_STATUSES = ['active', 'completed', 'not_completed', 'transferred', 'withdrawn']
const SEMESTERS    = ['1st', '2nd', 'Summer']
const CURRENT_YEAR = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

export default function Placements() {
  const qc = useQueryClient()
  const [tab, setTab]         = useState('placements')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)

  // Assign form
  const [assignForm, setAssignForm] = useState({
    student_id: '', company_id: '', application_id: '',
    semester: '1st', academic_year: CURRENT_YEAR,
    start_date: '', end_date: '',
  })

  // Transfer review modal
  const [transferModal, setTransferModal] = useState(null)
  const [rejectReason, setRejectReason]   = useState('')

  // ── Queries ──
  const { data: placements = [], isLoading } = useQuery({
    queryKey: ['placements', statusFilter],
    queryFn: () => placementService.list(statusFilter ? { ojt_status: statusFilter } : {}).then(r => r.data),
  })

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentService.list().then(r => r.data),
    enabled: showAssignModal,
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-accredited'],
    queryFn: () => companyService.list({ is_accredited: true }).then(r => r.data),
    enabled: showAssignModal,
  })

  const { data: approvedApps = [] } = useQuery({
    queryKey: ['approved-apps'],
    queryFn: () => applicationService.list({ status: 'approved' }).then(r => r.data),
    enabled: showAssignModal,
  })

  const { data: transfers = [] } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => placementService.listTransfers().then(r => r.data),
    enabled: tab === 'transfers',
  })

  // Client-side search for placements
  const filteredPlacements = useMemo(() => {
    if (!searchText.trim()) return placements
    const q = searchText.trim().toLowerCase()
    return placements.filter(p => {
      const name = (p.students?.users?.full_name || '').toLowerCase()
      const num = (p.students?.student_number || '').toLowerCase()
      const company = (p.companies?.name || '').toLowerCase()
      return name.includes(q) || num.includes(q) || company.includes(q)
    })
  }, [placements, searchText])

  // ── Mutations ──
  const assignMut = useMutation({
    mutationFn: (d) => placementService.assign(d),
    onSuccess: () => {
      toast.success('Student assigned!')
      qc.invalidateQueries(['placements'])
      qc.invalidateQueries(['approved-apps'])
      setShowAssignModal(false)
      setAssignForm({ student_id: '', company_id: '', application_id: '', semester: '1st', academic_year: CURRENT_YEAR, start_date: '', end_date: '' })
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to assign student'),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => placementService.updateStatus(id, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['placements']) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update status'),
  })

  const transferMut = useMutation({
    mutationFn: ({ id, data }) => placementService.reviewTransfer(id, data),
    onSuccess: (_, vars) => {
      toast.success(`Transfer ${vars.data.approved ? 'approved' : 'rejected'}`)
      qc.invalidateQueries(['transfers', 'placements'])
      setTransferModal(null)
      setRejectReason('')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to process transfer'),
  })

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
    <div className="w-full max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            OJT Placements
          </h1>
          <p className="text-gray-400 font-medium text-xs lg:text-sm mt-1.5">
            Assign students to accredited companies, manage active OJT placements, and process transfer requests.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-blue-800 text-white hover:bg-blue-950 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md hover:shadow-blue-800/10 active:scale-95 flex items-center gap-2"
          >
            <Plus size={16} /> Assign Student
          </button>
          <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-3 py-1.5 rounded-xl border border-blue-100">
              <Users size={13} />
              <span>{placements.length} Placements</span>
            </div>
            {pendingTransfers > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-100">
                <ArrowRightLeft size={13} />
                <span>{pendingTransfers} Pending</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white/40 p-1.5 rounded-2xl border border-gray-100 max-w-max flex-wrap">
        {[
          { key: 'placements', label: 'All Placements', icon: MapPin },
          { key: 'transfers',  label: 'Transfers', icon: ArrowRightLeft, badge: pendingTransfers },
        ].map(({ key, label, icon: Icon, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-[13px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              tab === key
                ? 'bg-blue-950 text-white shadow-md shadow-blue-950/15'
                : 'text-gray-500 hover:text-blue-950 hover:bg-gray-100/50'
            }`}>
            <Icon size={14} />
            {label}
            {badge > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-0.5 ${
                tab === key ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'
              }`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── ASSIGN STUDENT MODAL ── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-gray-150 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 px-6 py-5 flex items-center justify-between text-white border-b border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Plus className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">Assign Student to Company</h2>
                  <p className="text-blue-200 text-[10px] sm:text-xs font-medium mt-0.5">
                    Place a student into an accredited host training establishment
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); assignMut.mutate(assignForm) }}
              className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
                
                {/* Link from approved application */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                    From Approved Application
                    <span className="ml-1.5 normal-case text-gray-300 font-semibold tracking-normal">(optional — auto-fills student + company)</span>
                  </label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Student *</label>
                    <select required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
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
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Company *</label>
                    <select required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
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
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Semester *</label>
                    <select required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                      value={assignForm.semester} onChange={set('semester')}>
                      {SEMESTERS.map(s => <option key={s} value={s}>{s} Semester</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Academic Year *</label>
                    <input required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                      value={assignForm.academic_year} onChange={set('academic_year')} placeholder="e.g. 2024-2025" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Start Date</label>
                    <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                      value={assignForm.start_date} onChange={set('start_date')} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">End Date</label>
                    <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                      value={assignForm.end_date} onChange={set('end_date')} />
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
                <button type="button" onClick={() => setShowAssignModal(false)}
                  className="border border-gray-300 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 cursor-pointer transition-all duration-200">
                  Cancel
                </button>
                <button type="submit" disabled={assignMut.isPending}
                  className="bg-blue-900 text-white hover:bg-blue-950 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-blue-900/10 active:scale-95 disabled:opacity-50">
                  {assignMut.isPending ? 'Assigning…' : 'Assign Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PLACEMENTS TABLE ── */}
      {tab === 'placements' && (
        <>
          {/* Search + Status filter */}
          <div className="bg-white border border-gray-150 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
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
                  <button onClick={() => setSearchText('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="px-5 py-3 bg-gray-50/50 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-1">Status:</span>
              {['', ...OJT_STATUSES].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    statusFilter === s
                      ? 'bg-blue-950 text-white shadow-sm'
                      : 'text-gray-500 hover:text-blue-950 hover:bg-gray-100'
                  }`}>
                  {s === '' ? 'All' : STATUS_LABELS[s] || s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
            </div>
          ) : filteredPlacements.length === 0 ? (
            <div className="text-center text-gray-400 py-16 bg-white rounded-3xl border border-gray-150 shadow-md">
              <MapPin size={48} className="mx-auto mb-3 opacity-20 text-blue-950" />
              <p className="text-base font-bold text-gray-700">
                {searchText || statusFilter ? 'No placements match your criteria' : 'No placements found'}
              </p>
              <p className="text-sm mt-1 text-gray-400">
                {searchText || statusFilter
                  ? 'Try adjusting your search or changing the status filter.'
                  : 'Use the "Assign Student" tab to create a new placement.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-150 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1050px]">
                  <thead className="bg-blue-950 text-white text-[10px] uppercase font-black tracking-widest border-b border-blue-900">
                    <tr>
                      {['Student', 'Program', 'Company', 'Semester', 'Start', 'End', 'Status', 'Update Status'].map(h => (
                        <th key={h} className="px-5 py-4 text-left font-black tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPlacements.map(p => (
                      <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-blue-800 flex items-center justify-center font-black text-xs shadow-inner uppercase flex-shrink-0 border border-blue-200/50">
                              {p.students?.users?.full_name?.substring(0, 2) || 'ST'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-blue-950 text-sm tracking-tight truncate" title={p.students?.users?.full_name}>{p.students?.users?.full_name}</p>
                              <p className="text-[11px] text-gray-400 font-semibold mt-0.5 truncate">{p.students?.student_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="bg-blue-50/80 border border-blue-100 text-blue-800 px-2.5 py-1 rounded-lg text-[11px] font-extrabold">
                            {p.students?.program}
                          </span>
                          {p.students?.section && (
                            <span className="text-gray-400 text-[11px] font-semibold ml-1.5">· {p.students.section}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Building size={13} className="text-gray-300 flex-shrink-0" />
                            <span className="font-bold text-gray-700 text-xs truncate" title={p.companies?.name}>{p.companies?.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-gray-600 text-xs">{p.semester} / {p.academic_year}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-500 font-bold">{p.start_date || '—'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-500 font-bold">{p.end_date || '—'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-sm ${STATUS_STYLE[p.ojt_status]}`}>
                            {STATUS_LABELS[p.ojt_status] || p.ojt_status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            className="text-[11px] font-bold border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                            value={p.ojt_status}
                            onChange={e => statusMut.mutate({ id: p.id, status: e.target.value })}>
                            {OJT_STATUSES.map(s => (
                              <option key={s} value={s}>{STATUS_LABELS[s] || s.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  Showing {filteredPlacements.length} of {placements.length} placement{placements.length !== 1 ? 's' : ''}
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
        </>
      )}

      {/* ── TRANSFERS TABLE ── */}
      {tab === 'transfers' && (
        transfers.length === 0 ? (
          <div className="text-center text-gray-400 py-16 bg-white rounded-3xl border border-gray-150 shadow-md">
            <ArrowRightLeft size={48} className="mx-auto mb-3 opacity-20 text-blue-950" />
            <p className="text-base font-bold text-gray-700">No transfer requests found</p>
            <p className="text-sm mt-1 text-gray-400">Transfer requests from students will appear here for your review.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-150 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead className="bg-blue-950 text-white text-[10px] uppercase font-black tracking-widest border-b border-blue-900">
                  <tr>
                    {['Student', 'From Company', 'To Company', 'Reason', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-4 text-left font-black tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transfers.map(t => (
                    <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-blue-800 flex items-center justify-center font-black text-xs shadow-inner uppercase flex-shrink-0 border border-blue-200/50">
                            {t.placements?.students?.users?.full_name?.substring(0, 2) || 'ST'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-blue-950 text-sm tracking-tight truncate">
                              {t.placements?.students?.users?.full_name || '—'}
                            </p>
                            <p className="text-[11px] text-gray-400 font-semibold mt-0.5">{t.placements?.students?.student_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-gray-600 text-xs">{t.from_company?.name || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <ArrowRight size={12} className="text-amber-500" />
                          <span className="font-bold text-gray-800 text-xs">{t.to_company?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-xs text-gray-500 font-semibold truncate" title={t.reason}>{t.reason}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-sm ${TRANSFER_STATUS_STYLE[t.status] || 'bg-gray-50 text-gray-500'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {t.status === 'pending' && (
                          <button onClick={() => { setTransferModal(t); setRejectReason('') }}
                            className="text-[10px] font-black uppercase tracking-wider border border-blue-300 text-blue-800 px-3 py-1.5 rounded-xl hover:bg-blue-50 cursor-pointer flex items-center gap-1 transition-all">
                            <Eye size={10} /> Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3.5 border-t border-gray-100 text-xs text-gray-400 font-bold uppercase tracking-wider bg-gray-50/50">
              {transfers.length} transfer request{transfers.length !== 1 ? 's' : ''}
            </div>
          </div>
        )
      )}

      {/* Transfer review modal */}
      {transferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 px-6 py-5 flex items-center justify-between text-white border-b border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">Review Transfer Request</h2>
                  <p className="text-blue-200 text-[10px] sm:text-xs font-medium mt-0.5">
                    {transferModal.placements?.students?.users?.full_name}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setTransferModal(null)}
                className="p-2 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition-all cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">From Company</p>
                  <p className="text-sm font-extrabold text-gray-800">{transferModal.from_company?.name || '—'}</p>
                </div>
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-400 mb-1">To Company</p>
                  <p className="text-sm font-extrabold text-blue-900">{transferModal.to_company?.name || '—'}</p>
                </div>
              </div>

              <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-500 mb-1">Reason</p>
                <p className="text-xs font-semibold text-gray-700 leading-relaxed">{transferModal.reason}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                  Rejection Reason <span className="normal-case text-gray-300 font-semibold tracking-normal">(only if rejecting)</span>
                </label>
                <textarea rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none bg-white"
                  value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Required only if rejecting…" />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
              <button onClick={() => setTransferModal(null)}
                className="border border-gray-300 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 cursor-pointer transition-all duration-200">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectReason.trim()) { toast.error('Enter rejection reason'); return }
                  transferMut.mutate({ id: transferModal.id, data: { approved: false, rejection_reason: rejectReason } })
                }}
                disabled={transferMut.isPending}
                className="bg-rose-600 text-white hover:bg-rose-700 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5">
                <XCircle size={13} /> Reject
              </button>
              <button
                onClick={() => transferMut.mutate({ id: transferModal.id, data: { approved: true } })}
                disabled={transferMut.isPending}
                className="bg-green-600 text-white hover:bg-green-700 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-green-600/10 active:scale-95 disabled:opacity-50 flex items-center gap-1.5">
                <CheckCircle size={13} /> Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
