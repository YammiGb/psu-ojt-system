import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dtrService, placementService } from '../../services'
import toast from 'react-hot-toast'
import { Clock, Plus, Trash2, CheckCircle2, X } from 'lucide-react'

export default function StudentDTR() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    time_in: '08:00',
    time_out: '17:00',
    dtr_type: 'manual',
    remarks: '',
  })

  // Get active placement
  const { data: placements = [] } = useQuery({
    queryKey: ['my-placements'],
    queryFn: () => placementService.list().then(r => r.data),
  })
  const activePlacement = placements.find(p => p.ojt_status === 'active')

  // Get DTR logs + summary
  const { data: dtrData, isLoading } = useQuery({
    queryKey: ['dtr-logs', activePlacement?.id],
    queryFn: () => dtrService.getLogs(activePlacement.id).then(r => r.data),
    enabled: !!activePlacement?.id,
  })

  const logs    = dtrData?.logs    || []
  const summary = dtrData?.summary || { total_rendered: 0, required: 0, remaining: 0, percentage: 0 }

  const logMut = useMutation({
    mutationFn: (data) => dtrService.log(data),
    onSuccess: () => {
      toast.success('DTR logged!')
      qc.invalidateQueries(['dtr-logs'])
      setShowForm(false)
      setForm({ log_date: new Date().toISOString().split('T')[0], time_in: '08:00', time_out: '17:00', dtr_type: 'manual', remarks: '' })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to log DTR'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => dtrService.delete(id),
    onSuccess: () => {
      toast.success('Entry deleted')
      qc.invalidateQueries(['dtr-logs'])
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Cannot delete'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!activePlacement) return toast.error('No active placement found')
    logMut.mutate({ ...form, placement_id: activePlacement.id })
  }

  if (!activePlacement) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Clock size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">No active placement</p>
        <p className="text-sm mt-1">You need an approved placement before logging DTR.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-blue-900 tracking-tight">
            OJT Daily Time Record
          </h1>
          <p className="text-gray-400 font-medium text-base mt-1.5">
            Log your training hours, biometric checks, and track your ongoing OJT rendering progress.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 self-start sm:self-center text-base py-3 px-6">
          <Plus size={18} /> Log Hours
        </button>
      </div>

      {/* Hours summary */}
      <div className="card shadow-lg border border-gray-100/40">
        <div className="flex justify-between text-base mb-3 font-semibold text-gray-700">
          <span>Hours Progress</span>
          <span className="font-extrabold text-blue-900">{summary.total_rendered}h / {summary.required}h</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all ${
              summary.percentage >= 100 
                ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                : 'bg-gradient-to-r from-blue-800 to-blue-600'
            }`}
            style={{ width: `${summary.percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-400 mt-2 font-medium">
          <span>{summary.percentage}% complete</span>
          <span className="text-amber-600">{summary.remaining}h remaining</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-100 text-center">
          <div className="p-2.5 rounded-2xl bg-gray-50/50 border border-gray-100/30">
            <p className="text-2xl font-black text-blue-800">{summary.total_rendered}h</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Rendered</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-gray-50/50 border border-gray-100/30">
            <p className="text-2xl font-black text-gray-700">{summary.required}h</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Required</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-gray-50/50 border border-gray-100/30">
            <p className="text-2xl font-black text-amber-600">{summary.remaining}h</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">Remaining</p>
          </div>
        </div>
      </div>

      {/* Log Hours Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fadeIn">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 px-6 py-5 flex items-center justify-between text-white border-b border-blue-900">
              <div>
                <h2 className="text-lg font-black tracking-tight">New DTR Entry</h2>
                <p className="text-blue-200 text-xs font-medium mt-0.5">Log daily training details, hours rendered, and tasks performed</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label text-xs font-bold text-gray-700 mb-1">Date</label>
                    <input type="date" className="input" value={form.log_date}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm({ ...form, log_date: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label text-xs font-bold text-gray-700 mb-1">Time In</label>
                    <input type="time" className="input" value={form.time_in}
                      onChange={e => setForm({ ...form, time_in: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label text-xs font-bold text-gray-700 mb-1">Time Out</label>
                    <input type="time" className="input" value={form.time_out}
                      onChange={e => setForm({ ...form, time_out: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-bold text-gray-700 mb-1">Type</label>
                    <select className="input bg-white" value={form.dtr_type}
                      onChange={e => setForm({ ...form, dtr_type: e.target.value })}>
                      <option value="manual">Manual</option>
                      <option value="biometric">Biometric</option>
                      <option value="school_dtr">School DTR</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs font-bold text-gray-700 mb-1">Remarks (optional)</label>
                    <input type="text" className="input" placeholder="e.g. Work from home"
                      value={form.remarks}
                      onChange={e => setForm({ ...form, remarks: e.target.value })} />
                  </div>
                </div>
              </div>
              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
                <button type="button" className="border border-gray-350 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-all duration-200" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="bg-blue-900 text-white hover:bg-blue-950 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-blue-900/10 active:scale-95 disabled:opacity-50" disabled={logMut.isPending}>
                  {logMut.isPending ? 'Saving…' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DTR table */}
      {isLoading && <p className="text-gray-400 text-base">Loading logs…</p>}

      {!isLoading && logs.length === 0 && (
        <div className="card text-center text-gray-400 py-12 shadow-md">
          <Clock size={40} className="mx-auto mb-3 opacity-30 text-blue-900" />
          <p className="text-base font-semibold text-gray-700">No DTR entries yet.</p>
          <p className="text-sm mt-1 text-gray-400">Click "Log Hours" to start recording your time.</p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="card overflow-hidden p-0 shadow-xl border border-gray-100/40">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
            <h2 className="text-lg font-extrabold text-blue-950">DTR History</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-extrabold uppercase tracking-wider">{logs.length} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-gray-50/80 text-blue-950/70 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  {['Date', 'Time In', 'Time Out', 'Hours', 'Type', 'Status', 'Remarks', ''].map(h => (
                    <th key={h} className="px-6 py-4 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">{log.log_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{log.time_in?.slice(0,5) || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{log.time_out?.slice(0,5) || '—'}</td>
                    <td className="px-6 py-4 font-extrabold text-blue-900 whitespace-nowrap">{log.hours_rendered}h</td>
                    <td className="px-6 py-4 capitalize whitespace-nowrap font-medium">{log.dtr_type.replace('_', ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.verified
                        ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200/50 text-xs font-extrabold uppercase tracking-wider"><CheckCircle2 size={13} /> Verified</span>
                        : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200/50 text-xs font-extrabold uppercase tracking-wider">Pending</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-gray-400 max-w-xs truncate font-medium">{log.remarks || '—'}</td>
                    <td className="px-6 py-4">
                      {!log.verified && (
                        <button onClick={() => deleteMut.mutate(log.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50"
                          title="Delete entry">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
