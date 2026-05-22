import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { monitoringService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import HoursProgress from '../../components/HoursProgress'
import StatusBadge from '../../components/StatusBadge'
import { AlertTriangle, BookOpen } from 'lucide-react'

export default function CoordinatorMonitoring() {
  const [section, setSection] = useState('')
  const [semester, setSemester] = useState('')

  const { data: students, isLoading } = useQuery({
    queryKey: ['section-view', section, semester],
    queryFn: () => monitoringService.sectionView({ section: section || undefined, semester: semester || undefined }).then(r => r.data),
  })

  if (isLoading) return <LoadingSpinner />

  const atRisk = students?.filter(s => s.hours_percentage < 30 && s.ojt_status === 'active') || []

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Student Monitoring</h1>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="label">Filter by Section</label>
          <input type="text" className="input w-36" placeholder="e.g. A, B, C" value={section}
            onChange={e => setSection(e.target.value)} />
        </div>
        <div>
          <label className="label">Semester</label>
          <select className="input w-40" value={semester} onChange={e => setSemester(e.target.value)}>
            <option value="">All</option>
            <option value="1st">1st Semester</option>
            <option value="2nd">2nd Semester</option>
            <option value="Summer">Summer</option>
          </select>
        </div>
      </div>

      {/* At-Risk Alert */}
      {atRisk.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
            <AlertTriangle size={18} /> {atRisk.length} student{atRisk.length > 1 ? 's' : ''} at risk (below 30% hours)
          </div>
          <div className="flex flex-wrap gap-2">
            {atRisk.map(s => (
              <span key={s.id} className="badge-red">
                {s.students?.users?.full_name} — {s.hours_percentage}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Student Cards */}
      <div className="space-y-4">
        {students?.length === 0 && (
          <div className="card text-center text-gray-400 py-10">No students found for the selected filters.</div>
        )}
        {students?.map(p => (
          <div key={p.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-gray-800">{p.students?.users?.full_name}</p>
                <p className="text-sm text-gray-500">
                  {p.students?.student_number} · Section {p.students?.section || '?'} · {p.companies?.name}
                </p>
              </div>
              <StatusBadge status={p.ojt_status} />
            </div>
            <HoursProgress rendered={p.hours_rendered} required={p.hours_required} />
            {p.pending_weekly_reports > 0 && (
              <div className="flex items-center gap-2 mt-3 text-yellow-700 text-sm bg-yellow-50 rounded-lg px-3 py-2">
                <BookOpen size={16} />
                {p.pending_weekly_reports} weekly report{p.pending_weekly_reports > 1 ? 's' : ''} pending review
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
