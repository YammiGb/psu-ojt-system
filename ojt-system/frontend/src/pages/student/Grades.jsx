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
    <div className="w-full max-w-7xl mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            My OJT Grades &amp; Evaluations
          </h1>
          <p className="text-gray-400 font-medium text-xs lg:text-sm mt-1">
            Track your final computed marks, coordinator evaluations, supervisor feedbacks, and official submissions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Grade Hero & Submission Summary */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Final Grade Hero */}
          <div className="card text-center py-6 bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-800 text-white relative overflow-hidden shadow-lg rounded-3xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl z-0" />
            <div className="relative z-10 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-amber-400 font-black">Final Computed Grade</p>
              <p className={`text-5xl font-black tracking-tighter ${
                grade?.final_grade >= 75 ? 'text-green-400' : grade?.final_grade ? 'text-red-400' : 'text-gray-400'
              }`}>
                {grade?.final_grade ?? '—'}
              </p>
              {grade?.final_grade && (
                <div className="pt-0.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    grade.final_grade >= 75 ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-red-500/20 text-red-300 border border-red-400/30'
                  }`}>
                    {grade.final_grade >= 75 ? '✓ Passing' : '⚠️ Failing'}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-blue-200/90 font-medium">
                Formula: (Supervisor 50%) + (Coordinator 50%)
              </p>
              <div className="pt-2 border-t border-blue-850 text-[9px] text-blue-400 font-bold uppercase tracking-wider">
                {grade?.computed_at ? `Computed: ${new Date(grade.computed_at).toLocaleDateString()}` : 'Pending computation'}
              </div>
            </div>
          </div>
                    {/* Document Status */}
          <div className="card p-4.5 shadow-md border border-gray-150 rounded-3xl bg-white">
            <h2 className="text-sm font-black text-blue-950 mb-3 pb-2 border-b border-gray-100 uppercase tracking-wider">Course Requirements</h2>
            <div className="space-y-2.5">
              {[
                ['Portfolio Document', grade?.portfolio_submitted, grade?.portfolio_url],
                ['Narrative Report File', grade?.narrative_report_submitted, grade?.narrative_report_url],
              ].map(([lbl, done, url]) => (
                <div key={lbl} className="flex items-center justify-between bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{lbl}</p>
                    {url && (
                      <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-black hover:underline mt-0.5 inline-block">
                        View submitted file
                      </a>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {done ? (
                      <span className="badge-green text-[11px] py-1 px-2.5">Submitted</span>
                    ) : (
                      <span className="badge-yellow text-[11px] py-1 px-2.5">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Breakdown & Evaluations */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Scores Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Supervisor card */}
            <div className="card p-4 shadow-md border border-indigo-50/50 hover:shadow-lg transition-all duration-300 rounded-3xl bg-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-extrabold text-indigo-900/85 uppercase tracking-wider">Supervisor Mark</p>
                  <p className="text-sm font-black text-indigo-955 mt-0.5">Weight: 50%</p>
                </div>
                <TrendingUp size={16} className="text-indigo-600" />
              </div>
              <p className="text-4xl font-black text-indigo-600">{grade?.supervisor_average ?? '—'}</p>
              <div className="mt-3.5 pt-2.5 border-t border-gray-100 text-sm space-y-2 text-gray-600 font-bold">
                <div className="flex justify-between items-center bg-indigo-50/20 p-1.5 rounded-lg">
                  <span className="text-[11px] font-black text-indigo-950 uppercase tracking-widest">Midterm</span>
                  <span className="text-indigo-600 text-base">{grade?.supervisor_midterm_score ?? '—'}</span>
                </div>
                <div className="flex justify-between items-center bg-indigo-50/20 p-1.5 rounded-lg">
                  <span className="text-[11px] font-black text-indigo-950 uppercase tracking-widest">Final</span>
                  <span className="text-indigo-600 text-base">{grade?.supervisor_final_score ?? '—'}</span>
                </div>
              </div>
            </div>

            {/* Coordinator card */}
            <div className="card p-4 shadow-md border border-teal-50/50 hover:shadow-lg transition-all duration-300 rounded-3xl bg-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-extrabold text-teal-900/85 uppercase tracking-wider">Coordinator Mark</p>
                  <p className="text-sm font-black text-teal-955 mt-0.5">Weight: 50%</p>
                </div>
                <TrendingUp size={16} className="text-teal-600" />
              </div>
              <p className="text-4xl font-black text-teal-600">{grade?.coordinator_average ?? '—'}</p>
              <div className="mt-3.5 pt-2.5 border-t border-gray-100 text-sm space-y-2 text-gray-600 font-bold">
                <div className="flex justify-between items-center bg-teal-50/20 p-1.5 rounded-lg">
                  <span className="text-[11px] font-black text-teal-955 uppercase tracking-widest">Midterm</span>
                  <span className="text-teal-600 text-base">{grade?.coordinator_midterm_score ?? '—'}</span>
                </div>
                <div className="flex justify-between items-center bg-teal-50/20 p-1.5 rounded-lg">
                  <span className="text-[11px] font-black text-teal-955 uppercase tracking-widest">Final</span>
                  <span className="text-teal-600 text-base">{grade?.coordinator_final_score ?? '—'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Evaluations detailed parameters */}
          {evaluations && evaluations.length > 0 && (
            <div className="card p-4.5 shadow-md border border-gray-150 rounded-3xl bg-white">
              <h2 className="text-base font-black text-blue-950 mb-3 pb-2 border-b border-gray-100">Detailed Feedback & Evaluations</h2>
              <div className="space-y-4">
                {evaluations.map(ev => (
                  <div key={ev.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/30 hover:bg-white transition-all shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-2.5 border-b border-gray-100/50">
                      <div>
                        <span className="text-sm font-extrabold capitalize text-blue-950 bg-blue-50 border border-blue-200/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {ev.evaluator_type} — {ev.period}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Score:</span>
                        <span className="font-black text-blue-900 text-xl">{ev.overall_score}</span>
                      </div>
                    </div>

                    {/* Skill-wise details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-bold">
                      {[
                        ['Technical Skills', ev.technical_skills], 
                        ['Work Attitude', ev.work_attitude],
                        ['Punctuality', ev.punctuality], 
                        ['Communication', ev.communication],
                        ['Initiative', ev.initiative]
                      ].map(([k, v]) => v != null && (
                        <div key={k} className="flex justify-between items-center bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                          <span className="text-gray-500">{k}</span>
                          <span className="font-extrabold text-blue-900 text-sm bg-blue-50 px-2 py-0.5 rounded-md">{v}</span>
                        </div>
                      ))}
                    </div>
                    {ev.remarks && (
                      <div className="text-sm text-gray-500 mt-3 italic bg-white rounded-xl p-3 border border-gray-100 shadow-sm leading-relaxed">
                        " {ev.remarks} "
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
