import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { moaService, companyService } from '../../services'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { 
  Shield, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Building2,
  Briefcase,
  FileSignature,
  Calendar,
  ArrowUpRight,
  Search,
  Paperclip,
  FileCheck
} from 'lucide-react'
import { ensureAbsoluteUrl } from '../../utils/url'


const MOA_STEPS = [
  { key: 'campus_coordinator', label: 'Campus Coordinator' },
  { key: 'ced',                label: 'CED' },
  { key: 'lingayen',           label: 'Lingayen Campus' },
  { key: 'legal',              label: 'Legal Office' },
  { key: 'ojt_director',       label: 'OJT Director' },
  { key: 'vp',                 label: 'VP' },
  { key: 'bordsec',            label: 'BORDSEC' },
  { key: 'president',          label: 'President' },
]

function stepState(moa, idx) {
  if (moa.status === 'rejected' && moa.current_step === idx) return 'rejected'
  if (idx < moa.current_step) return 'done'
  if (idx === moa.current_step && moa.status !== 'signed' && moa.status !== 'rejected') return 'active'
  return 'pending'
}

function StepIcon({ state }) {
  if (state === 'done')     return <CheckCircle2 size={16} className="text-green-600" />
  if (state === 'active')   return <Clock size={16} className="text-blue-600" />
  if (state === 'rejected') return <XCircle size={16} className="text-red-500" />
  return <div className="w-4 h-4 rounded-full border border-gray-300" />
}

