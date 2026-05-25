import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { monitoringService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import HoursProgress from '../../components/HoursProgress'
import StatusBadge from '../../components/StatusBadge'
import { AlertTriangle, BookOpen, Search, Building, SlidersHorizontal, Users, ShieldAlert, GraduationCap, X, ChevronRight } from 'lucide-react'

export default function CoordinatorMonitoring() {
  const [section, setSection] = useState('')
  const [semester, setSemester] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['section-view', section, semester],
    queryFn: () => monitoringService.sectionView({ section: section || undefined, semester: semester || undefined }).then(r => r.data),
  })

  // Client-side quick search filter
  const filteredStudents = useMemo(() => {
    if (!students) return []
    let result = students
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(s => {
        const name = (s.students?.users?.full_name || '').toLowerCase()
        const studentNum = (s.students?.student_number || '').toLowerCase()
        const company = (s.companies?.name || '').toLowerCase()
        return name.includes(q) || studentNum.includes(q) || company.includes(q)
      })
    }
    return result
  }, [students, searchQuery])

  if (isLoading) return <LoadingSpinner />

  const atRisk = students?.filter(s => s.hours_percentage < 30 && s.ojt_status === 'active') || []

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            Student OJT Progress Monitoring
          </h1>
          <p className="text-gray-400 font-medium text-xs lg:text-sm mt-1.5">
            Monitor real-time daily training logs, weekly accomplishment reports, and overall hour completion metrics per section.
          </p>
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-white border border-gray-150 rounded-3xl shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-5 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              className="w-full border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white placeholder:text-gray-500 placeholder:font-semibold"
              placeholder="Search by student name, number, or assigned company…"
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

        {/* Section/Semester Filters */}
        <div className="px-5 py-4 bg-gray-50/50 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-[10px] font-black text-blue-950 uppercase tracking-widest mr-2">
            <SlidersHorizontal size={12} className="text-amber-500" />
            Scope Filters
          </div>
          <div>
            <input
              type="text"
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white w-32 placeholder:text-gray-400"
              placeholder="Section (e.g. A)"
              value={section}
              onChange={e => setSection(e.target.value)}
            />
          </div>
          <div>
            <select
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
              value={semester}
              onChange={e => setSemester(e.target.value)}>
              <option value="">All Semesters</option>
              <option value="1st">1st Semester</option>
              <option value="2nd">2nd Semester</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
          <div className="ml-auto text-xs font-bold text-gray-400">
            {students.length} Total Students
          </div>
        </div>
      </div>

      {/* At-Risk Alert */}
      {atRisk.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2.5 text-red-800 font-black text-sm uppercase tracking-wide mb-3">
            <ShieldAlert size={18} className="text-red-650 flex-shrink-0 animate-pulse" />
            <span>Attention: {atRisk.length} Student{atRisk.length > 1 ? 's' : ''} Flagged At-Risk (below 30% Hours)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {atRisk.map(s => (
              <span key={s.id} className="inline-flex items-center gap-1.5 text-xs bg-red-100/60 text-red-800 border border-red-200/50 px-3 py-1.5 rounded-full font-extrabold shadow-sm">
                <AlertTriangle size={12} className="text-red-600" />
                {s.students?.users?.full_name} ({s.hours_percentage}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Student Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredStudents.length === 0 && (
          <div className="md:col-span-2 text-center text-gray-400 py-16 bg-white rounded-3xl border border-gray-150 shadow-md">
            <Users size={48} className="mx-auto mb-3 opacity-20 text-blue-950" />
            <p className="text-base font-bold text-gray-700">No students matching filters</p>
            <p className="text-sm mt-1">Adjust your search parameters or check the section code spelling.</p>
          </div>
        )}

        {filteredStudents.map(p => (
          <div
            key={p.id}
            className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-gray-200/80 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
          >
            <div>
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-blue-800 flex items-center justify-center font-black text-xs shadow-inner uppercase flex-shrink-0 border border-blue-200/50">
                    {p.students?.users?.full_name?.substring(0, 2) || 'ST'}
                  </div>
                  <div>
                    <h3 className="font-black text-blue-950 text-base tracking-tight group-hover:text-blue-900 transition-colors">
                      {p.students?.users?.full_name}
                    </h3>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5 tracking-wide">
                      {p.students?.student_number} · Section <strong className="text-gray-600">{p.students?.section || '?'}</strong>
                    </p>
                  </div>
                </div>
                <StatusBadge status={p.ojt_status} />
              </div>

              {/* Host Company Badge */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 mb-4 text-xs font-semibold text-gray-700">
                <Building size={14} className="text-gray-400" />
                <span className="truncate" title={p.companies?.name}>Host: <strong>{p.companies?.name}</strong></span>
              </div>

              {/* Hours Progress Bar */}
              <div className="bg-gray-50/20 border border-gray-100/50 rounded-2xl p-4 mb-3">
                <HoursProgress rendered={p.hours_rendered} required={p.hours_required} />
              </div>
            </div>

            {/* Warnings / Pending review alerts */}
            {p.pending_weekly_reports > 0 && (
              <Link 
                to="/coordinator/weekly-reports" 
                className="flex items-center justify-between gap-2 text-xs font-bold text-amber-700 bg-amber-50/60 border border-amber-200/50 hover:bg-amber-100/80 rounded-xl px-4 py-2.5 mt-3 shadow-sm transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BookOpen size={14} className="text-amber-600" />
                  <span>{p.pending_weekly_reports} Weekly Report{p.pending_weekly_reports > 1 ? 's' : ''} Pending Review</span>
                </span>
                <ChevronRight size={14} className="text-amber-500" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
