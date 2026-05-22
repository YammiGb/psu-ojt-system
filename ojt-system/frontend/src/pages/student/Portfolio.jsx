import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { evaluationService, placementService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { FolderOpen, Upload } from 'lucide-react'

export default function StudentPortfolio() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ portfolio_url: '', narrative_report_url: '' })

  const { data: placements } = useQuery({
    queryKey: ['my-placements'],
    queryFn: () => placementService.list().then(r => r.data),
  })

  const activePlacement = placements?.find(p => ['active', 'completed'].includes(p.ojt_status))

  const { data: grade, isLoading } = useQuery({
    queryKey: ['my-grade', activePlacement?.id],
    queryFn: () => evaluationService.getGrade(activePlacement.id).then(r => r.data),
    enabled: !!activePlacement?.id,
  })

  const submitMut = useMutation({
    mutationFn: (data) => evaluationService.submitPortfolio(data),
    onSuccess: () => {
      toast.success('Portfolio submitted!')
      qc.invalidateQueries(['my-grade'])
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to submit'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!activePlacement) return toast.error('No active placement')
    submitMut.mutate({ placement_id: activePlacement.id, ...form })
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800">Portfolio & Narrative Report</h1>

      {/* Status Cards */}
      {grade && (
        <div className="grid grid-cols-2 gap-4">
          <div className={`card text-center py-6 ${grade.portfolio_submitted ? 'border-green-200 bg-green-50' : ''}`}>
            <FolderOpen size={28} className={`mx-auto mb-2 ${grade.portfolio_submitted ? 'text-green-500' : 'text-gray-300'}`} />
            <p className="font-medium text-gray-700">Portfolio</p>
            <p className={`text-sm mt-1 ${grade.portfolio_submitted ? 'text-green-600' : 'text-gray-400'}`}>
              {grade.portfolio_submitted ? '✓ Submitted' : 'Not yet submitted'}
            </p>
            {grade.portfolio_url && (
              <a href={grade.portfolio_url} target="_blank" rel="noreferrer"
                className="text-xs text-primary-600 hover:underline mt-1 inline-block">View file</a>
            )}
          </div>
          <div className={`card text-center py-6 ${grade.narrative_report_submitted ? 'border-green-200 bg-green-50' : ''}`}>
            <FolderOpen size={28} className={`mx-auto mb-2 ${grade.narrative_report_submitted ? 'text-green-500' : 'text-gray-300'}`} />
            <p className="font-medium text-gray-700">Narrative Report</p>
            <p className={`text-sm mt-1 ${grade.narrative_report_submitted ? 'text-green-600' : 'text-gray-400'}`}>
              {grade.narrative_report_submitted ? '✓ Submitted' : 'Not yet submitted'}
            </p>
            {grade.narrative_report_url && (
              <a href={grade.narrative_report_url} target="_blank" rel="noreferrer"
                className="text-xs text-primary-600 hover:underline mt-1 inline-block">View file</a>
            )}
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Upload size={18} /> Submit Documents</h2>
        <p className="text-sm text-gray-400 mb-4">Upload your files to cloud storage first, then paste the URLs below.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Portfolio URL</label>
            <input type="url" className="input" placeholder="https://drive.google.com/..." value={form.portfolio_url}
              onChange={e => setForm({...form, portfolio_url: e.target.value})} />
          </div>
          <div>
            <label className="label">Narrative Report URL</label>
            <input type="url" className="input" placeholder="https://drive.google.com/..." value={form.narrative_report_url}
              onChange={e => setForm({...form, narrative_report_url: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary" disabled={submitMut.isPending || (!form.portfolio_url && !form.narrative_report_url)}>
            {submitMut.isPending ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  )
}
