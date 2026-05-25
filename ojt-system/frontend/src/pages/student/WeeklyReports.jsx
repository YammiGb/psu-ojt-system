import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { monitoringService, placementService } from '../../services'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { Plus, BookOpen, ChevronDown, ChevronUp, X, Paperclip, FileCheck } from 'lucide-react'

export default function StudentWeeklyReports() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [form, setForm] = useState({
    week_number: 1,
    week_start: '',
    week_end: '',
    accomplishments: '',
    challenges: '',
    learnings: '',
    file_url: '',
    file_name: '',
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
      setForm({ week_number: 1, week_start: '', week_end: '', accomplishments: '', challenges: '', learnings: '', file_url: '', file_name: '' })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to submit'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!activePlacement) return toast.error('No active placement')
    submitMut.mutate({ ...form, placement_id: activePlacement.id })
  }

  const uploadFile = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const res = await monitoringService.uploadWeeklyReportFile(file)
      setForm(f => ({ ...f, file_url: res.data.file_url, file_name: res.data.file_name }))
      toast.success('File uploaded!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'File upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    uploadFile(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0])
    }
  }

  const nextWeek = reports.length + 1
  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  if (!activePlacement) return (
    <div className="card text-center text-gray-400 py-16 max-w-lg mx-auto border border-gray-150 rounded-3xl mt-8">
      <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
      <p className="font-medium">No active placement</p>
      <p className="text-sm mt-1">Weekly reports will be available once you have an active placement.</p>
    </div>
  )

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            Weekly Accomplishment Reports
          </h1>
          <p className="text-gray-400 font-medium text-xs lg:text-sm mt-1.5">
            Document your training logs, tasks completed, challenges faced, and core academic takeaways.
          </p>
        </div>
        <button onClick={() => { setForm({ ...form, week_number: nextWeek }); setShowForm(true) }} className="btn-primary flex items-center gap-2 self-start sm:self-center text-xs sm:text-sm py-2.5 px-5 font-extrabold cursor-pointer">
          <Plus size={16} /> Submit Weekly Report
        </button>
      </div>

      <div className="space-y-6">
        
        {/* Reports History */}
        <div className="space-y-4">
          <div className="card p-6 shadow-md border border-gray-150 flex justify-between items-center bg-gray-50/20 rounded-3xl">
            <h2 className="text-base sm:text-lg font-black text-blue-950">Submitted Reports History</h2>
            <span className="text-xs px-3 py-1 bg-blue-50 text-blue-900 rounded-full font-extrabold uppercase tracking-widest">{reports.length} report(s)</span>
          </div>

          {reports.length === 0 ? (
            <div className="card text-center text-gray-400 py-16 shadow-md border border-dashed border-gray-200 rounded-3xl bg-white">
              <BookOpen size={44} className="mx-auto mb-3 opacity-25 text-blue-950" />
              <p className="text-base font-bold text-gray-700">No accomplishment reports yet</p>
              <p className="text-sm mt-1 text-gray-400">Click "Submit Weekly Report" on the header above to begin recording.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(r => (
                <div key={r.id} className={`card p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-150 rounded-3xl bg-white border-l-4 ${
                  r.status === 'returned' 
                    ? 'border-l-yellow-450 border-yellow-100 bg-yellow-50/10' 
                    : r.status === 'acknowledged' 
                      ? 'border-l-green-450 border-green-100 bg-green-50/10' 
                      : 'border-l-blue-450'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-black text-blue-950">Week {r.week_number}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{r.week_start} — {r.week_end}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={r.status} />
                      <button onClick={() => toggle(r.id)} className="text-gray-400 hover:text-blue-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100">
                        {expanded[r.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {expanded[r.id] && (
                    <div className="mt-5 pt-4 border-t border-gray-100 space-y-4 text-sm leading-relaxed">
                      <div>
                        <p className="font-extrabold text-blue-950 uppercase tracking-widest text-xs mb-1.5">Accomplishments</p>
                        <p className="text-gray-700 whitespace-pre-line bg-gray-50/50 rounded-xl p-4 border border-gray-100/50">{r.accomplishments}</p>
                      </div>
                      {r.challenges && (
                        <div>
                          <p className="font-extrabold text-blue-950 uppercase tracking-widest text-xs mb-1.5">Challenges</p>
                          <p className="text-gray-700 bg-gray-50/50 rounded-xl p-4 border border-gray-100/50">{r.challenges}</p>
                        </div>
                      )}
                      {r.learnings && (
                        <div>
                          <p className="font-extrabold text-blue-950 uppercase tracking-widest text-xs mb-1.5">Learnings</p>
                          <p className="text-gray-700 bg-gray-50/50 rounded-xl p-4 border border-gray-100/50">{r.learnings}</p>
                        </div>
                      )}
                      {r.file_url && (
                        <div className="pt-2">
                          <a href={r.file_url} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-750 hover:text-blue-900 font-extrabold text-xs hover:underline bg-blue-50/60 hover:bg-blue-100 border border-blue-150 px-3 py-1.5 rounded-xl transition-all">
                            <Paperclip size={12} />
                            {r.file_name || 'View Supporting Document'} →
                          </a>
                        </div>
                      )}
                      {r.coordinator_remarks && (
                        <div className={`rounded-2xl p-4 mt-3 border ${r.status === 'returned' ? 'bg-yellow-50/50 border-yellow-200 text-yellow-800' : 'bg-green-50/50 border-green-200 text-green-800'}`}>
                          <p className="font-extrabold text-xs uppercase tracking-widest mb-1">Coordinator Remarks</p>
                          <p className="text-sm font-semibold">{r.coordinator_remarks}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Report Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fadeIn">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 px-6 py-5 flex items-center justify-between text-white border-b border-blue-900">
              <div>
                <h2 className="text-lg font-black tracking-tight">Submit Week {form.week_number} Report</h2>
                <p className="text-blue-200 text-xs font-medium mt-0.5">Fill out your weekly accomplishments, learnings, and challenges</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition-all cursor-pointer animate-pulse"
              >
                <X size={18} />
              </button>
            </div>
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label text-xs font-bold text-gray-700 mb-1">Week #</label>
                    <input type="number" className="input" value={form.week_number} min={1}
                      onChange={e => setForm({ ...form, week_number: parseInt(e.target.value) || '' })} required />
                  </div>
                  <div className="col-span-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label text-xs font-bold text-gray-700 mb-1">Start</label>
                        <input type="date" className="input" value={form.week_start}
                          onChange={e => setForm({ ...form, week_start: e.target.value })} required />
                      </div>
                      <div>
                        <label className="label text-xs font-bold text-gray-700 mb-1">End</label>
                        <input type="date" className="input" value={form.week_end}
                          onChange={e => setForm({ ...form, week_end: e.target.value })} required />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label text-xs font-bold text-gray-700 mb-1">Accomplishments *</label>
                  <textarea className="input h-24 resize-none" value={form.accomplishments}
                    onChange={e => setForm({ ...form, accomplishments: e.target.value })}
                    placeholder="What did you achieve or complete this week?" required />
                </div>
                <div>
                  <label className="label text-xs font-bold text-gray-700 mb-1">Challenges Encountered</label>
                  <textarea className="input h-16 resize-none" value={form.challenges}
                    onChange={e => setForm({ ...form, challenges: e.target.value })}
                    placeholder="List any blockers or struggles..." />
                </div>
                <div>
                  <label className="label text-xs font-bold text-gray-700 mb-1">Core Learnings</label>
                  <textarea className="input h-16 resize-none" value={form.learnings}
                    onChange={e => setForm({ ...form, learnings: e.target.value })}
                    placeholder="What new skills or knowledge did you acquire?" />
                </div>
                <div>
                  <label className="label text-xs font-bold text-gray-700 mb-1">Supporting Document (optional)</label>
                  <label 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`flex items-center gap-3 w-full border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 ${
                      form.file_name
                        ? 'border-green-400 bg-green-50/30 text-green-700'
                        : dragActive
                          ? 'border-blue-500 bg-blue-50/30 text-blue-750'
                          : uploading
                            ? 'border-blue-300 bg-blue-50/20 text-blue-500'
                            : 'border-gray-200 bg-gray-50/30 hover:border-blue-400 hover:bg-blue-50/20 text-gray-500'
                    }`}
                  >
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.zip"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        <span className="text-xs font-bold">Uploading…</span>
                      </>
                    ) : form.file_name ? (
                      <>
                        <FileCheck size={16} className="flex-shrink-0 text-green-600" />
                        <span className="text-xs font-bold truncate">{form.file_name}</span>
                        <span className="ml-auto text-[10px] font-black text-green-600 uppercase tracking-wider">Uploaded</span>
                      </>
                    ) : (
                      <>
                        <Paperclip size={16} className="flex-shrink-0" />
                        <span className="text-xs font-semibold">Attach or drag &amp; drop a file</span>
                        <span className="ml-auto text-[10px] text-gray-400 font-medium">PDF, Word, Excel, Image — max 10 MB</span>
                      </>
                    )}
                  </label>
                  {form.file_name && (
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, file_url: '', file_name: '' }))}
                      className="mt-1.5 text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Remove file
                    </button>
                  )}
                </div>
              </div>
              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
                <button type="button" className="border border-gray-350 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-all duration-200" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="bg-blue-900 text-white hover:bg-blue-950 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-blue-900/10 active:scale-95 disabled:opacity-50" disabled={submitMut.isPending}>
                  {submitMut.isPending ? 'Submitting…' : 'Submit Weekly Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
