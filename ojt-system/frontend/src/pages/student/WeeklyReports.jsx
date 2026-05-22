import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { monitoringService, placementService } from '../../services'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { Plus, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'

export default function StudentWeeklyReports() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [form, setForm] = useState({
    week_number: 1,
    week_start: '',
    week_end: '',
    accomplishments: '',
    challenges: '',
    learnings: '',
    file_url: '',
  })

  const { data: placements = [] } = useQuery({
    queryKey: ['my-placements'],
    queryFn: () => placementService.list().then(r => r.data),
  })
  const activePlacement = placements.find(p => p.ojt_status === 'active')

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['weekly-reports', activePlacement?.id],
    queryFn: () => monitoringService.getWeeklyReports(activePlacement.id).then(r => r.data),
    enabled: !!activePlacement?.id,
  })

  const submitMut = useMutation({
    mutationFn: (data) => monitoringService.submitWeeklyReport(data),
    onSuccess: () => {
      toast.success('Weekly report submitted!')
      qc.invalidateQueries(['weekly-reports'])
      setShowForm(false)
      setForm({ week_number: 1, week_start: '', week_end: '', accomplishments: '', challenges: '', learnings: '', file_url: '' })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to submit'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!activePlacement) return toast.error('No active placement')
    submitMut.mutate({ ...form, placement_id: activePlacement.id })
  }

  const nextWeek = reports.length + 1
  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  if (!activePlacement) return (
    <div className="card text-center text-gray-400 py-16 max-w-lg">
      <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
      <p className="font-medium">No active placement</p>
      <p className="text-sm mt-1">Weekly reports will be available once you have an active placement.</p>
    </div>
  )

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Weekly Accomplishment Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">{reports.length} report{reports.length !== 1 ? 's' : ''} submitted</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setForm(f => ({ ...f, week_number: nextWeek })) }}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Submit Week {nextWeek}
        </button>
      </div>

      {/* Submit Form */}
      {showForm && (
        <div className="card border-blue-200 bg-blue-50">
          <h2 className="font-semibold text-gray-800 mb-4">Week {form.week_number} Report</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Week #</label>
                <input type="number" className="input" value={form.week_number} min={1}
                  onChange={e => setForm({ ...form, week_number: parseInt(e.target.value) })} required />
              </div>
              <div>
                <label className="label">Week Start</label>
                <input type="date" className="input" value={form.week_start}
                  onChange={e => setForm({ ...form, week_start: e.target.value })} required />
              </div>
              <div>
                <label className="label">Week End</label>
                <input type="date" className="input" value={form.week_end}
                  onChange={e => setForm({ ...form, week_end: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="label">Accomplishments <span className="text-red-500">*</span></label>
              <textarea className="input h-28 resize-none" value={form.accomplishments}
                onChange={e => setForm({ ...form, accomplishments: e.target.value })}
                placeholder="Describe what you accomplished this week..." required />
            </div>
            <div>
              <label className="label">Challenges</label>
              <textarea className="input h-20 resize-none" value={form.challenges}
                onChange={e => setForm({ ...form, challenges: e.target.value })}
                placeholder="Any difficulties or challenges you encountered..." />
            </div>
            <div>
              <label className="label">Learnings</label>
              <textarea className="input h-20 resize-none" value={form.learnings}
                onChange={e => setForm({ ...form, learnings: e.target.value })}
                placeholder="What did you learn this week?" />
            </div>
            <div>
              <label className="label">Supporting File URL (optional)</label>
              <input type="url" className="input" value={form.file_url}
                onChange={e => setForm({ ...form, file_url: e.target.value })}
                placeholder="https://drive.google.com/..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={submitMut.isPending}>
                {submitMut.isPending ? 'Submitting…' : 'Submit Report'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 && (
        <div className="card text-center text-gray-400 py-10">
          <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
          <p>No reports submitted yet. Click "Submit Week 1" to start.</p>
        </div>
      )}

      <div className="space-y-3">
        {reports.map(r => (
          <div key={r.id} className={`card transition-all ${r.status === 'returned' ? 'border-yellow-200' : r.status === 'acknowledged' ? 'border-green-200' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-800">Week {r.week_number}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.week_start} — {r.week_end}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} />
                <button onClick={() => toggle(r.id)} className="text-gray-400 hover:text-gray-600">
                  {expanded[r.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {expanded[r.id] && (
              <div className="mt-4 space-y-3 text-sm">
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
                  <div className={`rounded-lg p-3 mt-2 ${r.status === 'returned' ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                    <p className={`font-medium text-xs mb-1 ${r.status === 'returned' ? 'text-yellow-700' : 'text-green-700'}`}>
                      Coordinator Remarks
                    </p>
                    <p className={r.status === 'returned' ? 'text-yellow-800' : 'text-green-800'}>
                      {r.coordinator_remarks}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
