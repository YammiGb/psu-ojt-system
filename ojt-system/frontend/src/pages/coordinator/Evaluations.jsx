import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { evaluationService, placementService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { GraduationCap, Plus, AlertTriangle } from 'lucide-react'

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

  const { data: placements } = useQuery({
    queryKey: ['all-placements-active'],
    queryFn: () => placementService.list({ ojt_status: 'active' }).then(r => r.data),
  })

  const evalMut = useMutation({
    mutationFn: (data) => evaluationService.submit(data),
    onSuccess: () => {
      toast.success('Evaluation submitted! Grade recomputed.')
      qc.invalidateQueries()
      setShowForm(false)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed'),
  })

  const intMut = useMutation({
    mutationFn: (data) => evaluationService.logIntervention(data),
    onSuccess: () => {
      toast.success('Intervention logged!')
      setShowIntervention(false)
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <GraduationCap size={22} /> Evaluations
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setShowIntervention(true)} className="btn-secondary flex items-center gap-2">
            <AlertTriangle size={16} /> Log Intervention
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Submit Evaluation
          </button>
        </div>
      </div>

      {/* Evaluation Form */}
      {showForm && (
        <div className="card">
          <h2 className="font-semibold mb-4">Coordinator Monitoring Evaluation</h2>
          <form onSubmit={handleEvalSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Student Placement</label>
                <select className="input" value={evalForm.placement_id}
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
                <label className="label">Period</label>
                <select className="input" value={evalForm.period}
                  onChange={e => setEvalForm({...evalForm, period: e.target.value})}>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[['technical_skills','Technical Skills'],['work_attitude','Work Attitude'],
                ['punctuality','Punctuality'],['communication','Communication'],['initiative','Initiative']
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="label">{label} (0–100)</label>
                  <input type="number" min="0" max="100" className="input" value={evalForm[key]}
                    onChange={e => setEvalForm({...evalForm, [key]: e.target.value})} />
                </div>
              ))}
              <div>
                <label className="label">Overall Score <span className="text-red-500">*</span></label>
                <input type="number" min="0" max="100" className="input" value={evalForm.overall_score}
                  onChange={e => setEvalForm({...evalForm, overall_score: e.target.value})} required />
              </div>
            </div>

            <div>
              <label className="label">Remarks</label>
              <textarea className="input h-20 resize-none" value={evalForm.remarks}
                onChange={e => setEvalForm({...evalForm, remarks: e.target.value})} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={evalMut.isPending}>
                {evalMut.isPending ? 'Submitting…' : 'Submit Evaluation'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Intervention Form */}
      {showIntervention && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4 text-gray-800">Log Intervention / Remedial Case</h3>
            <form onSubmit={handleIntSubmit} className="space-y-3">
              <div>
                <label className="label">Student Placement</label>
                <select className="input" value={intForm.placement_id}
                  onChange={e => setIntForm({...intForm, placement_id: e.target.value})} required>
                  <option value="">-- Select --</option>
                  {placements?.map(p => (
                    <option key={p.id} value={p.id}>{p.students?.users?.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Intervention Type</label>
                <select className="input" value={intForm.intervention_type}
                  onChange={e => setIntForm({...intForm, intervention_type: e.target.value})}>
                  <option value="company_counseling">Company Counseling</option>
                  <option value="school_pullout">School Pull-out</option>
                  <option value="monitoring_visit">Monitoring Visit</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Description <span className="text-red-500">*</span></label>
                <textarea className="input h-20 resize-none" value={intForm.description}
                  onChange={e => setIntForm({...intForm, description: e.target.value})} required />
              </div>
              <div>
                <label className="label">Follow-up Date</label>
                <input type="date" className="input" value={intForm.follow_up_date}
                  onChange={e => setIntForm({...intForm, follow_up_date: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary" disabled={intMut.isPending}>
                  {intMut.isPending ? 'Saving…' : 'Log Intervention'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowIntervention(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Overview Table */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Active Students — Grade Summary</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              {['Student', 'Company', 'Supervisor Avg', 'Coordinator Avg', 'Final Grade'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {placements?.map(p => (
              <GradeRow key={p.id} placement={p} />
            ))}
            {(!placements || placements.length === 0) && (
              <tr><td colSpan={5} className="text-center text-gray-400 py-8">No active placements</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GradeRow({ placement }) {
  const { data: grade } = useQuery({
    queryKey: ['grade', placement.id],
    queryFn: () => evaluationService.getGrade(placement.id).then(r => r.data),
  })

  const gradeColor = (g) => {
    if (!g) return 'text-gray-400'
    if (g >= 90) return 'text-green-600 font-bold'
    if (g >= 75) return 'text-blue-600 font-bold'
    return 'text-red-600 font-bold'
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <p className="font-medium">{placement.students?.users?.full_name}</p>
        <p className="text-xs text-gray-400">{placement.students?.student_number}</p>
      </td>
      <td className="px-4 py-3 text-gray-600">{placement.companies?.name}</td>
      <td className="px-4 py-3">{grade?.supervisor_average ?? <span className="text-gray-300">—</span>}</td>
      <td className="px-4 py-3">{grade?.coordinator_average ?? <span className="text-gray-300">—</span>}</td>
      <td className={`px-4 py-3 ${gradeColor(grade?.final_grade)}`}>
        {grade?.final_grade ?? '—'}
      </td>
    </tr>
  )
}