export default function MOATracker() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ company_id: '', document_url: '', document_name: '', semester: '', academic_year: '' })
  const [rejectForm, setRejectForm] = useState({ id: null, reason: '' })
  const [advanceForm, setAdvanceForm] = useState({ id: null, remarks: '' })
  const [expanded, setExpanded] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleCloseNew = () => {
    setShowNew(false)
    setNewForm({ company_id: '', document_url: '', document_name: '', semester: '', academic_year: '' })
  }

  const uploadFile = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const res = await moaService.uploadMOAFile(file)
      setNewForm(f => ({ ...f, document_url: res.data.file_url, document_name: res.data.file_name }))
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

  const { data: moas = [], isLoading } = useQuery({
    queryKey: ['moas'],
    queryFn: () => moaService.list().then(r => r.data),
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.list().then(r => r.data),
  })

  const initMut = useMutation({
    mutationFn: (f) => moaService.initiate(
      f.company_id,
      f.document_url || null,
      f.document_name || null,
      f.semester || null,
      f.academic_year || null
    ),
    onSuccess: () => {
      toast.success('MOA initiated!')
      qc.invalidateQueries(['moas'])
      setShowNew(false)
      setNewForm({ company_id: '', document_url: '', document_name: '', semester: '', academic_year: '' })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to initiate'),
  })

  const advanceMut = useMutation({
    mutationFn: ({ id, remarks }) => moaService.advance(id, remarks),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'MOA advanced!')
      qc.invalidateQueries(['moas'])
      setAdvanceForm({ id: null, remarks: '' })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to advance'),
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => moaService.reject(id, reason),
    onSuccess: () => {
      toast.success('MOA rejected')
      qc.invalidateQueries(['moas'])
      setRejectForm({ id: null, reason: '' })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to reject'),
  })

  // Client-side quick search filter
  const filteredMoas = useMemo(() => {
    if (!moas) return []
    let result = moas
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(m => {
        const companyName = (m.companies?.name || '').toLowerCase()
        const sem = (m.semester || '').toLowerCase()
        const ay = (m.academic_year || '').toLowerCase()
        const status = (m.status || '').toLowerCase()
        return companyName.includes(q) || sem.includes(q) || ay.includes(q) || status.includes(q)
      })
    }
    return result
  }, [moas, searchQuery])

  if (isLoading) return <LoadingSpinner />

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const statusCounts = moas.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            Memorandum of Agreement Tracker
          </h1>
          <p className="text-gray-400 font-medium text-xs lg:text-sm mt-1.5">
            Monitor, approve, and track structural MOA signing stages between partner organizations and university signatories.
          </p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary text-sm py-3 px-6 self-start sm:self-center">
          + Initiate MOA Request
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total MOAs', value: moas.length, icon: FileText, color: 'blue' },
          { label: 'In Review',  value: Object.entries(statusCounts).filter(([k]) => !['signed','rejected'].includes(k)).reduce((s,[,v])=>s+v,0), icon: Clock, color: 'amber' },
          { label: 'Fully Signed', value: statusCounts['signed'] || 0, icon: CheckCircle2, color: 'green' },
          { label: 'Rejected',  value: statusCounts['rejected'] || 0, icon: XCircle, color: 'red' },
        ].map(({ label, value, icon: Icon, color }) => {
          const colorClasses = {
            blue: 'bg-gradient-to-br from-blue-50/50 to-white border-blue-100/80 text-blue-900 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/5',
            green: 'bg-gradient-to-br from-green-50/50 to-white border-green-100/80 text-green-955 hover:border-green-300 hover:shadow-lg hover:shadow-green-900/5',
            amber: 'bg-gradient-to-br from-amber-50/50 to-white border-amber-100/80 text-amber-955 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-900/5',
            red: 'bg-gradient-to-br from-red-50/50 to-white border-red-100/80 text-red-955 hover:border-red-300 hover:shadow-lg hover:shadow-red-900/5',
          }
          const iconColors = {
            blue: 'bg-blue-50 text-slate-400',
            green: 'bg-green-50 text-slate-400',
            amber: 'bg-amber-50 text-slate-400',
            red: 'bg-red-50 text-slate-400',
          }
          return (
            <div key={label} className={`rounded-2xl border p-4.5 transition-all duration-300 flex items-center gap-3.5 bg-white shadow-sm ${colorClasses[color]}`}>
              <div className={`p-2.5 rounded-xl shadow-inner flex items-center justify-center ${iconColors[color]}`}>
                <Icon size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p>
                <p className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5 tracking-tight">{value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* New MOA Form Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fadeIn">
          <div className="bg-white border border-gray-150 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 px-6 py-5 flex items-center justify-between text-white border-b border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <FileSignature className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">Initiate New MOA Request</h2>
                  <p className="text-blue-200 text-[10px] sm:text-xs font-medium mt-0.5">Start the 8-step institutional signing chain</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleCloseNew}
                className="p-2 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="label">Partner Company *</label>
                  <select className="input bg-white" value={newForm.company_id}
                    onChange={e => setNewForm({ ...newForm, company_id: e.target.value })}>
                    <option value="">-- Select Company --</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Semester</label>
                  <input className="input" placeholder="e.g. 2024-1" value={newForm.semester}
                    onChange={e => setNewForm({ ...newForm, semester: e.target.value })} />
                </div>
                <div>
                  <label className="label">Academic Year</label>
                  <input className="input" placeholder="e.g. 2024-2025" value={newForm.academic_year}
                    onChange={e => setNewForm({ ...newForm, academic_year: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label text-xs font-bold text-gray-700 mb-1">MOA Document (optional)</label>
                  <label 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`flex items-center gap-3 w-full border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 ${
                      newForm.document_name
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
                    ) : newForm.document_name ? (
                      <>
                        <FileCheck size={16} className="flex-shrink-0 text-green-600" />
                        <span className="text-xs font-bold truncate">{newForm.document_name}</span>
                        <span className="ml-auto text-[10px] font-black text-green-600 uppercase tracking-wider">Uploaded</span>
                      </>
                    ) : (
                      <>
                        <Paperclip size={16} className="flex-shrink-0" />
                        <span className="text-xs font-semibold">Attach or drag &amp; drop a file</span>
                        <span className="ml-auto text-[10px] text-gray-400 font-medium">PDF, Word, Excel, Image — max 15 MB</span>
                      </>
                    )}
                  </label>
                  {newForm.document_name && (
                    <button
                      type="button"
                      onClick={() => setNewForm(f => ({ ...f, document_url: '', document_name: '' }))}
                      className="mt-1.5 text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider cursor-pointer font-extrabold"
                    >
                      Remove file
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
              <button className="border border-gray-300 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-150 cursor-pointer transition-all duration-200" onClick={handleCloseNew}>
                Cancel
              </button>
              <button onClick={() => initMut.mutate(newForm)} className="bg-blue-900 text-white hover:bg-blue-950 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-blue-900/10 active:scale-95 disabled:opacity-50"
                disabled={!newForm.company_id || initMut.isPending}>
                {initMut.isPending ? 'Initiating…' : 'Initiate MOA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Input Box */}
      <div className="bg-white border border-gray-150 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              className="w-full border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white placeholder:text-gray-500 placeholder:font-semibold"
              placeholder="Search MOAs by company partner, semester, or status..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOA List */}
      {moas.length === 0 && (
        <div className="card text-center text-gray-400 py-16 shadow-md border border-gray-150 bg-white">
          <FileText size={48} className="mx-auto mb-3 opacity-20 text-blue-950" />
          <p className="text-base font-bold text-gray-700">No MOA requests yet.</p>
          <p className="text-sm mt-1">Click "Initiate MOA Request" to start the signing chain for a company partner.</p>
        </div>
      )}

      {moas.length > 0 && filteredMoas.length === 0 && (
        <div className="text-center text-gray-400 py-16 bg-white rounded-3xl border border-gray-150 shadow-md">
          <Search size={48} className="mx-auto mb-3 opacity-20 text-blue-950" />
          <p className="text-base font-bold text-gray-700">No matching search results</p>
          <p className="text-sm mt-1">Try adjusting your search terms or clearing the input query.</p>
        </div>
      )}

      <div className="space-y-4">
        {filteredMoas.map(moa => {
          const progressPct = moa.status === 'signed'   ? 100
                            : moa.status === 'rejected' ? 0
                            : Math.round((moa.current_step / 8) * 100)
          const isExpanded = expanded[moa.id]

          return (
            <div 
              key={moa.id} 
              className={`bg-white rounded-3xl border border-gray-100 shadow-md p-6 transition-all duration-300 hover:shadow-xl hover:border-gray-200/80 relative overflow-hidden group ${
                moa.status === 'rejected' 
                  ? 'border-l-4 border-l-red-500' 
                  : moa.status !== 'signed'
                    ? 'border-l-4 border-l-blue-900'
                    : ''
              }`}
            >
              
              {/* Main Info Row */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 pb-4 border-b border-gray-100/60">
                <div className="flex items-start gap-4">
                  <div>
                    <h3 className="text-lg font-black text-blue-950 tracking-tight group-hover:text-blue-900 transition-colors">
                      {moa.companies?.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-1 font-semibold">
                      {moa.semester && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          Sem: {moa.semester}
                        </span>
                      )}
                      {moa.academic_year && (
                        <span className="flex items-center gap-1">
                          Academic Year: {moa.academic_year}
                        </span>
                      )}
                      <span>
                        Initiated: {new Date(moa.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start md:self-center flex-wrap">
                  <StatusBadge status={moa.status} />
                  {moa.document_url && (
                    <a href={ensureAbsoluteUrl(moa.document_url)} target="_blank" rel="noreferrer"
                      className="text-xs bg-indigo-50 border border-indigo-200/50 hover:bg-indigo-100/80 text-indigo-700 font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer">
                      <FileText size={12} /> {moa.document_name || 'View Document'} <ArrowUpRight size={12} />
                    </a>
                  )}
                </div>
              </div>

              {/* Progress Tracker (Signed & Active Only) */}
              {moa.status !== 'rejected' && (
                <div className="mb-4 bg-gray-50/30 rounded-2xl border border-gray-100/40 p-4">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500 mb-1.5">
                    <span className="uppercase tracking-widest text-[9px]">Signing Approval Progress</span>
                    <span className="text-blue-900">{progressPct}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        moa.status === 'signed' 
                          ? 'bg-gradient-to-r from-blue-600 to-sky-400' 
                          : 'bg-gradient-to-r from-blue-900 via-blue-800 to-amber-500'
                      }`}
                      style={{ width: `${progressPct}%` }} 
                    />
                  </div>
                </div>
              )}

              {/* Quick Stepper Status Line */}
              <div className="flex items-center gap-2 mb-4 text-xs font-bold">
                <span className="text-gray-400 uppercase tracking-widest text-[9px]">Workflow Phase:</span>
                {moa.status === 'signed' ? (
                  <span className="font-extrabold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 shadow-sm flex items-center gap-1 uppercase text-[9px] tracking-wider">
                    <CheckCircle2 size={12} /> Executed & Signed
                  </span>
                ) : moa.status === 'rejected' ? (
                  <span className="font-extrabold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 shadow-sm flex items-center gap-1 uppercase text-[9px] tracking-wider">
                    <XCircle size={12} /> Rejected
                  </span>
                ) : (
                  <span className="font-extrabold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 shadow-sm flex items-center gap-1 uppercase text-[9px] tracking-wider">
                    <Clock size={12} className="animate-spin text-blue-900" style={{ animationDuration: '3s' }} />
                    Current Signatory: {MOA_STEPS[moa.current_step]?.label}
                  </span>
                )}
              </div>

              {/* Rejection Notification Block */}
              {moa.status === 'rejected' && (
                <div className="text-xs text-red-800 bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4 shadow-sm flex items-start gap-2.5">
                  <XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-black uppercase tracking-wider block">Rejected at Phase: {moa.rejected_at_step}</span>
                    <p className="font-semibold text-gray-600 mt-1 leading-relaxed">{moa.rejection_reason}</p>
                  </div>
                </div>
              )}

              {/* Expand Signature Audit Trail */}
              <button 
                onClick={() => toggleExpand(moa.id)}
                className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-900 flex items-center gap-1 mb-2.5 transition-colors cursor-pointer"
              >
                {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                {isExpanded ? 'Hide' : 'Show'} Full Audit Trail
              </button>

              {/* Interactive Audit Timeline */}
              {isExpanded && (
                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 mb-4 space-y-5">
                  <h4 className="text-xs font-black text-blue-950 uppercase tracking-widest flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-100">
                    <FileSignature size={14} className="text-slate-400" />
                    Signature Audit Logs
                  </h4>
                  <div className="relative pl-6 border-l-2 border-gray-200/80 space-y-5">
                    {MOA_STEPS.map((step, i) => {
                      const state = stepState(moa, i)
                      const signedAt = moa[`${step.key}_signed_at`]
                      const signedBy = moa[`${step.key}_name`]
                      const remarks  = moa[`${step.key}_remarks`]
                      
                      return (
                        <div key={step.key} className="relative">
                          {/* Timeline Node */}
                          <div className="absolute -left-[31px] top-0.5 bg-white rounded-full p-0.5 z-10 shadow-sm">
                            {state === 'done' ? (
                              <div className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center">
                                <CheckCircle2 size={12} className="stroke-[3]" />
                              </div>
                            ) : state === 'active' ? (
                              <div className="w-4 h-4 rounded-full bg-blue-900 text-white flex items-center justify-center animate-pulse">
                                <Clock size={12} className="stroke-[3]" />
                              </div>
                            ) : state === 'rejected' ? (
                              <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center">
                                <XCircle size={12} className="stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-gray-150 border border-gray-300" />
                            )}
                          </div>

                          {/* Step Content */}
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[11px] uppercase tracking-wider font-extrabold ${
                                state === 'active' ? 'text-blue-900 font-black' : state === 'done' ? 'text-gray-700' : 'text-gray-400'
                              }`}>
                                {step.label}
                              </span>
                              {signedAt && (
                                <span className="text-[10px] text-gray-400 font-bold bg-white px-2 py-0.5 rounded-lg border border-gray-100 shadow-sm">
                                  {new Date(signedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            
                            {signedAt ? (
                              <div className="mt-1.5 text-xs text-gray-600 font-medium">
                                Signed by <span className="font-extrabold text-gray-900">{signedBy || 'System Authorized'}</span>
                                {remarks && (
                                  <p className="mt-1 italic text-gray-500 bg-white border border-gray-100 rounded-xl px-3 py-1.5 inline-block shadow-sm">
                                    "{remarks}"
                                  </p>
                                )}
                              </div>
                            ) : state === 'active' && moa.status !== 'rejected' ? (
                              <p className="text-xs text-blue-700/80 font-bold mt-1 animate-pulse">Awaiting official review & signature…</p>
                            ) : (
                              <p className="text-xs text-gray-400 font-semibold mt-1">Pending</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!['signed', 'rejected'].includes(moa.status) && (
                <div className="flex gap-3 pt-4 border-t border-gray-100/60 mt-3">
                  <button onClick={() => setAdvanceForm({ id: moa.id, remarks: '' })}
                    className="btn-primary text-xs font-black uppercase tracking-wider py-2.5 px-5 flex items-center gap-1.5 text-white">
                    Sign & Advance <ChevronRight size={14} />
                  </button>
                  <button onClick={() => setRejectForm({ id: moa.id, reason: '' })}
                    className="btn-danger text-xs font-black uppercase tracking-wider py-2.5 px-5 flex items-center gap-1.5">
                    Reject <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Advance Modal */}
      {advanceForm.id && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fadeIn">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
            <h3 className="text-lg font-black text-blue-950 mb-1 flex items-center gap-2">
              <FileSignature className="text-slate-400" size={20} />
              Sign & Advance MOA
            </h3>
            <p className="text-xs text-gray-500 mb-5 font-semibold">
              This will approve and sign the current step, moving the workflow to the next signatory.
            </p>
            <label className="label">Signing Remarks (optional)</label>
            <textarea className="input h-24 resize-none placeholder:text-gray-400 placeholder:font-semibold" 
              placeholder="Any administrative notes or signing directives..."
              value={advanceForm.remarks}
              onChange={e => setAdvanceForm({ ...advanceForm, remarks: e.target.value })} />
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => advanceMut.mutate(advanceForm)} className="btn-primary flex-1 py-3 text-xs uppercase font-extrabold tracking-wider text-white"
                disabled={advanceMut.isPending}>
                {advanceMut.isPending ? 'Processing…' : 'Confirm Signature'}
              </button>
              <button className="btn-secondary flex-1 py-3 text-xs uppercase font-extrabold tracking-wider" onClick={() => setAdvanceForm({ id: null, remarks: '' })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectForm.id && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fadeIn">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
            <h3 className="text-lg font-black text-red-955 mb-1 flex items-center gap-2">
              <XCircle className="text-red-500" size={20} />
              Reject MOA Workflow
            </h3>
            <p className="text-xs text-gray-500 mb-5 font-semibold">
              This will halt the MOA process at the current signatory phase.
            </p>
            <label className="label">Rejection Reason *</label>
            <textarea className="input h-24 resize-none placeholder:text-gray-400 placeholder:font-semibold" 
              placeholder="State the technical or legal reason for rejection clearly..."
              value={rejectForm.reason}
              onChange={e => setRejectForm({ ...rejectForm, reason: e.target.value })} />
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => rejectMut.mutate(rejectForm)} className="btn-danger flex-1 py-3 text-xs uppercase font-extrabold tracking-wider"
                disabled={!rejectForm.reason || rejectMut.isPending}>
                {rejectMut.isPending ? 'Processing…' : 'Confirm Reject'}
              </button>
              <button className="btn-secondary flex-1 py-3 text-xs uppercase font-extrabold tracking-wider" onClick={() => setRejectForm({ id: null, reason: '' })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
