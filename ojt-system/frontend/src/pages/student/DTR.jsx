import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dtrService, placementService } from '../../services'
import toast from 'react-hot-toast'
import { Clock, Plus, Trash2, CheckCircle2 } from 'lucide-react'

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
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Daily Time Record</h1>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Log Hours
        </button>
      </div>

      {/* Hours summary */}
      <div className="card">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Hours Progress</span>
          <span className="font-semibold text-gray-800">{summary.total_rendered}h / {summary.required}h</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${summary.percentage >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
            style={{ width: `${summary.percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>{summary.percentage}% complete</span>
          <span>{summary.remaining}h remaining</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100 text-center">
          <div>
            <p className="text-lg font-bold text-indigo-600">{summary.total_rendered}h</p>
            <p className="text-xs text-gray-400">Rendered</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-700">{summary.required}h</p>
            <p className="text-xs text-gray-400">Required</p>
          </div>
          <div>
            <p className="text-lg font-bold text-orange-500">{summary.remaining}h</p>
            <p className="text-xs text-gray-400">Remaining</p>
          </div>
        </div>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="card border-indigo-200 bg-indigo-50">
          <h2 className="font-semibold text-gray-800 mb-4">New DTR Entry</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={form.log_date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm({ ...form, log_date: e.target.value })} required />
              </div>
              <div>
                <label className="label">Time In</label>
                <input type="time" className="input" value={form.time_in}
                  onChange={e => setForm({ ...form, time_in: e.target.value })} required />
              </div>
              <div>
                <label className="label">Time Out</label>
                <input type="time" className="input" value={form.time_out}
                  onChange={e => setForm({ ...form, time_out: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.dtr_type}
                  onChange={e => setForm({ ...form, dtr_type: e.target.value })}>
                  <option value="manual">Manual</option>
                  <option value="biometric">Biometric</option>
                  <option value="school_dtr">School DTR</option>
                </select>
              </div>
              <div>
                <label className="label">Remarks (optional)</label>
                <input type="text" className="input" placeholder="e.g. Work from home"
                  value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={logMut.isPending}>
                {logMut.isPending ? 'Saving…' : 'Save Entry'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DTR table */}
      {isLoading && <p className="text-gray-400 text-sm">Loading logs…</p>}

      {!isLoading && logs.length === 0 && (
        <div className="card text-center text-gray-400 py-10">
          <Clock size={32} className="mx-auto mb-2 opacity-30" />
          <p>No DTR entries yet. Click "Log Hours" to start.</p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">DTR History</h2>
            <span className="text-xs text-gray-400">{logs.length} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                <tr>
                  {['Date', 'Time In', 'Time Out', 'Hours', 'Type', 'Status', 'Remarks', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{log.log_date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{log.time_in?.slice(0,5) || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{log.time_out?.slice(0,5) || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-indigo-600 whitespace-nowrap">{log.hours_rendered}h</td>
                    <td className="px-4 py-3 capitalize whitespace-nowrap">{log.dtr_type.replace('_', ' ')}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.verified
                        ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 size={12} /> Verified</span>
                        : <span className="text-xs text-yellow-600 font-medium">Pending</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{log.remarks || '—'}</td>
                    <td className="px-4 py-3">
                      {!log.verified && (
                        <button onClick={() => deleteMut.mutate(log.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          title="Delete entry">
                          <Trash2 size={14} />
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
