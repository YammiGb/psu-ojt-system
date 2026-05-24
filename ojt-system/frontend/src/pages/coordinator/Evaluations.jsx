import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { evaluationService, placementService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { GraduationCap, Plus, AlertTriangle, FileSignature, X, Award, CheckCircle, ShieldAlert, BookOpen, Clock } from 'lucide-react'

export default function CoordinatorEvaluations() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [showIntervention, setShowIntervention] = useState(false)
  const [evalForm, setEvalForm] = useState({
    placement_id: '', period: 'midterm',
    technical_skills: '', work_attitude: '', punctuality: '',
    communication: '', initiative: '', overall_score: '', remarks: ''
  })
  const [intForm, setIntForm] = useState({
    placement_id: '', intervention_type: 'company_counseling',
    description: '', outcome: '', follow_up_date: ''
  })

  const { data: placements = [] } = useQuery({
    queryKey: ['all-placements-active'],
    queryFn: () => placementService.list({ ojt_status: 'active' }).then(r => r.data),
  })

  const evalMut = useMutation({
    mutationFn: (data) => evaluationService.submit(data),
    onSuccess: () => {
      toast.success('Evaluation submitted! Grade recomputed.')
      qc.invalidateQueries()
      setShowForm(false)
      setEvalForm({
        placement_id: '', period: 'midterm',
        technical_skills: '', work_attitude: '', punctuality: '',
        communication: '', initiative: '', overall_score: '', remarks: ''
      })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed'),
  })

  const intMut = useMutation({
    mutationFn: (data) => evaluationService.logIntervention(data),
    onSuccess: () => {
      toast.success('Intervention logged!')
      qc.invalidateQueries()
      setShowIntervention(false)
      setIntForm({
        placement_id: '', intervention_type: 'company_counseling',
        description: '', outcome: '', follow_up_date: ''
      })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed'),
  })

  const handleEvalSubmit = (e) => {
    e.preventDefault()
    evalMut.mutate({ ...evalForm, evaluator_type: 'coordinator' })
  }

  const handleIntSubmit = (e) => {
    e.preventDefault()
    intMut.mutate(intForm)
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            OJT Grades & Evaluations
          </h1>
          <p className="text-gray-400 font-medium text-xs lg:text-sm mt-1.5">
            Submit midterm/final coordinator evaluations, log student remediation cases, and review computed grade metrics.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <button 
            onClick={() => setShowIntervention(true)} 
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm flex items-center gap-2"
          >
            <AlertTriangle size={15} className="text-amber-500" /> Log Intervention
          </button>
          <button 
            onClick={() => setShowForm(true)} 
            className="bg-blue-800 text-white hover:bg-blue-950 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md hover:shadow-blue-800/10 active:scale-95 flex items-center gap-2"
          >
            <Plus size={16} /> Submit Evaluation
          </button>
        </div>
      </div>

      {/* Evaluation Modal Sheet */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-gray-150 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 px-6 py-5 flex items-center justify-between text-white border-b border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <FileSignature className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">Coordinator OJT Evaluation</h2>
                  <p className="text-blue-200 text-[10px] sm:text-xs font-medium mt-0.5">Submit rubric marks and auto-recalculate GPA totals</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEvalSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Student Placement *</label>
                    <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white" 
                      value={evalForm.placement_id}
                      onChange={e => setEvalForm({...evalForm, placement_id: e.target.value})} required>
                      <option value="">-- Select Student --</option>
                      {placements?.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.students?.users?.full_name} — {p.companies?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Period *</label>
                    <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white" 
                      value={evalForm.period}
                      onChange={e => setEvalForm({...evalForm, period: e.target.value})}>
                      <option value="midterm">Midterm</option>
                      <option value="final">Final</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-950 uppercase tracking-widest mb-3">
                    <Award size={12} className="text-amber-500" />
                    OJT Competency Rubrics (0–100)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      ['technical_skills','Technical Skills'],
                      ['work_attitude','Work Attitude'],
                      ['punctuality','Punctuality'],
                      ['communication','Communication'],
                      ['initiative','Initiative']
                    ].map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">{label}</label>
                        <input type="number" min="0" max="100" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white" 
                          value={evalForm[key]}
                          onChange={e => setEvalForm({...evalForm, [key]: e.target.value})} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-blue-900 mb-1.5 font-bold">Overall Score *</label>
                      <input type="number" min="0" max="100" className="w-full border border-blue-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white font-extrabold text-blue-950" 
                        value={evalForm.overall_score}
                        onChange={e => setEvalForm({...evalForm, overall_score: e.target.value})} required />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Remarks / Evaluator Directives</label>
                  <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white h-20 resize-none placeholder:text-gray-400 placeholder:font-semibold" 
                    placeholder="Enter academic remarks or notes for the student portfolio..."
                    value={evalForm.remarks}
                    onChange={e => setEvalForm({...evalForm, remarks: e.target.value})} />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="border border-gray-300 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-150 cursor-pointer transition-all duration-200">
                  Cancel
                </button>
                <button type="submit" disabled={evalMut.isPending}
                  className="bg-blue-900 text-white hover:bg-blue-950 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-blue-900/10 active:scale-95 disabled:opacity-50">
                  {evalMut.isPending ? 'Submitting…' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Intervention Modal Sheet */}
      {showIntervention && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
            <h3 className="text-lg font-black text-blue-950 mb-1 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              Log Remedial Intervention
            </h3>
            <p className="text-xs text-gray-500 mb-5 font-semibold">Log official counseling, site inspections, or pull-outs for at-risk cases.</p>
            
            <form onSubmit={handleIntSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Student placement *</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white" 
                  value={intForm.placement_id}
                  onChange={e => setIntForm({...intForm, placement_id: e.target.value})} required>
                  <option value="">-- Select Student --</option>
                  {placements?.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.students?.users?.full_name} ({p.students?.student_number})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Intervention Type *</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white" 
                  value={intForm.intervention_type}
                  onChange={e => setIntForm({...intForm, intervention_type: e.target.value})}>
                  <option value="company_counseling">Company Counseling</option>
                  <option value="school_pullout">School Pull-out</option>
                  <option value="monitoring_visit">Monitoring Visit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Remedial Description *</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white h-20 resize-none placeholder:text-gray-400 placeholder:font-semibold" 
                  placeholder="Record summary of action, advice given, or remedial conditions..."
                  value={intForm.description}
                  onChange={e => setIntForm({...intForm, description: e.target.value})} required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Follow-up Date</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white" 
                  value={intForm.follow_up_date}
                  onChange={e => setIntForm({...intForm, follow_up_date: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                <button type="submit" className="btn-primary flex-1 py-3 text-xs uppercase font-extrabold tracking-wider text-white" disabled={intMut.isPending}>
                  {intMut.isPending ? 'Saving…' : 'Log Case'}
                </button>
                <button type="button" className="btn-secondary flex-1 py-3 text-xs uppercase font-extrabold tracking-wider" onClick={() => setShowIntervention(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Overview Table */}
      <div className="bg-white border border-gray-150 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <h2 className="text-base font-black text-blue-950">Active Students — Grading Summaries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-blue-950 text-white text-[10px] uppercase font-black tracking-widest border-b border-blue-900">
              <tr>
                {['Student Info', 'Host Establishment', 'Supervisor Average', 'Coordinator Average', 'Final Grade'].map(h => (
                  <th key={h} className="px-5 py-4 text-left font-black tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {placements?.map(p => (
                <GradeRow key={p.id} placement={p} />
              ))}
              {(!placements || placements.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-16">
                    <GraduationCap size={40} className="mx-auto mb-3 opacity-20 text-blue-950" />
                    <p className="font-extrabold text-gray-700">No active placements found</p>
                    <p className="text-sm mt-1 text-gray-400">Students appear here once their OJT statuses are active.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function GradeRow({ placement }) {
  const { data: grade } = useQuery({
    queryKey: ['grade', placement.id],
    queryFn: () => evaluationService.getGrade(placement.id).then(r => r.data),
  })

  const gradeStyle = (g) => {
    if (!g) return 'text-gray-300 font-bold'
    if (g >= 90) return 'text-green-600 font-extrabold bg-green-50 border border-green-200/50 px-2.5 py-1 rounded-lg'
    if (g >= 75) return 'text-blue-800 font-extrabold bg-blue-50 border border-blue-200/50 px-2.5 py-1 rounded-lg'
    return 'text-red-700 font-extrabold bg-red-50 border border-red-200/50 px-2.5 py-1 rounded-lg'
  }

  return (
    <tr className="hover:bg-blue-50/30 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-blue-800 flex items-center justify-center font-black text-xs shadow-inner uppercase flex-shrink-0 border border-blue-200/50">
            {placement.students?.users?.full_name?.substring(0, 2) || 'ST'}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-blue-950 text-sm tracking-tight truncate">{placement.students?.users?.full_name}</p>
            <p className="text-[11px] text-gray-400 font-semibold mt-0.5 tracking-wide">{placement.students?.student_number}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-gray-700 text-xs truncate" title={placement.companies?.name}>
            {placement.companies?.name}
          </span>
        </div>
      </td>
      <td className="px-5 py-4">
        {grade?.supervisor_average ? (
          <span className="font-extrabold text-gray-800 text-xs">{grade.supervisor_average}</span>
        ) : (
          <span className="text-gray-400 font-bold text-xs">—</span>
        )}
      </td>
      <td className="px-5 py-4">
        {grade?.coordinator_average ? (
          <span className="font-extrabold text-gray-800 text-xs">{grade.coordinator_average}</span>
        ) : (
          <span className="text-gray-400 font-bold text-xs">—</span>
        )}
      </td>
      <td className="px-5 py-4">
        <span className={`text-xs ${gradeStyle(grade?.final_grade)}`}>
          {grade?.final_grade ?? '—'}
        </span>
      </td>
    </tr>
  )
}
