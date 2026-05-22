import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentService } from '../../services'
import toast from 'react-hot-toast'

const PROGRAMS = ['IT', 'ABEL', 'Engineering', 'Other']
const ENROLLMENT_STATUSES = ['enrolled', 'not_enrolled', 'irregular', 'loa']

const STATUS_COLORS = {
  enrolled:     'bg-green-100 text-green-700',
  not_enrolled: 'bg-red-100 text-red-700',
  irregular:    'bg-yellow-100 text-yellow-700',
  loa:          'bg-gray-100 text-gray-600',
}

export default function Students() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ section: '', program: '', enrollment_status: '' })
  const [editId, setEditId]   = useState(null)
  const [editForm, setEditForm] = useState({})
  const [eligResult, setEligResult] = useState(null)
  const [checkingId, setCheckingId] = useState(null)

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', filters],
    queryFn: () => studentService.list(params).then(r => r.data),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => studentService.update(id, data),
    onSuccess: () => {
      toast.success('Student updated!')
      qc.invalidateQueries(['students'])
      setEditId(null)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      <h1 className="text-2xl font-bold text-gray-800">Students</h1>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
          <input
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
            placeholder="A, B, C…"
            value={filters.section}
            onChange={e => setFilters({ ...filters, section: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Program</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.program}
            onChange={e => setFilters({ ...filters, program: e.target.value })}>
            <option value="">All</option>
            {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Enrollment Status</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.enrollment_status}
            onChange={e => setFilters({ ...filters, enrollment_status: e.target.value })}>
            <option value="">All</option>
            {ENROLLMENT_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={() => setFilters({ section: '', program: '', enrollment_status: '' })}
            className="text-sm text-gray-500 hover:text-gray-700 underline">
            Clear
          </button>
        </div>
      </div>

      {/* Eligibility result */}
      {eligResult && (
        <div className={`rounded-2xl border p-4 ${eligResult.is_eligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-semibold ${eligResult.is_eligible ? 'text-green-800' : 'text-red-800'}`}>
                {eligResult.is_eligible ? '✅ Student is Eligible for OJT' : '❌ Student is Not Eligible'}
              </p>
              {eligResult.issues?.length > 0 && (
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {eligResult.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                </ul>
              )}
              {eligResult.is_eligible && (
                <p className="text-sm text-green-700 mt-1">{eligResult.message}</p>
              )}
            </div>
            <button onClick={() => setEligResult(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-10">Loading…</div>
      ) : students.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-lg">No students found.</p>
          <p className="text-sm mt-1">Students appear here after they register with the "student" role.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                {['Name', 'Student No.', 'Program', 'Section', 'Year', 'Status', 'GPA', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map(s => (
                <>
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{s.users?.full_name}</p>
                      <p className="text-xs text-gray-400">{s.users?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.student_number}</td>
                    <td className="px-4 py-3 text-gray-600">{s.program}</td>
                    <td className="px-4 py-3 text-gray-600">{s.section || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.year_level || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[s.enrollment_status] || 'bg-gray-100 text-gray-600'}`}>
                        {s.enrollment_status?.replace('_', ' ')}
                      </span>
                      {s.has_disqualifying_grade && (
                        <span className="ml-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                          Disqualified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.gpa ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)}
                          className="text-xs border border-gray-300 px-2.5 py-1 rounded-lg hover:bg-gray-50 text-gray-700">
                          Edit
                        </button>
                        <button
                          onClick={() => checkEligibility(s.id)}
                          disabled={checkingId === s.id}
                          className="text-xs border border-blue-300 px-2.5 py-1 rounded-lg hover:bg-blue-50 text-blue-700 disabled:opacity-50">
                          {checkingId === s.id ? '…' : 'Eligibility'}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline edit row */}
                  {editId === s.id && (
                    <tr key={`edit-${s.id}`} className="bg-blue-50">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Student Number</label>
                            <input className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={editForm.student_number} onChange={setE('student_number')} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Program</label>
                            <select className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={editForm.program} onChange={setE('program')}>
                              {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
                            <input className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={editForm.section} onChange={setE('section')} placeholder="e.g. A" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Year Level</label>
                            <input type="number" min="1" max="5"
                              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={editForm.year_level} onChange={setE('year_level')} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Enrollment Status</label>
                            <select className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={editForm.enrollment_status} onChange={setE('enrollment_status')}>
                              {ENROLLMENT_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">GPA</label>
                            <input type="number" step="0.01" min="0" max="5"
                              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={editForm.gpa} onChange={setE('gpa')} />
                          </div>
                          <div className="flex items-end gap-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                              <input type="checkbox"
                                checked={editForm.has_disqualifying_grade}
                                onChange={setE('has_disqualifying_grade')}
                                className="w-4 h-4 rounded" />
                              Disqualifying Grade
                            </label>
                          </div>
                          <div className="flex items-end gap-2">
                            <button
                              onClick={() => updateMut.mutate({ id: s.id, data: editForm })}
                              disabled={updateMut.isPending}
                              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                              {updateMut.isPending ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => setEditId(null)}
                              className="border border-gray-300 px-4 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-white">
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {students.length} student{students.length !== 1 ? 's' : ''} found
          </div>
        </div>
      )}
    </div>
  )
}
