import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { evaluationService, placementService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { FolderOpen, Upload, Plus, X, Paperclip, FileCheck } from 'lucide-react'
import { ensureAbsoluteUrl } from '../../utils/url'


export default function StudentPortfolio() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    portfolio_url: '',
    portfolio_file_name: '',
    narrative_report_url: '',
    narrative_report_file_name: ''
  })

  const [portfolioUploading, setPortfolioUploading] = useState(false)
  const [portfolioDragActive, setPortfolioDragActive] = useState(false)
  const [narrativeUploading, setNarrativeUploading] = useState(false)
  const [narrativeDragActive, setNarrativeDragActive] = useState(false)

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

  const handleClose = () => {
    setShowForm(false)
    setForm({
      portfolio_url: '',
      portfolio_file_name: '',
      narrative_report_url: '',
      narrative_report_file_name: ''
    })
    setPortfolioUploading(false)
    setPortfolioDragActive(false)
    setNarrativeUploading(false)
    setNarrativeDragActive(false)
  }

  const submitMut = useMutation({
    mutationFn: (data) => evaluationService.submitPortfolio(data),
    onSuccess: () => {
      toast.success('Portfolio submitted!')
      qc.invalidateQueries(['my-grade'])
      handleClose()
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to submit'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!activePlacement) return toast.error('No active placement')
    submitMut.mutate({ placement_id: activePlacement.id, ...form })
  }

  const uploadPortfolioFile = async (file) => {
    if (!file) return
    setPortfolioUploading(true)
    try {
      const res = await evaluationService.uploadPortfolioFile(file)
      setForm(f => ({ ...f, portfolio_url: res.data.file_url, portfolio_file_name: res.data.file_name }))
      toast.success('Portfolio file uploaded!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Portfolio upload failed')
    } finally {
      setPortfolioUploading(false)
    }
  }

  const uploadNarrativeFile = async (file) => {
    if (!file) return
    setNarrativeUploading(true)
    try {
      const res = await evaluationService.uploadPortfolioFile(file)
      setForm(f => ({ ...f, narrative_report_url: res.data.file_url, narrative_report_file_name: res.data.file_name }))
      toast.success('Narrative report file uploaded!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Narrative report upload failed')
    } finally {
      setNarrativeUploading(false)
    }
  }

  const handlePortfolioFileChange = (e) => {
    const file = e.target.files?.[0]
    uploadPortfolioFile(file)
  }

  const handlePortfolioDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setPortfolioDragActive(true)
    } else if (e.type === "dragleave") {
      setPortfolioDragActive(false)
    }
  }

  const handlePortfolioDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setPortfolioDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadPortfolioFile(e.dataTransfer.files[0])
    }
  }

  const handleNarrativeFileChange = (e) => {
    const file = e.target.files?.[0]
    uploadNarrativeFile(file)
  }

  const handleNarrativeDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setNarrativeDragActive(true)
    } else if (e.type === "dragleave") {
      setNarrativeDragActive(false)
    }
  }

  const handleNarrativeDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setNarrativeDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadNarrativeFile(e.dataTransfer.files[0])
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-blue-900 tracking-tight">
            Portfolio &amp; Narrative Report
          </h1>
          <p className="text-gray-400 font-medium text-base mt-1.5">
            Submit your final training deliverables, documentation links, and comprehensive narrative reports for grading.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 self-start sm:self-center text-xs sm:text-sm py-2.5 px-5 font-extrabold cursor-pointer">
          <Plus size={16} /> Submit Documents
        </button>
      </div>

      {/* Submission Status Cards */}
      <div className="card p-6 bg-gray-50/30 shadow-md border border-gray-150">
        <h2 className="text-lg font-black text-blue-950 mb-1">Submission Status</h2>
        <p className="text-sm text-gray-400 font-semibold mb-4">Official tracking status of your final course requirements</p>

        {grade ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Portfolio Card */}
            <div className={`card text-center p-6 transition-all duration-300 border-2 ${
              grade.portfolio_submitted
                ? 'border-green-200 bg-green-50/40 shadow-green-50/10'
                : 'border-yellow-200 bg-yellow-50/40'
            }`}>
              <FolderOpen size={36} className={`mx-auto mb-3 transition-colors duration-300 ${
                grade.portfolio_submitted ? 'text-green-600' : 'text-yellow-600'
              }`} />
              <p className="font-extrabold text-blue-950 text-base">OJT Portfolio</p>
              <p className={`text-xs font-black uppercase tracking-wider mt-2 px-2.5 py-1 rounded-full inline-block ${
                grade.portfolio_submitted ? 'bg-green-100/70 text-green-800' : 'bg-yellow-100/70 text-yellow-800'
              }`}>
                {grade.portfolio_submitted ? '✓ Submitted' : 'Pending'}
              </p>
              {grade.portfolio_url && (
                <div className="mt-4">
                  <a href={ensureAbsoluteUrl(grade.portfolio_url)} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-750 font-extrabold hover:text-blue-900 bg-white hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-all">
                    <Paperclip size={12} />
                    <span className="truncate max-w-[150px]">{grade.portfolio_file_name || 'View File'}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Narrative Report Card */}
            <div className={`card text-center p-6 transition-all duration-300 border-2 ${
              grade.narrative_report_submitted
                ? 'border-green-200 bg-green-50/40 shadow-green-50/10'
                : 'border-yellow-200 bg-yellow-50/40'
            }`}>
              <FolderOpen size={36} className={`mx-auto mb-3 transition-colors duration-300 ${
                grade.narrative_report_submitted ? 'text-green-600' : 'text-yellow-600'
              }`} />
              <p className="font-extrabold text-blue-950 text-base">Narrative Report</p>
              <p className={`text-xs font-black uppercase tracking-wider mt-2 px-2.5 py-1 rounded-full inline-block ${
                grade.narrative_report_submitted ? 'bg-green-100/70 text-green-800' : 'bg-yellow-100/70 text-yellow-800'
              }`}>
                {grade.narrative_report_submitted ? '✓ Submitted' : 'Pending'}
              </p>
              {grade.narrative_report_url && (
                <div className="mt-4">
                  <a href={ensureAbsoluteUrl(grade.narrative_report_url)} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-750 font-extrabold hover:text-blue-900 bg-white hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-all">
                    <Paperclip size={12} />
                    <span className="truncate max-w-[150px]">{grade.narrative_report_file_name || 'View File'}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-150 text-gray-400">
            No active placement summary available.
          </div>
        )}
      </div>

      {/* ── Submit Documents Modal ──────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 px-6 py-5 flex items-center justify-between text-white border-b border-blue-900">
              <div>
                <h2 className="text-lg font-black tracking-tight">Submit Final Deliverables</h2>
                <p className="text-blue-200 text-xs font-medium mt-0.5">Attach or drag &amp; drop files for final grading.</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition-all cursor-pointer">
                <X size={18} />
              </button>
            </div>
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
                
                {/* OJT Portfolio File Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">OJT Portfolio *</label>
                  <label 
                    onDragEnter={handlePortfolioDrag}
                    onDragOver={handlePortfolioDrag}
                    onDragLeave={handlePortfolioDrag}
                    onDrop={handlePortfolioDrop}
                    className={`flex items-center gap-3 w-full border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition-all duration-200 ${
                      form.portfolio_file_name
                        ? 'border-green-400 bg-green-50/30 text-green-700'
                        : portfolioDragActive
                          ? 'border-blue-500 bg-blue-50/30 text-blue-750'
                          : portfolioUploading
                            ? 'border-blue-300 bg-blue-50/20 text-blue-500'
                            : 'border-gray-200 bg-gray-50/30 hover:border-blue-400 hover:bg-blue-50/20 text-gray-500'
                    }`}
                  >
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.zip"
                      onChange={handlePortfolioFileChange}
                      disabled={portfolioUploading}
                    />
                    {portfolioUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        <span className="text-xs font-bold">Uploading…</span>
                      </>
                    ) : form.portfolio_file_name ? (
                      <>
                        <FileCheck size={16} className="flex-shrink-0 text-green-600" />
                        <span className="text-xs font-bold truncate max-w-[280px]">{form.portfolio_file_name}</span>
                        <span className="ml-auto text-[10px] font-black text-green-600 uppercase tracking-wider">Uploaded</span>
                      </>
                    ) : (
                      <>
                        <Paperclip size={16} className="flex-shrink-0" />
                        <span className="text-xs font-semibold">Attach or drag &amp; drop a file</span>
                        <span className="ml-auto text-[10px] text-gray-400 font-medium">PDF, ZIP, Word, Excel — max 15 MB</span>
                      </>
                    )}
                  </label>
                  {form.portfolio_file_name && (
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, portfolio_url: '', portfolio_file_name: '' }))}
                      className="mt-1.5 text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Remove file
                    </button>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5 font-medium">Include compilation of weekly logs, certificates, and daily metrics.</p>
                </div>

                {/* Narrative Report File Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Narrative Report *</label>
                  <label 
                    onDragEnter={handleNarrativeDrag}
                    onDragOver={handleNarrativeDrag}
                    onDragLeave={handleNarrativeDrag}
                    onDrop={handleNarrativeDrop}
                    className={`flex items-center gap-3 w-full border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition-all duration-200 ${
                      form.narrative_report_file_name
                        ? 'border-green-400 bg-green-50/30 text-green-700'
                        : narrativeDragActive
                          ? 'border-blue-500 bg-blue-50/30 text-blue-750'
                          : narrativeUploading
                            ? 'border-blue-300 bg-blue-50/20 text-blue-500'
                            : 'border-gray-200 bg-gray-50/30 hover:border-blue-400 hover:bg-blue-50/20 text-gray-500'
                    }`}
                  >
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.zip"
                      onChange={handleNarrativeFileChange}
                      disabled={narrativeUploading}
                    />
                    {narrativeUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        <span className="text-xs font-bold">Uploading…</span>
                      </>
                    ) : form.narrative_report_file_name ? (
                      <>
                        <FileCheck size={16} className="flex-shrink-0 text-green-600" />
                        <span className="text-xs font-bold truncate max-w-[280px]">{form.narrative_report_file_name}</span>
                        <span className="ml-auto text-[10px] font-black text-green-600 uppercase tracking-wider">Uploaded</span>
                      </>
                    ) : (
                      <>
                        <Paperclip size={16} className="flex-shrink-0" />
                        <span className="text-xs font-semibold">Attach or drag &amp; drop a file</span>
                        <span className="ml-auto text-[10px] text-gray-400 font-medium">PDF, ZIP, Word, Excel — max 15 MB</span>
                      </>
                    )}
                  </label>
                  {form.narrative_report_file_name && (
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, narrative_report_url: '', narrative_report_file_name: '' }))}
                      className="mt-1.5 text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Remove file
                    </button>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5 font-medium">Include detailed review of your experience, technologies learned, and recommendations.</p>
                </div>

              </div>
              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="border border-gray-300 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 cursor-pointer transition-all duration-200">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitMut.isPending || (!form.portfolio_url && !form.narrative_report_url) || portfolioUploading || narrativeUploading}
                  className="bg-blue-900 text-white hover:bg-blue-950 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50">
                  {submitMut.isPending ? 'Submitting…' : 'Submit Documents'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
