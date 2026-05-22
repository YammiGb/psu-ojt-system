import { useQuery } from '@tanstack/react-query'
import { evaluationService, placementService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import { GraduationCap, TrendingUp } from 'lucide-react'

export default function StudentGrades() {
  const { data: placements } = useQuery({
    queryKey: ['my-placements'],
    queryFn: () => placementService.list().then(r => r.data),
  })

  const activePlacement = placements?.find(p => ['active', 'completed'].includes(p.ojt_status))

  const { data: grade, isLoading: gradeLoading } = useQuery({
    queryKey: ['my-grade', activePlacement?.id],
    queryFn: () => evaluationService.getGrade(activePlacement.id).then(r => r.data),
    enabled: !!activePlacement?.id,
  })

  const { data: evaluations } = useQuery({
    queryKey: ['my-evals', activePlacement?.id],
    queryFn: () => evaluationService.getEvaluations(activePlacement.id).then(r => r.data),
    enabled: !!activePlacement?.id,
  })

  if (!activePlacement) return (
    <div className="card text-center text-gray-400 py-12 max-w-lg">
      <GraduationCap size={36} className="mx-auto mb-2 opacity-40" />
      <p>No placement found. Grades will appear here once you're placed.</p>
    </div>
  )

  if (gradeLoading) return <LoadingSpinner />

  const gradeColor = (g) => {
    if (!g) return 'text-gray-400'
    if (g >= 90) return 'text-green-600'
    if (g >= 75) return 'text-blue-600'
    if (g >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800">My OJT Grades</h1>

      {/* Final Grade Hero */}
      <div className="card text-center py-10">
        <p className="text-sm text-gray-500 mb-2">Final Grade (50/50 Formula)</p>
        <p className={`text-6xl font-bold ${gradeColor(grade?.final_grade)}`}>
          {grade?.final_grade ?? '—'}
        </p>
        {grade?.final_grade && (
          <p className="text-gray-400 text-sm mt-2">
            {grade.final_grade >= 75 ? '✅ Passing' : '❌ Below passing threshold'}
          </p>
        )}
        <p className="text-xs text-gray-300 mt-1">
          Computed: {grade?.computed_at ? new Date(grade.computed_at).toLocaleString() : 'Not yet computed'}
        </p>
      </div>

      {/* Grade Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Supervisor Score (50%)</p>
          <p className="text-3xl font-bold text-indigo-600">{grade?.supervisor_average ?? '—'}</p>
          <div className="mt-3 text-sm space-y-1 text-gray-600">
            <div className="flex justify-between"><span>Midterm</span><span className="font-medium">{grade?.supervisor_midterm_score ?? '—'}</span></div>
            <div className="flex justify-between"><span>Final</span><span className="font-medium">{grade?.supervisor_final_score ?? '—'}</span></div>
          </div>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 mb-1">Coordinator Score (50%)</p>
          <p className="text-3xl font-bold text-teal-600">{grade?.coordinator_average ?? '—'}</p>
          <div className="mt-3 text-sm space-y-1 text-gray-600">
            <div className="flex justify-between"><span>Midterm</span><span className="font-medium">{grade?.coordinator_midterm_score ?? '—'}</span></div>
            <div className="flex justify-between"><span>Final</span><span className="font-medium">{grade?.coordinator_final_score ?? '—'}</span></div>
          </div>
        </div>
      </div>

      {/* Portfolio Status */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">Submission Status</h2>
        <div className="space-y-2 text-sm">
          {[
            ['Portfolio', grade?.portfolio_submitted, grade?.portfolio_url],
            ['Narrative Report', grade?.narrative_report_submitted, grade?.narrative_report_url],
          ].map(([lbl, done, url]) => (
            <div key={lbl} className="flex items-center justify-between">
              <span className="text-gray-700">{lbl}</span>
              <div className="flex items-center gap-2">
                {done
                  ? <span className="badge-green">Submitted</span>
                  : <span className="badge-yellow">Pending</span>}
                {url && <a href={url} target="_blank" rel="noreferrer" className="text-primary-600 text-xs hover:underline">View</a>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evaluation Details */}
      {evaluations && evaluations.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Evaluation Details</h2>
          <div className="space-y-3">
            {evaluations.map(ev => (
              <div key={ev.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium capitalize">{ev.evaluator_type} — {ev.period}</span>
                  <span className="font-bold text-primary-700">{ev.overall_score}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                  {[['Technical', ev.technical_skills], ['Work Attitude', ev.work_attitude],
                    ['Punctuality', ev.punctuality], ['Communication', ev.communication],
                    ['Initiative', ev.initiative]].map(([k, v]) => v != null && (
                      <div key={k} className="flex justify-between">
                        <span>{k}</span><span className="font-medium text-gray-700">{v}</span>
                      </div>
                  ))}
                </div>
                {ev.remarks && <p className="text-xs text-gray-500 mt-2 italic">"{ev.remarks}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
