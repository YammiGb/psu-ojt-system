import { useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function PortalVerifyWidget({ student, onVerified }) {
  const [form, setForm]       = useState({ student_number: student?.student_number || '', portal_password: '' })
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const isVerified = student?.portal_verified

  const verify = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-portal', form)
      toast.success('Portal verified!')
      setShowForm(false)
      if (onVerified) onVerified(data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`rounded-2xl border-2 p-5 ${
      isVerified
        ? student.has_disqualifying_grade
          ? 'border-red-200 bg-red-50'
          : 'border-green-200 bg-green-50'
        : 'border-yellow-200 bg-yellow-50'
    }`}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {isVerified ? (student.has_disqualifying_grade ? '❌' : '✅') : '⚠️'}
          </span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">
              PSU Portal —{' '}
              {isVerified
                ? student.has_disqualifying_grade
                  ? 'Not Eligible for OJT'
                  : 'Eligible for OJT'
                : 'Not Verified'}
            </p>
            <p className="text-xs text-gray-500">
              {isVerified
                ? `Verified ${new Date(student.portal_verified_at).toLocaleDateString()}`
                : 'Connect to PSU portal to verify OJT eligibility'}
            </p>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className={`text-sm px-4 py-1.5 rounded-lg font-medium flex-shrink-0 ${
              isVerified
                ? 'border border-gray-300 text-gray-600 hover:bg-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
            {isVerified ? 'Re-verify' : 'Connect Portal'}
          </button>
        )}
      </div>

      {/* Stats grid */}
      {isVerified && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
          {[
            { label: 'Total Subjects', value: student.total_subjects || 0, color: 'text-gray-800' },
            { label: 'Passed',         value: student.passed_subjects || 0, color: 'text-green-600' },
            { label: 'Failed / INC',   value: student.failed_subjects?.length || 0, color: 'text-red-500' },
            { label: 'GPA',            value: student.gpa ?? '—', color: 'text-blue-600' },
            {
              label: 'OJT Eligible',
              value: student.has_disqualifying_grade ? 'NO' : 'YES',
              color: student.has_disqualifying_grade ? 'text-red-600' : 'text-green-700',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-2 text-center border border-gray-100">
              <p className={`text-lg font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Failed subjects */}
      {isVerified && student.failed_subjects?.length > 0 && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-red-700 mb-2">Failed / Incomplete:</p>
          <div className="flex flex-wrap gap-1.5">
            {student.failed_subjects.map((s, i) => (
              <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                {s.code}{s.grade ? ` — ${s.grade}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {isVerified && student.eligibility_notes && (
        <p className="text-xs text-gray-500 mt-2 italic">{student.eligibility_notes}</p>
      )}

      {/* Verify form */}
      {showForm && (
        <form onSubmit={verify} className="mt-4 space-y-3 border-t border-gray-200 pt-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">PSU Portal Credentials</p>
            <p className="text-xs text-gray-400 mb-3">
              🔒 Your portal password is used once for verification and is <strong>never stored</strong>.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Student Number</label>
            <input type="text" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 2021-00123"
              value={form.student_number}
              onChange={e => setForm({ ...form, student_number: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Portal Password</label>
            <input type="password" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your campus portal password"
              value={form.portal_password}
              onChange={e => setForm({ ...form, portal_password: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2">
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                  Verifying…
                </>
              ) : 'Verify Now'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
