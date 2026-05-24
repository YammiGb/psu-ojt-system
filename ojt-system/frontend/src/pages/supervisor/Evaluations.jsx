import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { evaluationService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { ClipboardList, ChevronDown, ChevronUp, Star, Award, ShieldCheck, X, Check } from 'lucide-react'

const SCORE_FIELDS = [
  { key: 'technical_skills', label: 'Technical Skills' },
  { key: 'work_attitude',    label: 'Work Attitude' },
  { key: 'punctuality',      label: 'Punctuality' },
  { key: 'communication',    label: 'Communication' },
  { key: 'initiative',       label: 'Initiative' },
]

const EMPTY_FORM = {
  placement_id: '', period: 'midterm',
  technical_skills: '', work_attitude: '', punctuality: '',
  communication: '', initiative: '', overall_score: '', remarks: '',
}

export default function SupervisorEvaluations() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState(null)  // active placement for eval
  const [form, setForm] = useState(EMPTY_FORM)
  const [expanded, setExpanded] = useState({})

  const { data: interns = [], isLoading } = useQuery({
    queryKey: ['my-interns'],
    queryFn: () => evaluationService.getMyInterns().then(r => r.data),
  })

  const submitMut = useMutation({
    mutationFn: (data) => evaluationService.submit(data),
    onSuccess: () => {
      toast.success('Evaluation submitted! Grade updated.')
      qc.invalidateQueries(['my-interns'])
      qc.invalidateQueries(['eval-list'])
      setSelected(null)
      setForm(EMPTY_FORM)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to submit'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    submitMut.mutate({ ...form, evaluator_type: 'supervisor' })
  }

  const openForm = (placement) => {
    setSelected(placement)
    setForm({ ...EMPTY_FORM, placement_id: placement.id })
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            Intern Competency Evaluations
          </h1>
          <p className="text-gray-400 font-medium text-xs lg:text-sm mt-1.5">
            Submit midterm and final evaluations for your interns. Each evaluation contributes 50% to the student's final OJT grade.
          </p>
        </div>
      </div>

      {interns.length === 0 && (
        <div className="text-center text-gray-400 py-16 bg-white rounded-3xl border border-gray-150 shadow-sm">
          <ClipboardList size={48} className="mx-auto mb-3 opacity-20 text-blue-950" />
          <p className="text-base font-bold text-gray-700">No active interns found</p>
          <p className="text-sm mt-1 text-gray-400">There are currently no interns assigned to your supervisor account.</p>
        </div>
      )}

      {/* Intern cards */}
      <div className="grid grid-cols-1 gap-5">
        {interns.map(p => (
          <InternCard
            key={p.id}
            placement={p}
            expanded={expanded[p.id]}
            onToggle={() => setExpanded(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
            onEvaluate={() => openForm(p)}
          />
        ))}
      </div>

      {/* Evaluation form modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 px-6 py-5 flex items-center justify-between text-white border-b border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Star className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    Evaluate: {selected.students?.users?.full_name}
                  </h2>
                  <p className="text-blue-200 text-[10px] sm:text-xs font-medium mt-0.5">
                    {selected.companies?.name || 'Supervisor Assessment'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition-all cursor-pointer animate-pulse"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Evaluation Target Period</label>
                  <div className="flex gap-3">
                    {['midterm', 'final'].map(p => (
                      <label key={p} className={`flex-1 border rounded-xl px-4 py-3 cursor-pointer text-xs font-black uppercase tracking-wider text-center transition-all ${
                        form.period === p
                          ? 'border-blue-900 bg-blue-50/50 text-blue-950 shadow-sm'
                          : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                      }`}>
                        <input type="radio" className="sr-only" value={p}
                          checked={form.period === p}
                          onChange={() => setForm({ ...form, period: p })} />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {SCORE_FIELDS.map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-gray-700 mb-1">{label} (0–100) *</label>
                      <input type="number" min="0" max="100" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white font-semibold"
                        value={form[key]} required
                        onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder="e.g. 85" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Overall Assessment Score *</label>
                    <input type="number" min="0" max="100" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white font-extrabold text-blue-900"
                      value={form.overall_score} required
                      onChange={e => setForm({ ...form, overall_score: e.target.value })} placeholder="e.g. 90" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Qualitative Remarks (optional)</label>
                  <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white h-24 resize-none placeholder:text-gray-400 placeholder:font-semibold"
                    value={form.remarks}
                    onChange={e => setForm({ ...form, remarks: e.target.value })}
                    placeholder="Provide specific feedback regarding work attitude, accomplishments, or areas for improvement..." />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
                <button type="button" onClick={() => setSelected(null)}
                  className="border border-gray-300 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-all duration-200">
                  Cancel
                </button>
                <button type="submit" disabled={submitMut.isPending}
                  className="bg-blue-900 text-white hover:bg-blue-950 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-blue-900/10 active:scale-95 disabled:opacity-50">
                  {submitMut.isPending ? 'Submitting…' : 'Submit Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function InternCard({ placement, expanded, onToggle, onEvaluate }) {
  const { data: evals = [] } = useQuery({
    queryKey: ['eval-list', placement.id],
    queryFn: () => evaluationService.getEvaluations(placement.id).then(r => r.data),
  })

  const { data: grade } = useQuery({
    queryKey: ['grade', placement.id],
    queryFn: () => evaluationService.getGrade(placement.id).then(r => r.data),
  })

  const supEvals = evals.filter(e => e.evaluator_type === 'supervisor')

  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-gray-200/80 transition-all duration-300">
      
      {/* Spacious Card Header (md:flex-row with ample gap-6) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-blue-950 tracking-tight">
              {placement.students?.users?.full_name}
            </h3>
            <span className="bg-blue-50 text-blue-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-blue-100 shadow-sm flex-shrink-0">
              Intern
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500 mt-1">
            {placement.students?.program} · Section {placement.students?.section || '?'}
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
            Student ID: {placement.students?.student_number}
          </p>
        </div>
        
        <div className="flex items-center gap-3.5 self-start md:self-auto">
          <button 
            onClick={onEvaluate} 
            className="bg-blue-900 text-white hover:bg-blue-950 px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
          >
            <Award size={14} className="text-slate-400" /> Evaluate Competency
          </button>
          
          <button 
            onClick={onToggle} 
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all text-gray-450 hover:text-gray-600 cursor-pointer border border-gray-150 hover:border-gray-300"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Grade status pill summaries */}
      {grade?.supervisor_average != null && (
        <div className="mt-5 flex flex-wrap items-center gap-6 text-xs font-bold text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-450">Supervisor Average:</span>
            <span className="font-extrabold text-blue-900 text-sm bg-blue-50 px-2.5 py-0.5 border border-blue-100 rounded-lg">{grade.supervisor_average}</span>
          </div>
          
          {grade.final_grade != null && (
            <>
              <span className="text-gray-300 font-normal px-2">|</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-450">Final Compiled Grade:</span>
                <span className={`font-black text-xs px-2.5 py-0.5 rounded-lg border shadow-sm ${
                  grade.final_grade >= 75 
                    ? 'bg-green-50 text-green-700 border-green-200/50' 
                    : 'bg-red-50 text-red-650 border-red-200/50'
                }`}>
                  {grade.final_grade}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Submitted evaluation history logs (Expanded Stack - Uses Full Horizontal Space) */}
      {expanded && (
        <div className="mt-6 pt-6 border-t border-gray-150 space-y-5 animate-fadeIn">
          <h4 className="text-[10px] font-black text-blue-950 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-slate-400" />
            Evaluation Performance Logs
          </h4>
          
          {supEvals.length === 0 ? (
            <p className="text-xs text-gray-400 font-semibold italic">No competency evaluations submitted for this intern yet.</p>
          ) : (
            <div className="space-y-4">
              {supEvals.map(ev => (
                <div key={ev.id} className="bg-gray-50/40 border border-gray-150 rounded-2xl p-6 hover:border-gray-200 transition-colors space-y-4 shadow-inner">
                  <div className="flex justify-between items-center pb-3.5 border-b border-gray-200/60">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">{ev.period} evaluation</span>
                    <span className="text-xs font-black bg-blue-900 text-white px-3 py-1 rounded-full shadow-sm">{ev.overall_score} Score</span>
                  </div>
                  
                  {/* Spacious 5-column score grid utilizing full card width */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {SCORE_FIELDS.map(({ key, label }) => ev[key] != null && (
                      <div key={key} className="bg-white border border-gray-150 p-3 rounded-2xl shadow-sm text-center">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider leading-none truncate" title={label}>{label}</p>
                        <p className="text-base font-black text-gray-900 mt-2">{ev[key]}</p>
                      </div>
                    ))}
                  </div>
                  
                  {ev.remarks && (
                    <div className="bg-white border border-gray-150 rounded-2xl px-4 py-3.5 text-xs italic text-gray-550 flex items-start gap-1">
                      <span className="text-blue-900 font-extrabold text-sm">"</span>
                      <p className="leading-relaxed">{ev.remarks}</p>
                      <span className="text-blue-900 font-extrabold text-sm">"</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

