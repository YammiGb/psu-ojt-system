import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { evaluationService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { ClipboardList, ChevronDown, ChevronUp } from 'lucide-react'

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
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <ClipboardList size={22} /> Intern Evaluations
      </h1>
      <p className="text-sm text-gray-500 -mt-4">
        Submit midterm and final evaluations for your interns. Each evaluation contributes 50% to the student's final OJT grade.
      </p>

      {interns.length === 0 && (
        <div className="card text-center text-gray-400 py-12">
          <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
          <p>No active interns found for your company.</p>
        </div>
      )}

      {/* Intern cards */}
      <div className="space-y-4">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl my-4">
            <h3 className="font-semibold text-gray-800 mb-0.5">
              Evaluate: {selected.students?.users?.full_name}
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              {selected.companies?.name} · Supervisor Evaluation
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Period</label>
                <div className="flex gap-3">
                  {['midterm', 'final'].map(p => (
                    <label key={p} className={`flex-1 border rounded-lg px-4 py-2.5 cursor-pointer text-sm font-medium text-center transition-colors ${
                      form.period === p
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                      <input type="radio" className="sr-only" value={p}
                        checked={form.period === p}
                        onChange={() => setForm({ ...form, period: p })} />
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {SCORE_FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="label">{label} (0–100)</label>
                    <input type="number" min="0" max="100" className="input"
                      value={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })} />
                  </div>
                ))}
                <div>
                  <label className="label">Overall Score <span className="text-red-500">*</span></label>
                  <input type="number" min="0" max="100" className="input"
                    value={form.overall_score} required
                    onChange={e => setForm({ ...form, overall_score: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="label">Remarks (optional)</label>
                <textarea className="input h-20 resize-none"
                  value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Any comments about this intern's performance..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary" disabled={submitMut.isPending}>
                  {submitMut.isPending ? 'Submitting…' : 'Submit Evaluation'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setSelected(null)}>
                  Cancel
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
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-800">{placement.students?.users?.full_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {placement.students?.program} · Section {placement.students?.section || '?'} ·
            Student # {placement.students?.student_number}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEvaluate} className="btn-primary text-sm py-1.5">
            + Evaluate
          </button>
          <button onClick={onToggle} className="text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Grade pill */}
      {grade?.supervisor_average != null && (
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="text-gray-500">Your Average:</span>
          <span className="font-bold text-teal-600 text-lg">{grade.supervisor_average}</span>
          {grade.final_grade != null && (
            <>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">Final Grade:</span>
              <span className={`font-bold text-lg ${grade.final_grade >= 75 ? 'text-green-600' : 'text-red-500'}`}>
                {grade.final_grade}
              </span>
            </>
          )}
        </div>
      )}

      {/* Submitted evals */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase">Your Evaluations</p>
          {supEvals.length === 0 && (
            <p className="text-sm text-gray-400">No evaluations submitted yet.</p>
          )}
          {supEvals.map(ev => (
            <div key={ev.id} className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="font-medium capitalize text-gray-700">{ev.period}</span>
                <span className="font-bold text-teal-600">{ev.overall_score}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs text-gray-500">
                {SCORE_FIELDS.map(({ key, label }) => ev[key] != null && (
                  <div key={key} className="flex justify-between">
                    <span>{label}</span>
                    <span className="font-medium text-gray-700">{ev[key]}</span>
                  </div>
                ))}
              </div>
              {ev.remarks && <p className="text-xs text-gray-500 mt-2 italic">"{ev.remarks}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
