import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { placementService, companyService } from '../../services'
import toast from 'react-hot-toast'
import { Building, Calendar, Mail, Phone, User, BookOpen, Clock, Briefcase, RefreshCw, AlertCircle, X } from 'lucide-react'

const STATUS_STYLE = {
  active:        'bg-emerald-500 text-white border-none shadow-lg shadow-emerald-500/20 font-black',
  completed:     'bg-blue-50 text-blue-800 border border-blue-200',
  not_completed: 'bg-red-50 text-red-800 border border-red-200',
  transferred:   'bg-yellow-50 text-yellow-800 border border-yellow-200',
  withdrawn:     'bg-gray-50 text-gray-800 border border-gray-200',
}

export default function StudentPlacement() {
  const qc = useQueryClient()
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [transferForm, setTransferForm] = useState({ to_company_id: '', reason: '' })

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: placements = [], isLoading } = useQuery({
    queryKey: ['my-placements'],
    queryFn: () => placementService.list().then(r => r.data),
  })

  const activePlacement = placements.find(p => p.ojt_status === 'active') || placements[0] || null

  const { data: companies = [] } = useQuery({
    queryKey: ['accredited-companies'],
    queryFn: () => companyService.list({ is_accredited: true }).then(r => r.data),
    enabled: showTransferForm,
  })

  // ── Transfer mutation ──────────────────────────────────────────────────────
  const transferMut = useMutation({
    mutationFn: ({ placementId, data }) => placementService.requestTransfer(placementId, data),
    onSuccess: () => {
      toast.success('Transfer request submitted!')
      qc.invalidateQueries(['my-placements'])
      setShowTransferForm(false)
      setTransferForm({ to_company_id: '', reason: '' })
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to submit transfer request'),
  })

  const handleTransferSubmit = (e) => {
    e.preventDefault()
    if (!activePlacement) return
    if (!transferForm.to_company_id) { toast.error('Select a company'); return }
    if (!transferForm.reason.trim()) { toast.error('Provide a reason'); return }
    transferMut.mutate({ placementId: activePlacement.id, data: transferForm })
  }

  // ── Loading / Empty ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[300px] w-full bg-white rounded-[2rem] border border-gray-100 shadow-xl">
        <RefreshCw className="w-10 h-10 text-blue-900 animate-spin mb-4" />
        <div className="text-gray-400 font-semibold text-base">Loading placement summary…</div>
      </div>
    )
  }

  if (!activePlacement) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-black text-blue-900 tracking-tight">
          My Placement
        </h1>
        <div className="bg-white border border-gray-250 rounded-[2rem] p-16 text-center shadow-xl">
          <div className="w-20 h-20 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-6 border border-gray-150">
            <Building className="w-10 h-10" />
          </div>
          <p className="text-gray-700 text-lg font-black">No active OJT placement found</p>
          <p className="text-gray-400 text-sm mt-2 font-medium">You have not been assigned to a company yet. Contact your coordinator to allocate your placement.</p>
        </div>
      </div>
    )
  }

  const company = activePlacement.companies || {}
  const canTransfer = activePlacement.ojt_status === 'active'

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-blue-900 tracking-tight">
            My Placement
          </h1>
          <p className="text-gray-400 font-medium text-base mt-1.5">
            Review details of your assigned company, work hours schedules, coordinators contact nodes, or request transfers.
          </p>
        </div>
      </div>

      {/* ── Placement Card ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden">
        {/* Header strip */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-800">
          <div>
            <p className="text-white font-black text-xl lg:text-2xl tracking-tight">{company.name || '—'}</p>
            <p className="text-blue-200 text-xs lg:text-sm mt-1 font-medium">{company.address || 'Company Address'}</p>
          </div>
          <div className="flex items-center gap-3.5 self-start sm:self-center">
            <span className={`text-xs px-3.5 py-1.5 rounded-full font-extrabold uppercase tracking-widest shadow-md ${STATUS_STYLE[activePlacement.ojt_status]}`}>
              {activePlacement.ojt_status.replace('_', ' ')}
            </span>
            {canTransfer && !showTransferForm && (
              <button
                onClick={() => setShowTransferForm(true)}
                className="text-xs bg-amber-500 hover:bg-amber-600 text-blue-950 px-4 py-2 rounded-full font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md hover:shadow-amber-500/20 active:scale-95 flex items-center gap-1.5"
              >
                <RefreshCw size={12} className="animate-spin-slow text-blue-950" />
                Request Transfer
              </button>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
          <DetailCard icon={BookOpen} label="Semester" value={`${activePlacement.semester} Semester`} iconColor="text-blue-600 bg-blue-50" />
          <DetailCard icon={Calendar} label="Academic Year" value={activePlacement.academic_year} iconColor="text-amber-600 bg-amber-50" />
          <DetailCard icon={Clock} label="Start Date" value={activePlacement.start_date || '—'} iconColor="text-green-600 bg-green-50" />
          <DetailCard icon={Clock} label="End Date" value={activePlacement.end_date || '—'} iconColor="text-red-650 bg-red-50" />
          <DetailCard icon={User} label="Contact Person" value={company.contact_person || '—'} iconColor="text-indigo-600 bg-indigo-50" />
          <DetailCard icon={Mail} label="Contact Email" value={company.contact_email || '—'} iconColor="text-purple-600 bg-purple-50 font-semibold" />
          <DetailCard icon={Phone} label="Contact Phone" value={company.contact_phone || '—'} iconColor="text-teal-650 bg-teal-50" />
        </div>
      </div>

      {/* ── Transfer Request Modal Form ─────────────────────────────────────────────────── */}
      {canTransfer && showTransferForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fadeIn">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 px-6 py-5 flex items-center justify-between text-white border-b border-blue-900">
              <div>
                <h2 className="text-lg font-black tracking-tight">OJT Transfer Request</h2>
                <p className="text-blue-200 text-xs font-medium mt-0.5">Specify your target company and provide your justification reason.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowTransferForm(false); setTransferForm({ to_company_id: '', reason: '' }) }}
                className="p-2 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            {/* Modal Body */}
            <form onSubmit={handleTransferSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Target Accredited Company <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white font-semibold text-gray-700"
                    value={transferForm.to_company_id}
                    onChange={e => setTransferForm(f => ({ ...f, to_company_id: e.target.value }))}>
                    <option value="">-- Select target company --</option>
                    {companies
                      .filter(c => c.id !== activePlacement.company_id)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.slot_capacity ? ` (${c.slot_capacity} slots)` : ''}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Reason / Justification <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none font-semibold text-gray-700"
                    placeholder="Explain in detail why you are requesting a transfer…"
                    value={transferForm.reason}
                    onChange={e => setTransferForm(f => ({ ...f, reason: e.target.value }))}
                  />
                </div>
              </div>
              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowTransferForm(false); setTransferForm({ to_company_id: '', reason: '' }) }}
                  className="border border-gray-300 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 cursor-pointer transition-all duration-200">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferMut.isPending}
                  className="bg-blue-900 text-white hover:bg-blue-950 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50">
                  {transferMut.isPending ? 'Submitting…' : 'Submit Transfer Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Detail Card component ───────────────────────────────────────────────────
function DetailCard({ icon: Icon, label, value, iconColor }) {
  return (
    <div className="flex items-center gap-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md hover:border-gray-200/80 transition-all duration-300">
      <div className={`p-3 rounded-xl ${iconColor} flex-shrink-0 flex items-center justify-center shadow-sm`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold">{label}</p>
        <p className="text-gray-950 font-black text-sm lg:text-base mt-1 truncate">{value}</p>
      </div>
    </div>
  )
}
