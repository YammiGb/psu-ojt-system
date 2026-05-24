import { useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { BookOpen, Award, AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react'

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
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/40 p-6 sm:p-8 flex flex-col justify-between">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100/60">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-blue-950">
            PSU Portal —{' '}
            {isVerified
              ? student.has_disqualifying_grade
                ? 'Not Eligible for OJT'
                : 'Eligible for OJT'
              : 'Not Verified'}
          </h2>
          <p className="text-gray-400 text-xs lg:text-sm mt-0.5">
            {isVerified
              ? `Verified on ${new Date(student.portal_verified_at).toLocaleDateString()}`
              : 'Connect to PSU portal to verify OJT eligibility'}
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className={`text-xs lg:text-sm px-5 py-2.5 rounded-xl font-bold flex-shrink-0 transition-all cursor-pointer ${
              isVerified
                ? 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 shadow-sm'
                : 'bg-blue-800 text-white hover:bg-blue-950 hover:shadow-lg hover:shadow-blue-800/10'
            }`}>
            {isVerified ? 'Re-verify' : 'Connect Portal'}
          </button>
        )}
      </div>

      {/* Stats grid */}
      {isVerified && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-5">
          {[
            { 
              label: 'Total Subjects', 
              value: student.total_subjects || 0, 
              color: 'text-gray-900',
              icon: BookOpen,
              iconBg: 'bg-blue-50 text-blue-600'
            },
            { 
              label: 'Passed', 
              value: student.passed_subjects || 0, 
              color: 'text-green-600',
              icon: Award,
              iconBg: 'bg-green-50 text-green-600'
            },
            { 
              label: 'Failed / INC', 
              value: student.failed_subjects?.length || 0, 
              color: student.failed_subjects?.length > 0 ? 'text-red-600' : 'text-gray-400',
              icon: AlertTriangle,
              iconBg: student.failed_subjects?.length > 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'
            },
            { 
              label: 'GPA', 
              value: student.gpa ?? '—', 
              color: 'text-blue-700',
              icon: TrendingUp,
              iconBg: 'bg-blue-50 text-blue-600'
            },
            {
              label: 'OJT Eligible',
              value: student.has_disqualifying_grade ? 'NO' : 'YES',
              color: student.has_disqualifying_grade ? 'text-red-600' : 'text-green-700',
              icon: ShieldCheck,
              iconBg: student.has_disqualifying_grade ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
            },
          ].map(({ label, value, color, icon: Icon, iconBg }) => (
            <div 
              key={label} 
              className="bg-white rounded-2xl p-4 sm:p-4.5 text-center border border-gray-100/80 shadow-md hover:shadow-xl hover:border-gray-200 transition-all duration-300 flex flex-col items-center justify-center min-h-[110px] relative overflow-hidden group hover:-translate-y-1"
            >
              <div className={`p-2.5 rounded-xl ${iconBg} mb-2.5 transition-all duration-300 shadow-sm flex items-center justify-center`}>
                <Icon size={20} />
              </div>
              <p className={`text-lg sm:text-xl font-black tracking-tight ${color}`}>{value}</p>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Failed subjects */}
      {isVerified && student.failed_subjects?.length > 0 && (
        <div className="mt-5 bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-red-800 mb-3 uppercase tracking-wider">Failed / Incomplete Subjects:</p>
          <div className="flex flex-wrap gap-2">
            {student.failed_subjects.map((s, i) => (
              <span key={i} className="text-xs bg-red-100/80 text-red-800 border border-red-200/50 px-3 py-1.5 rounded-full font-extrabold shadow-sm">
                {s.code}{s.grade ? ` — ${s.grade}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {isVerified && student.eligibility_notes && (
        <div className="mt-5 bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-xs lg:text-sm font-black text-blue-950 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
            Notice
          </p>
          <p className="text-sm lg:text-[15px] font-semibold text-gray-600 leading-relaxed">
            {student.eligibility_notes}
          </p>
        </div>
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
