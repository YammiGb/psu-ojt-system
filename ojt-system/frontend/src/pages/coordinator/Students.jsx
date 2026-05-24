import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentService } from '../../services'
import toast from 'react-hot-toast'
import { GraduationCap, Filter, Edit2, ShieldCheck, X, AlertTriangle, ShieldAlert, Award, Search, Users, RotateCcw } from 'lucide-react'

const PROGRAMS = ['IT', 'ABEL', 'Engineering', 'Other']
const ENROLLMENT_STATUSES = ['enrolled', 'not_enrolled', 'irregular', 'loa']

const STATUS_COLORS = {
  enrolled:     'bg-green-50 text-green-700 border border-green-200/50',
  not_enrolled: 'bg-rose-50 text-rose-800 border border-rose-200/50',
  irregular:    'bg-amber-50 text-amber-800 border border-amber-200/50',
  loa:          'bg-gray-50 text-gray-600 border border-gray-200/50',
}

const STATUS_LABELS = {
  enrolled: 'Enrolled',
  not_enrolled: 'Not Enrolled',
  irregular: 'Irregular',
  loa: 'Leave of Absence',
}

export default function Students() {
  const qc = useQueryClient()
  // API-level filters (sent to backend)
  const [apiFilters, setApiFilters] = useState({ program: '', enrollment_status: '' })
  // Client-side filters (applied after data is fetched)
  const [searchText, setSearchText] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')

  const [editId, setEditId]   = useState(null)
  const [editForm, setEditForm] = useState({})
  const [eligResult, setEligResult] = useState(null)
  const [checkingId, setCheckingId] = useState(null)

  // Only send non-empty API filters to the backend
  const params = Object.fromEntries(Object.entries(apiFilters).filter(([, v]) => v !== ''))

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', apiFilters],
    queryFn: () => studentService.list(params).then(r => r.data),
  })

  // Client-side filtering for search text and section
  const filteredStudents = useMemo(() => {
    let result = students

    // Section filter (case-insensitive partial match)
    if (sectionFilter.trim()) {
      const sec = sectionFilter.trim().toLowerCase()
      result = result.filter(s => s.section && s.section.toLowerCase().includes(sec))
    }

    // Text search (name, email, student number — case-insensitive)
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase()
      result = result.filter(s => {
        const name = (s.users?.full_name || '').toLowerCase()
        const email = (s.users?.email || '').toLowerCase()
        const studentNum = (s.student_number || '').toLowerCase()
        return name.includes(q) || email.includes(q) || studentNum.includes(q)
      })
    }

    return result
  }, [students, searchText, sectionFilter])

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => studentService.update(id, data),
    onSuccess: () => {
      toast.success('Student updated!')
      qc.invalidateQueries(['students'])
      setEditId(null)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update student profile'),
  })

  const checkEligibility = async (studentId) => {
    setCheckingId(studentId)
    try {
      const { data } = await studentService.eligibility(studentId)
      setEligResult({ id: studentId, ...data })
    } catch (e) {
      toast.error('Failed to check eligibility')
    } finally {
      setCheckingId(null)
    }
  }

  const openEdit = (s) => {
    setEditForm({
      student_number:         s.student_number,
      program:                s.program,
      section:                s.section || '',
      year_level:             s.year_level || '',
      enrollment_status:      s.enrollment_status,
      has_disqualifying_grade: s.has_disqualifying_grade,
      gpa:                    s.gpa || '',
    })
    setEditId(s.id)
  }

  const setE = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setEditForm({ ...editForm, [k]: val })
  }

  const hasActiveFilters = searchText || sectionFilter || apiFilters.program || apiFilters.enrollment_status

  const clearAllFilters = () => {
    setSearchText('')
    setSectionFilter('')
    setApiFilters({ program: '', enrollment_status: '' })
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">
            Student OJT Directory
          </h1>
          <p className="text-gray-400 font-medium text-xs lg:text-sm mt-1.5">
            Monitor student enrollment statuses, update academic program tracks, manage sections, and audit real-time OJT eligibility logs.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-3 py-1.5 rounded-xl border border-blue-100">
            <Users size={13} />
            <span>{students.length} Total</span>
          </div>
          {hasActiveFilters && (
            <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-100">
              {filteredStudents.length} Matching
            </div>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-gray-150 rounded-3xl shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-5 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              className="w-full border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 bg-white placeholder:text-gray-500 placeholder:font-semibold"
              placeholder="Search by student name, email, or student number…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="px-5 py-4 bg-gray-50/50">
          <div className="flex items-center gap-2 text-[10px] font-black text-blue-950 uppercase tracking-widest mb-3">
            <Filter size={12} className="text-amber-500" />
            Directory Filters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Section</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                placeholder="e.g. A, B, C…"
                value={sectionFilter}
                onChange={e => setSectionFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Academic Program</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                value={apiFilters.program}
                onChange={e => setApiFilters({ ...apiFilters, program: e.target.value })}>
                <option value="">All Programs</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Enrollment Status</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                value={apiFilters.enrollment_status}
                onChange={e => setApiFilters({ ...apiFilters, enrollment_status: e.target.value })}>
                <option value="">All Statuses</option>
                {ENROLLMENT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end pt-3">
              <button onClick={clearAllFilters}
                className="text-[10px] font-black uppercase tracking-wider text-amber-600 hover:text-amber-700 flex items-center gap-1.5 cursor-pointer hover:underline transition-all">
                <RotateCcw size={10} /> Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Eligibility result */}
      {eligResult && (
        <div className={`rounded-3xl border p-5 shadow-sm transition-all duration-300 ${
          eligResult.is_eligible 
            ? 'bg-emerald-50/60 border-emerald-200/50 text-emerald-800' 
            : 'bg-rose-50/60 border-rose-200/50 text-rose-800'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className={`p-2 rounded-xl flex-shrink-0 flex items-center justify-center ${
                eligResult.is_eligible ? 'bg-emerald-100/80 text-emerald-600' : 'bg-rose-100/80 text-rose-600'
              }`}>
                {eligResult.is_eligible ? <Award size={20} className="stroke-[2.5]" /> : <ShieldAlert size={20} className="stroke-[2.5]" />}
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-wide">
                  {eligResult.is_eligible ? 'Student is Eligible for OJT Placement' : 'Student is Not Eligible for OJT Placement'}
                </p>
                {eligResult.issues?.length > 0 && (
                  <ul className="mt-2 text-xs font-semibold space-y-1.5 list-disc list-inside opacity-90">
                    {eligResult.issues.map((issue, i) => <li key={i} className="leading-relaxed">{issue}</li>)}
                  </ul>
                )}
                {eligResult.is_eligible && (
                  <p className="text-xs font-semibold mt-1.5 opacity-90 leading-relaxed">{eligResult.message}</p>
                )}
              </div>
            </div>
            <button 
              onClick={() => setEligResult(null)} 
              className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer text-gray-400 hover:text-gray-600 self-start"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Table view */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-3xl border border-gray-150 shadow-md">
          <GraduationCap size={48} className="mx-auto mb-3 opacity-20 text-blue-950" />
          <p className="text-base font-bold text-gray-700">
            {hasActiveFilters ? 'No students match your filters' : 'No registered students found'}
          </p>
          <p className="text-sm mt-1 text-gray-400">
            {hasActiveFilters
              ? 'Try adjusting your search term or removing some filter constraints.'
              : 'Students appear in this directory once they register their accounts as students.'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearAllFilters}
              className="mt-4 text-xs font-black uppercase tracking-wider text-blue-800 hover:text-blue-950 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 cursor-pointer transition-all inline-flex items-center gap-1.5">
              <RotateCcw size={12} /> Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-150 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-blue-950 text-white text-[10px] uppercase font-black tracking-widest border-b border-blue-900">
                <tr>
                  {['Name / Email', 'Student No.', 'Program', 'Section', 'Year', 'Enrollment Status', 'GPA', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-left font-black tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-blue-800 flex items-center justify-center font-black text-xs shadow-inner uppercase flex-shrink-0 border border-blue-200/50">
                          {s.users?.full_name?.substring(0, 2) || 'ST'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-blue-950 text-sm tracking-tight truncate" title={s.users?.full_name}>{s.users?.full_name}</p>
                          <p className="text-[11px] text-gray-400 font-semibold mt-0.5 truncate" title={s.users?.email}>{s.users?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-gray-600 text-xs tracking-wider font-mono">{s.student_number}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-blue-50/80 border border-blue-100 text-blue-800 px-2.5 py-1 rounded-lg text-[11px] font-extrabold">
                        {s.program}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-extrabold text-gray-700 text-xs tracking-wider">{s.section || '—'}</td>
                    <td className="px-5 py-4 font-bold text-gray-600 text-xs tracking-wider">{s.year_level || '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-sm ${STATUS_COLORS[s.enrollment_status] || 'bg-gray-50 text-gray-600'}`}>
                          {STATUS_LABELS[s.enrollment_status] || s.enrollment_status?.replace('_', ' ')}
                        </span>
                        {s.has_disqualifying_grade && (
                          <span className="text-[10px] px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-black uppercase tracking-wider shadow-sm flex items-center gap-1 border border-rose-200">
                            <AlertTriangle size={10} /> Disqualified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-black text-gray-900 text-xs">{s.gpa ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)}
                          className="text-[10px] font-black uppercase tracking-wider border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 text-gray-700 cursor-pointer flex items-center gap-1 transition-all">
                          <Edit2 size={10} /> Edit
                        </button>
                        <button
                          onClick={() => checkEligibility(s.id)}
                          disabled={checkingId === s.id}
                          className="text-[10px] font-black uppercase tracking-wider border border-blue-300 px-3 py-1.5 rounded-xl hover:bg-blue-50 text-blue-800 disabled:opacity-50 cursor-pointer flex items-center gap-1 transition-all">
                          <ShieldCheck size={10} /> {checkingId === s.id ? 'Checking…' : 'Eligibility'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Showing {filteredStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
            </span>
            {hasActiveFilters && (
              <button onClick={clearAllFilters}
                className="text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer transition-all">
                <RotateCcw size={10} /> Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Edit Modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 px-6 py-5 flex items-center justify-between text-white border-b border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Edit2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    Edit Student Records
                  </h2>
                  <p className="text-blue-200 text-[10px] sm:text-xs font-medium mt-0.5">
                    Modify academic standings, tracks, and GPA parameters
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditId(null)}
                className="p-2 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Student Number</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    value={editForm.student_number} onChange={setE('student_number')} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Program</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    value={editForm.program} onChange={setE('program')}>
                    {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Section</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    value={editForm.section} onChange={setE('section')} placeholder="e.g. A" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Year Level</label>
                  <input type="number" min="1" max="5"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    value={editForm.year_level} onChange={setE('year_level')} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Enrollment Status</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    value={editForm.enrollment_status} onChange={setE('enrollment_status')}>
                    {ENROLLMENT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">GPA</label>
                  <input type="number" step="0.01" min="0" max="5"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    value={editForm.gpa} onChange={setE('gpa')} />
                </div>
                <div className="sm:col-span-2 flex items-center py-3.5 px-4 bg-rose-50/50 border border-rose-100 rounded-2xl">
                  <label className="flex items-center gap-3 text-xs font-bold text-rose-800 cursor-pointer select-none">
                    <input type="checkbox"
                      checked={editForm.has_disqualifying_grade}
                      onChange={setE('has_disqualifying_grade')}
                      className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500 cursor-pointer" />
                    Student has disqualifying grade (Failed Subject)
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
              <button onClick={() => setEditId(null)}
                className="border border-gray-300 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-all duration-200">
                Cancel
              </button>
              <button
                onClick={() => updateMut.mutate({ id: editId, data: editForm })}
                disabled={updateMut.isPending}
                className="bg-blue-900 text-white hover:bg-blue-950 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-blue-900/10 active:scale-95 disabled:opacity-50">
                {updateMut.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
