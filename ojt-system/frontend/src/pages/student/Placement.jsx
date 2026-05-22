import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { placementService, companyService } from '../../services'
import toast from 'react-hot-toast'

const STATUS_STYLE = {
  active:        'bg-green-100 text-green-700',
  completed:     'bg-blue-100 text-blue-700',
  not_completed: 'bg-red-100 text-red-700',
  transferred:   'bg-yellow-100 text-yellow-700',
  withdrawn:     'bg-gray-100 text-gray-500',
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
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-gray-400">Loading placement…</div>
      </div>
    )
  }

  if (!activePlacement) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Placement</h1>
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">🏢</div>
          <p className="text-gray-500 text-sm">You have not been assigned to a company yet.</p>
          <p className="text-gray-400 text-xs mt-1">Contact your coordinator if you believe this is an error.</p>
        </div>
      </div>
    )
  }

  const company = activePlacement.companies || {}
  const canTransfer = activePlacement.ojt_status === 'active'

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Placement</h1>

      {/* ── Placement Card ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header strip */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg">{company.name || '—'}</p>
            <p className="text-indigo-200 text-sm">{company.address || ''}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_STYLE[activePlacement.ojt_status]}`}>
            {activePlacement.ojt_status.replace('_', ' ')}
          </span>
        </div>

        {/* Details grid */}
        <div className="px-6 py-5 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <Detail label="Semester" value={`${activePlacement.semester} Semester`} />
          <Detail label="Academic Year" value={activePlacement.academic_year} />
          <Detail label="Start Date"    value={activePlacement.start_date || '—'} />
          <Detail label="End Date"      value={activePlacement.end_date   || '—'} />
          <Detail label="Contact Person" value={company.contact_person  || '—'} />
          <Detail label="Contact Email"  value={company.contact_email   || '—'} />
          <Detail label="Contact Phone"  value={company.contact_phone   || '—'} />
        </div>
      </div>

      {/* ── Placement History (if multiple) ─────────────────────────────────── */}
      {placements.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700 text-sm">Placement History</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {['Company', 'Semester', 'Start', 'End', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {placements.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{p.companies?.name || '—'}</td>
                  <td className="px-4 py-2 text-gray-500">{p.semester} / {p.academic_year}</td>
                  <td className="px-4 py-2 text-gray-500">{p.start_date || '—'}</td>
                  <td className="px-4 py-2 text-gray-500">{p.end_date   || '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[p.ojt_status]}`}>
                      {p.ojt_status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Transfer Request ─────────────────────────────────────────────────── */}
      {canTransfer && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-700 text-sm">Request Transfer</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ask to move to a different company</p>
            </div>
            {!showTransferForm && (
              <button
                onClick={() => setShowTransferForm(true)}
                className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">
                Request Transfer
              </button>
            )}
          </div>

          {showTransferForm && (
            <form onSubmit={handleTransferSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transfer To <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={transferForm.to_company_id}
                  onChange={e => setTransferForm(f => ({ ...f, to_company_id: e.target.value }))}>
                  <option value="">-- Select company --</option>
                  {companies
                    .filter(c => c.id !== activePlacement.company_id)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.slot_capacity ? ` (${c.slot_capacity} slots)` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Explain why you are requesting a transfer…"
                  value={transferForm.reason}
                  onChange={e => setTransferForm(f => ({ ...f, reason: e.target.value }))}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={transferMut.isPending}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {transferMut.isPending ? 'Submitting…' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowTransferForm(false); setTransferForm({ to_company_id: '', reason: '' }) }}
                  className="border border-gray-300 px-5 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

// ── Small helper ──────────────────────────────────────────────────────────────
function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}
