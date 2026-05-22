import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Info } from 'lucide-react'

// Only self-registerable roles
const PUBLIC_ROLES = ['student', 'supervisor']

const ROLE_REDIRECT = {
  student:     '/student',
  supervisor:  '/supervisor',
}

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', role: 'student',
    student_number: '', section: '',
  })
  const [loading, setLoading] = useState(false)

  const isStudent    = form.role === 'student'
  const isSupervisor = form.role === 'supervisor'

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await register(form)
      toast.success('Account created!')
      navigate(ROLE_REDIRECT[user.role] || '/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">OJT System</h1>
        <p className="text-gray-500 text-sm mb-6">Create your account</p>

        <form onSubmit={handle} className="space-y-4">

          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              {PUBLIC_ROLES.map(r => (
                <label key={r} className={`border rounded-lg px-4 py-3 cursor-pointer text-sm font-medium text-center transition-colors ${
                  form.role === r
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                  <input type="radio" className="sr-only" value={r}
                    checked={form.role === r}
                    onChange={() => setForm({ ...form, role: r })} />
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Coordinator and admin accounts are created by the system administrator.
            </p>
          </div>

          {/* Supervisor hint */}
          {isSupervisor && (
            <div className="flex gap-2 bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-800">
              <Info size={16} className="flex-shrink-0 mt-0.5 text-teal-500" />
              <p>
                <strong>Important:</strong> Use the same email address that the OJT Coordinator
                entered as your company's <strong>contact email</strong>. This links your account
                to your company automatically.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.full_name} onChange={set('full_name')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
              {isSupervisor && (
                <span className="ml-1 text-xs text-teal-600 font-normal">
                  — must match your company's contact email
                </span>
              )}
            </label>
            <input type="email" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email} onChange={set('email')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minimum 6 characters"
              value={form.password} onChange={set('password')} />
          </div>

          {/* Student-only fields */}
          {isStudent && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Student Info
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Number
                  <span className="ml-1 text-xs text-gray-400">(optional — verify later)</span>
                </label>
                <input type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 2021-00123"
                  value={form.student_number} onChange={set('student_number')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. A, B, C"
                  value={form.section} onChange={set('section')} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 mt-2">
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
