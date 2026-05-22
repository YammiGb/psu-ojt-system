import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportService } from '../../services'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  BarChart2, Download, FileText, Archive,
  Users, Building2, ScrollText, CheckCircle2, GraduationCap
} from 'lucide-react'

export default function CoordinatorReports() {
  const qc = useQueryClient()
  const [semester, setSemester]         = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [downloading, setDownloading]   = useState(false)
  const [archiveModal, setArchiveModal] = useState(false)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['report-overview', semester, academicYear],
    queryFn: () => reportService.overview({
      ...(semester     && { semester }),
      ...(academicYear && { academic_year: academicYear }),
    }).then(r => r.data),
  })

  const { data: archives = [] } = useQuery({
    queryKey: ['archives'],
    queryFn: () => reportService.archives().then(r => r.data),
  })

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
      toast.success('Excel report downloaded!')
    } catch {
      toast.error('Export failed')
    } finally {
      setDownloading(false)
    }
  }

  const archiveMut = useMutation({
    mutationFn: () => reportService.archive(semester, academicYear),
    onSuccess: () => {
      toast.success('Semester archived!')
      qc.invalidateQueries(['archives'])
      setArchiveModal(false)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Archive failed'),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <BarChart2 size={22} /> Reports & Analytics
      </h1>

      {/* Filters */}
      <div className="card">
        <p className="text-sm font-medium text-gray-600 mb-3">Filter by Semester</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Semester</label>
            <input className="input w-36" placeholder="e.g. 2024-1"
              value={semester} onChange={e => setSemester(e.target.value)} />
          </div>
          <div>
            <label className="label">Academic Year</label>
            <input className="input w-36" placeholder="e.g. 2024-2025"
              value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
          </div>
          <button onClick={() => { setSemester(''); setAcademicYear('') }}
            className="btn-secondary text-sm">Clear</button>
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? <LoadingSpinner /> : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}        label="Total Students"  value={stats.students?.total || 0}                           color="text-blue-600" />
          <StatCard icon={Building2}    label="Companies"       value={stats.companies?.total || 0}                          color="text-indigo-600" />
          <StatCard icon={CheckCircle2} label="Completed OJT"   value={stats.placements?.by_status?.completed || 0}          color="text-green-600" />
          <StatCard icon={ScrollText}   label="MOA Signed"      value={stats.moa?.by_status?.signed || 0}                    color="text-teal-600" />
        </div>
      )}

      {/* Placement breakdown */}
      {stats?.placements?.by_status && Object.keys(stats.placements.by_status).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Placement Status Breakdown</h2>
          <div className="space-y-2">
            {Object.entries(stats.placements.by_status).map(([status, count]) => {
              const total = stats.placements.total || 1
              const pct   = Math.round((count / total) * 100)
              const bar   = { active:'bg-blue-500', completed:'bg-green-500', not_completed:'bg-red-400', transferred:'bg-yellow-400', withdrawn:'bg-gray-400' }
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 capitalize">{status.replace('_',' ')}</span>
                    <span className="font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className={`h-full rounded-full ${bar[status] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* By program */}
      {stats?.students?.by_program && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Students by Program</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(stats.students.by_program).map(([prog, count]) => (
              <div key={prog} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-indigo-600">{count}</p>
                <p className="text-sm text-gray-500 mt-1">{prog}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Export</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExcel} disabled={downloading}
            className="btn-primary flex items-center gap-2">
            <Download size={16} />
            {downloading ? 'Generating…' : 'Download Excel Summary'}
          </button>
          <button onClick={() => {
            if (!semester || !academicYear) return toast.error('Set semester and academic year first')
            setArchiveModal(true)
          }} className="btn-secondary flex items-center gap-2">
            <Archive size={16} /> Archive Semester
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Excel includes all students, hours rendered, and final grades.
          {semester && ` Filtered to Semester ${semester}.`}
        </p>
      </div>

      {/* Certificate */}
      <CertificateSection semester={semester} academicYear={academicYear} />

      {/* Archives table */}
      {archives.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Archive size={18} /> Semester Archives
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
              <tr>
                {['Semester','Academic Year','Total','Completed','Not Completed','Archived On'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {archives.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.semester}</td>
                  <td className="px-4 py-3">{a.academic_year}</td>
                  <td className="px-4 py-3">{a.total}</td>
                  <td className="px-4 py-3 text-green-600">{a.summary?.completed || 0}</td>
                  <td className="px-4 py-3 text-red-500">{a.summary?.not_completed || 0}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Archive modal */}
      {archiveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-2">Archive Semester</h3>
            <p className="text-sm text-gray-500 mb-4">
              Archive all records for <strong>{semester}</strong> / <strong>{academicYear}</strong>.
              Records remain accessible but are marked as archived.
            </p>
            <div className="flex gap-3">
              <button onClick={() => archiveMut.mutate()} className="btn-primary"
                disabled={archiveMut.isPending}>
                {archiveMut.isPending ? 'Archiving…' : 'Confirm Archive'}
              </button>
              <button className="btn-secondary" onClick={() => setArchiveModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Certificate: dropdown of eligible students ────────────
function CertificateSection({ semester, academicYear }) {
  const [selected, setSelected] = useState('')
  const [loading, setLoading]   = useState(false)

  const { data: eligible = [], isLoading } = useQuery({
    queryKey: ['eligible-cert', semester, academicYear],
    queryFn: () => reportService.eligibleStudents({
      ...(semester     && { semester }),
      ...(academicYear && { academic_year: academicYear }),
    }).then(r => r.data),
  })

  const handleDownload = async () => {
    if (!selected) return toast.error('Select a student first')
    setLoading(true)
    try {
      const res  = await reportService.certificate(selected)
      const item = eligible.find(e => e.placement_id === selected)
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `OJT_Certificate_${item?.student_number || selected}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Certificate downloaded!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate certificate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <GraduationCap size={18} /> Completion Certificate (PDF)
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        Only students who have completed all required hours AND have a final grade appear here.
      </p>

      {isLoading && <p className="text-sm text-gray-400">Loading eligible students…</p>}

      {!isLoading && eligible.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
          No students are eligible yet. Students need completed hours and a final grade.
        </div>
      )}

      {eligible.length > 0 && (
        <div className="space-y-3">
          <select className="input" value={selected}
            onChange={e => setSelected(e.target.value)}>
            <option value="">-- Select a student --</option>
            {eligible.map(e => (
              <option key={e.placement_id} value={e.placement_id}>
                {e.student_name} — {e.student_number} | {e.company} | Grade: {e.final_grade}
              </option>
            ))}
          </select>

          {/* Preview card */}
          {selected && (() => {
            const s = eligible.find(e => e.placement_id === selected)
            return s ? (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm">
                <div className="grid grid-cols-2 gap-1 text-gray-700">
                  <span className="text-gray-400">Student:</span>    <span className="font-medium">{s.student_name}</span>
                  <span className="text-gray-400">Program:</span>    <span>{s.program} — Section {s.section}</span>
                  <span className="text-gray-400">Company:</span>    <span>{s.company}</span>
                  <span className="text-gray-400">Hours:</span>      <span>{s.rendered_hours} / {s.required_hours} hrs</span>
                  <span className="text-gray-400">Final Grade:</span><span className="font-bold text-green-600">{s.final_grade}</span>
                  <span className="text-gray-400">Semester:</span>   <span>{s.semester} | AY {s.academic_year}</span>
                </div>
              </div>
            ) : null
          })()}

          <button onClick={handleDownload} disabled={!selected || loading}
            className="btn-primary flex items-center gap-2">
            <Download size={15} />
            {loading ? 'Generating PDF…' : 'Download Certificate'}
          </button>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card text-center py-5">
      <Icon size={26} className={`mx-auto mb-2 ${color}`} />
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}
