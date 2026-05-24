import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  BarChart2,
  Download,
  FileText,
  Archive,
  Users,
  Building2,
  ScrollText,
  CheckCircle2,
  GraduationCap,
  RotateCcw,
  Calendar,
  X,
  FileSpreadsheet,
  TrendingUp,
  Award,
  Info,
  ChevronRight,
  Sparkles
} from 'lucide-react'

export default function CoordinatorReports() {
  const qc = useQueryClient()
  const [semester, setSemester]         = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [downloading, setDownloading]   = useState(false)
  const [archiveModal, setArchiveModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [certDownloading, setCertDownloading] = useState(false)

  // Query stats overview
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['report-overview', semester, academicYear],
    queryFn: () => reportService.overview({
      ...(semester     && { semester }),
      ...(academicYear && { academic_year: academicYear }),
    }).then(r => r.data),
  })

  // Query archived history
  const { data: archives = [] } = useQuery({
    queryKey: ['archives'],
    queryFn: () => reportService.archives().then(r => r.data),
  })

  // Query eligible certificate students
  const { data: eligible = [], isLoading: eligibleLoading } = useQuery({
    queryKey: ['eligible-cert', semester, academicYear],
    queryFn: () => reportService.eligibleStudents({
      ...(semester     && { semester }),
      ...(academicYear && { academic_year: academicYear }),
    }).then(r => r.data),
  })

  // Excel sheet download
  const handleExcel = async () => {
    setDownloading(true)
    try {
      const res  = await reportService.exportExcel({
        ...(semester     && { semester }),
        ...(academicYear && { academic_year: academicYear }),
      })
      const url  = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `OJT_Summary_${semester || 'ALL'}_${academicYear || 'ALL'}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Excel report downloaded successfully!')
    } catch {
      toast.error('Excel export generation failed')
    } finally {
      setDownloading(false)
    }
  }

  // Archive semester mutation
  const archiveMut = useMutation({
    mutationFn: () => reportService.archive(semester, academicYear),
    onSuccess: () => {
      toast.success('Semester archived successfully!')
      qc.invalidateQueries(['archives'])
      setArchiveModal(false)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Archive operation failed'),
  })

  // PDF certificate download
  const handleDownloadCertificate = async () => {
    if (!selectedStudent) return toast.error('Please select an eligible student candidate first')
    setCertDownloading(true)
    try {
      const res  = await reportService.certificate(selectedStudent)
      const item = eligible.find(e => e.placement_id === selectedStudent)
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `OJT_Certificate_${item?.student_number || selectedStudent}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Official completion certificate downloaded!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate PDF certificate')
    } finally {
      setCertDownloading(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            Reports & Analytics Hub
          </h1>
          <p className="text-gray-400 font-medium text-xs lg:text-sm mt-1.5">
            Audit overall student placements, export final grade registries, issue digital completion certificates, and manage semester-wide records.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center bg-gray-50 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200/60">
          <Sparkles size={13} className="text-slate-400 stroke-[2.5]" />
          <span>System Reports Panel</span>
        </div>
      </div>

      {/* Filter Parameters Scope */}
      <div className="bg-white border border-gray-150 rounded-3xl shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-black text-blue-950 uppercase tracking-wider">Report Filter Scope</h2>
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[140px] sm:max-w-[200px]">
            <label className="label">Semester</label>
            <input 
              className="input w-full bg-white font-semibold" 
              placeholder="e.g. 2024-1"
              value={semester} 
              onChange={e => {
                setSemester(e.target.value)
                setSelectedStudent('') // reset selected candidate as eligible pool changes
              }} 
            />
          </div>
          <div className="flex-1 min-w-[140px] sm:max-w-[200px]">
            <label className="label">Academic Year</label>
            <input 
              className="input w-full bg-white font-semibold" 
              placeholder="e.g. 2024-2025"
              value={academicYear} 
              onChange={e => {
                setAcademicYear(e.target.value)
                setSelectedStudent('') // reset selected candidate
              }} 
            />
          </div>
          <button 
            onClick={() => { 
              setSemester('')
              setAcademicYear('') 
              setSelectedStudent('')
            }}
            className="btn-secondary h-11 px-5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <RotateCcw size={13} /> Clear Scope
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      {statsLoading ? (
        <div className="py-12 bg-white rounded-3xl border border-gray-150 shadow-sm flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PremiumStatCard icon={Users} label="Total Students" value={stats.students?.total || 0} theme="blue" />
          <PremiumStatCard icon={Building2} label="Host Companies" value={stats.companies?.total || 0} theme="amber" />
          <PremiumStatCard icon={CheckCircle2} label="Completed OJT" value={stats.placements?.by_status?.completed || 0} theme="green" />
          <PremiumStatCard icon={ScrollText} label="MOA Signed" value={stats.moa?.by_status?.signed || 0} theme="indigo" />
        </div>
      ) : null}

      {/* Analytics & Performance Metrics Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Placement Status Distribution */}
        {stats?.placements?.by_status && Object.keys(stats.placements.by_status).length > 0 && (
          <div className="bg-white border border-gray-150 rounded-3xl shadow-sm p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <h2 className="text-base font-black text-blue-950 tracking-tight">OJT Placement Distribution</h2>
              </div>
              <div className="space-y-4">
                {Object.entries(stats.placements.by_status).map(([status, count]) => {
                  const total = stats.placements.total || 1
                  const pct   = Math.round((count / total) * 100)
                  
                  // Premium color mapping & badges
                  const statusConfig = {
                    active: {
                      bar: 'bg-gradient-to-r from-blue-600 to-sky-400',
                      badge: 'bg-blue-50 border-blue-100 text-blue-800',
                      label: 'Active Placements'
                    },
                    completed: {
                      bar: 'bg-gradient-to-r from-blue-600 to-sky-400',
                      badge: 'bg-emerald-50 border-emerald-100 text-emerald-800',
                      label: 'Completed OJT'
                    },
                    not_completed: {
                      bar: 'bg-gradient-to-r from-red-500 to-rose-400',
                      badge: 'bg-rose-50 border-rose-100 text-rose-800',
                      label: 'Incomplete / Backlog'
                    },
                    transferred: {
                      bar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
                      badge: 'bg-amber-50 border-amber-100 text-amber-800',
                      label: 'Transferred Placement'
                    },
                    withdrawn: {
                      bar: 'bg-gradient-to-r from-gray-500 to-slate-400',
                      badge: 'bg-gray-50 border-gray-150 text-gray-700',
                      label: 'Withdrawn'
                    }
                  }

                  const config = statusConfig[status] || {
                    bar: 'bg-gray-400',
                    badge: 'bg-gray-50 border-gray-150 text-gray-600',
                    label: status.replace('_',' ')
                  }

                  return (
                    <div key={status} className="bg-gray-50/30 border border-gray-100/60 rounded-2xl p-3.5 hover:border-gray-200 transition-colors">
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="font-extrabold text-gray-700 uppercase tracking-wider text-[10px]">{config.label}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${config.badge}`}>
                          {count} student{count !== 1 ? 's' : ''} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full rounded-full transition-all duration-500 ${config.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Students by Academic Program Track */}
        {stats?.students?.by_program && (
          <div className="bg-white border border-gray-150 rounded-3xl shadow-sm p-6 sm:p-7 flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-base font-black text-blue-950 tracking-tight">Enrolled Students by Program</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {Object.entries(stats.students.by_program).map(([prog, count]) => (
                <div key={prog} className="flex items-center justify-between p-4 bg-gradient-to-br from-indigo-50/20 to-white border border-indigo-100 rounded-2xl transition-all duration-300 hover:shadow-md hover:border-indigo-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                      <Award size={18} className="stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Program Track</p>
                      <p className="text-xs font-bold text-gray-800 mt-0.5">{prog}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-700 tracking-tight">{count}</span>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Students</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Center Hub */}
      <div className="bg-white border border-gray-150 rounded-3xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-black text-blue-950 tracking-tight font-black">Administrative Operations Hub</h2>
        </div>
        <p className="text-xs text-gray-400 mb-6 font-semibold">
          Perform bulk administrative actions. Download data summaries for physical filing or archive active periods.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Excel Export Card */}
          <div className="bg-gradient-to-br from-blue-50/20 to-white border border-gray-100 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-200 transition-all duration-300 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="text-slate-400" size={18} />
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Excel Summary Records</h3>
              </div>
              <p className="text-xs text-gray-400 font-semibold mb-4 leading-relaxed">
                Generate and download an exhaustive Excel spreadsheet containing student hours rendered, details, company partners, supervisor remarks, and final compiled grade registries.
              </p>
            </div>
            <div>
              <button 
                onClick={handleExcel} 
                disabled={downloading}
                className="btn-primary w-full py-3.5 text-xs uppercase font-extrabold tracking-widest flex items-center justify-center gap-2 text-white shadow-md shadow-blue-900/10 cursor-pointer"
              >
                <Download size={14} />
                {downloading ? 'Compiling spreadsheet records…' : 'Download Excel Registry'}
              </button>
            </div>
          </div>

          {/* Archiving Card */}
          <div className="bg-gradient-to-br from-amber-50/20 to-white border border-gray-100 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-200 transition-all duration-300 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Archive className="text-slate-400" size={18} />
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Archive Active Semester</h3>
              </div>
              <p className="text-xs text-gray-400 font-semibold mb-4 leading-relaxed">
                Archive overall student records for the selected term. Archived rows are locked as historical registries but are permanently retained for administrative report query access.
              </p>
            </div>
            <div>
              <button 
                onClick={() => {
                  if (!semester || !academicYear) return toast.error('Specify a Semester and Academic Year first in the scope filter!')
                  setArchiveModal(true)
                }} 
                className="btn-secondary w-full py-3.5 text-xs uppercase font-extrabold tracking-widest flex items-center justify-center gap-2 cursor-pointer border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Archive size={14} /> Archive Semester
              </button>
              {!semester || !academicYear ? (
                <p className="text-[10px] text-amber-600 font-bold mt-2.5 text-center flex items-center justify-center gap-1 bg-amber-50/50 p-2 rounded-xl border border-amber-100">
                  <Info size={11} className="flex-shrink-0 text-slate-400" /> Specify filters above to enable archiving operations.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Portal with Printable Mockup Preview */}
      <div className="bg-white border border-gray-150 rounded-3xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-black text-blue-950 tracking-tight font-black">Completion Certificates (PDF)</h2>
        </div>
        <p className="text-xs text-gray-400 mb-6 font-semibold">
          Issue digital certificates of training completion. Only students who have successfully accomplished all training hours AND have a finalized grade appear in this catalog.
        </p>

        {eligibleLoading && <p className="text-sm text-gray-400 font-medium animate-pulse">Querying eligible candidates...</p>}

        {!eligibleLoading && eligible.length === 0 && (
          <div className="bg-amber-50 border border-amber-200/50 text-amber-900 rounded-2xl p-4 text-xs font-semibold flex items-start gap-2.5 shadow-inner">
            <Info size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">No Certified Candidates Found</p>
              <p className="mt-0.5 text-gray-500 font-medium leading-relaxed">Ensure students have rendered all required OJT hours (e.g. 486 hours) and received a finalized evaluation grade under the Evaluations tab to qualify for certification.</p>
            </div>
          </div>
        )}

        {!eligibleLoading && eligible.length > 0 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <label className="label">Certified Student Candidate</label>
              <select 
                className="input bg-white w-full border-gray-250 hover:border-gray-450 focus:border-blue-900 font-semibold" 
                value={selectedStudent}
                onChange={e => setSelectedStudent(e.target.value)}
              >
                <option value="">-- Choose student candidate to view certificate --</option>
                {eligible.map(e => (
                  <option key={e.placement_id} value={e.placement_id}>
                    {e.student_name} ({e.student_number}) | {e.company} | Grade: {e.final_grade}
                  </option>
                ))}
              </select>
            </div>

            {/* High-Fidelity Printable Certificate Preview Mockup */}
            {selectedStudent && (() => {
              const s = eligible.find(e => e.placement_id === selectedStudent)
              if (!s) return null
              return (
                <div className="border-2 border-amber-250/30 rounded-3xl bg-amber-50/5 p-6 sm:p-10 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
                  {/* Decorative Frame Vectors */}
                  <div className="absolute inset-3 border border-dashed border-amber-300/30 rounded-2xl pointer-events-none" />
                  <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="text-center space-y-4 max-w-xl mx-auto relative z-10">
                    <div className="flex justify-center">
                      <Award size={48} className="text-amber-500 animate-pulse stroke-[1.5]" style={{ animationDuration: '4s' }} />
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/80">OJT Completion Registry</p>
                      <h4 className="text-lg font-black text-blue-950 uppercase tracking-wide">Certificate of Completion</h4>
                    </div>

                    <div className="border-t border-b border-amber-200/20 py-4 my-3 space-y-1">
                      <p className="text-xs text-gray-500 font-semibold italic">This digital certificate of accomplishment is issued to</p>
                      <p className="text-xl font-black text-gray-900 tracking-tight">{s.student_name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Student Number: {s.student_number} | {s.program} — Sec {s.section}</p>
                    </div>

                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      For having successfully completed and logged a total of <span className="font-extrabold text-blue-900">{s.rendered_hours}</span> hours out of the required <span className="font-extrabold text-blue-900">{s.required_hours}</span> training hours under their official industry placement at <span className="font-bold text-gray-800">{s.company}</span>, earning a compiled academic grade of <span className="font-black text-green-700 bg-green-50 px-2 py-0.5 border border-green-200 rounded">{s.final_grade}</span> during the Academic Term <span className="font-bold">{s.semester}</span> / AY {s.academic_year}.
                    </p>

                    {/* Verified Signature line */}
                    <div className="pt-4 flex justify-center">
                      <div className="border-t border-gray-300 w-48 pt-1.5 mt-2">
                        <p className="text-[9px] font-black uppercase tracking-wider text-blue-900">Campus OJT Coordinator</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase">System Verified Credential</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            <button 
              onClick={handleDownloadCertificate} 
              disabled={!selectedStudent || certDownloading}
              className="btn-primary w-full py-4 text-xs uppercase font-extrabold tracking-widest flex items-center justify-center gap-2 text-white cursor-pointer shadow-md shadow-blue-900/10"
            >
              <Download size={14} />
              {certDownloading ? 'Generating official PDF credential…' : 'Issue & Download PDF Certificate'}
            </button>
          </div>
        )}
      </div>

      {/* Historical Archives Database */}
      {archives.length > 0 && (
        <div className="bg-white border border-gray-150 rounded-3xl shadow-sm p-6 sm:p-8 overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-lg font-black text-blue-950 tracking-tight">Semester Archive Registries</h2>
          </div>
          
          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-inner bg-gray-50/10">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="bg-gradient-to-r from-blue-950 to-blue-900 text-white font-black text-[10px] uppercase tracking-wider">
                  <th className="px-5 py-4">Semester</th>
                  <th className="px-5 py-4">Academic Year</th>
                  <th className="px-5 py-4 text-center">Total Enrolled</th>
                  <th className="px-5 py-4 text-center">Completed OJT</th>
                  <th className="px-5 py-4 text-center">Incomplete</th>
                  <th className="px-5 py-4">Archived Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {archives.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/80 transition-colors duration-200 font-semibold text-xs text-gray-700">
                    <td className="px-5 py-4.5 font-extrabold text-blue-900">{a.semester}</td>
                    <td className="px-5 py-4.5">{a.academic_year}</td>
                    <td className="px-5 py-4.5 text-center">
                      <span className="bg-blue-50 text-blue-800 border border-blue-100/50 px-2.5 py-1 rounded-full text-[10px] font-bold">
                        {a.total} student{a.total !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-5 py-4.5 text-center text-green-700">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-2.5 py-1 rounded-full text-[10px] font-bold">
                        {a.summary?.completed || 0} completed
                      </span>
                    </td>
                    <td className="px-5 py-4.5 text-center text-red-600">
                      <span className="bg-rose-50 text-rose-800 border border-rose-100/50 px-2.5 py-1 rounded-full text-[10px] font-bold">
                        {a.summary?.not_completed || 0} incomplete
                      </span>
                    </td>
                    <td className="px-5 py-4.5">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Archive Warning & Parameters Modal */}
      {archiveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fadeIn">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl shadow-inner flex items-center justify-center flex-shrink-0">
                <Archive size={24} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-blue-950 mb-1">Archive Academic Semester</h3>
                <p className="text-xs text-gray-500 font-semibold">
                  Lock registry records and save to system history.
                </p>
              </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed font-semibold space-y-2 mb-6">
              <p className="font-bold flex items-center gap-1 text-[11px]">
                <Info size={14} className="text-slate-400" /> Confirm Archiving Target Parameters:
              </p>
              <div className="pl-4 border-l border-amber-300/40 text-gray-600 text-[11px] font-medium space-y-1">
                <p>• Semester: <strong className="text-gray-900">{semester}</strong></p>
                <p>• Academic Year: <strong className="text-gray-900">{academicYear}</strong></p>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold italic">
                Note: Once archived, active records for this term become historical and are marked as read-only. Aggregates and report download options remain permanently active in the section table.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button 
                onClick={() => archiveMut.mutate()} 
                disabled={archiveMut.isPending}
                className="btn-primary flex-1 py-3 text-xs uppercase font-extrabold tracking-wider text-white cursor-pointer"
              >
                {archiveMut.isPending ? 'Archiving Registry…' : 'Confirm Archive'}
              </button>
              <button 
                className="btn-secondary flex-1 py-3 text-xs uppercase font-extrabold tracking-wider cursor-pointer border-gray-200 text-gray-700 hover:bg-gray-50" 
                onClick={() => setArchiveModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Cohesive Premium StatCard Component ────────────
function PremiumStatCard({ icon: Icon, label, value, theme }) {
  const themes = {
    blue: {
      card: 'bg-gradient-to-br from-blue-50/40 via-white to-white border-blue-100 text-blue-900 shadow-blue-900/5 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5',
      icon: 'bg-slate-50 text-slate-400 border border-slate-100',
    },
    amber: {
      card: 'bg-gradient-to-br from-amber-50/40 via-white to-white border-amber-100 text-amber-955 shadow-amber-900/5 hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5',
      icon: 'bg-slate-50 text-slate-400 border border-slate-100',
    },
    green: {
      card: 'bg-gradient-to-br from-emerald-50/40 via-white to-white border-emerald-100 text-emerald-950 shadow-emerald-900/5 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5',
      icon: 'bg-slate-50 text-slate-400 border border-slate-100',
    },
    indigo: {
      card: 'bg-gradient-to-br from-indigo-50/40 via-white to-white border-indigo-100 text-indigo-955 shadow-indigo-900/5 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5',
      icon: 'bg-slate-50 text-slate-400 border border-slate-100',
    }
  }

  const selectedTheme = themes[theme] || themes.blue

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-300 flex items-center gap-4 bg-white shadow-sm ${selectedTheme.card}`}>
      <div className={`p-3 rounded-xl flex items-center justify-center shadow-inner ${selectedTheme.icon}`}>
        <Icon size={22} className="stroke-[2.2]" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-2xl font-black text-gray-900 mt-0.5 tracking-tight">{value}</p>
      </div>
    </div>
  )
}

