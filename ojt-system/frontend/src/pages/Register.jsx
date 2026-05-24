import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, GraduationCap, CheckCircle2, User, Hash, Bookmark, Info, ShieldCheck } from 'lucide-react'

// Import images
import psuLogo from '../../img/psu_logo.png'
import psuBg from '../../img/psuSchool_bg.jpg'

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
  const [showPassword, setShowPassword] = useState(false)

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
    <div className="min-h-screen flex font-sans bg-gray-50">
      {/* Left side - Branding & Image Backdrop (Visible only on Desktop) */}
      <div 
        className="hidden lg:flex lg:w-3/5 relative bg-cover bg-center items-center justify-center overflow-hidden"
        style={{ backgroundImage: `url(${psuBg})` }}
      >
        {/* Deep rich overlay with PSU Brand Colors (Navy Blue gradient to deep Gold/Amber) */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/90 to-amber-950/80 backdrop-blur-[2px]" />
        
        {/* Decorative elements */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

        {/* Content Panel */}
        <div className="relative z-10 max-w-lg px-8 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <GraduationCap className="w-4 h-4" />
            Pangasinan State University
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">
            Join the PSU OJT <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
              Monitoring System
            </span>
          </h1>
          
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            Create an account to start your training journey, record your DTR log, submit weekly reports, or monitor evaluations directly in a streamlined workflow.
          </p>

          {/* Feature Highlights */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-amber-500/20 rounded-full border border-amber-400/30">
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Quick Student Enrollment</h4>
                <p className="text-sm text-blue-200/90">Instantly sign up to submit eligibility documents and track assignments.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-amber-500/20 rounded-full border border-amber-400/30">
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Industry Supervisor Access</h4>
                <p className="text-sm text-blue-200/90">Register using your company email to access the evaluation tools for your assigned interns.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-amber-500/20 rounded-full border border-amber-400/30">
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Digital MOA & Compliance</h4>
                <p className="text-sm text-blue-200/90">Automated tracking for Memorandum of Agreement status and company placement matching.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-blue-800/60 text-xs text-blue-300/80">
            Empowering PSU Students for a Global Future. © {new Date().getFullYear()} Pangasinan State University.
          </div>
        </div>
      </div>

      {/* Right side - Register Panel */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Background Image for Mobile only */}
        <div 
          className="absolute inset-0 bg-cover bg-center lg:hidden"
          style={{ backgroundImage: `url(${psuBg})` }}
        />
        {/* Mobile Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/90 to-amber-950/90 lg:hidden" />

        {/* Form container */}
        <div className="relative z-10 w-full max-w-lg bg-white/95 lg:bg-white p-8 sm:p-10 rounded-2xl lg:rounded-none shadow-2xl lg:shadow-none border border-gray-100 lg:border-none backdrop-blur-sm lg:backdrop-blur-none transition-all duration-300 my-4">
          
          {/* Logo and Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-amber-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <img 
                src={psuLogo} 
                alt="PSU Logo" 
                className="relative w-24 h-24 sm:w-28 sm:h-28 object-contain transition-transform duration-300 group-hover:scale-105" 
              />
            </div>
            <h2 className="text-2xl font-extrabold text-blue-900 text-center tracking-tight">
              CREATE AN ACCOUNT
            </h2>
            <p className="text-gray-500 lg:text-gray-400 text-sm mt-1.5 text-center font-medium">
              Join the OJT Portal to begin
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handle} className="space-y-5">
            
            {/* Role selector */}
            <div>
              <label className="block text-sm font-bold text-blue-900/80 uppercase tracking-wider mb-2">
                I am registering as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PUBLIC_ROLES.map(r => {
                  const active = form.role === r
                  return (
                    <label key={r} className={`border rounded-xl px-4 py-3 cursor-pointer text-sm font-semibold text-center transition-all flex items-center justify-center gap-1.5 ${
                      active
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-100 shadow-sm'
                        : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50/50 hover:border-gray-300'
                    }`}>
                      <input type="radio" className="sr-only" value={r}
                        checked={form.role === r}
                        onChange={() => setForm({ ...form, role: r })} />
                      {active && <ShieldCheck className="w-4 h-4 text-blue-600" />}
                      <span>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2 italic">
                *Coordinator and admin accounts must be created by the system administrator.
              </p>
            </div>

            {/* Supervisor hint */}
            {isSupervisor && (
              <div className="flex gap-2.5 bg-amber-50/50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 leading-relaxed shadow-sm">
                <Info size={18} className="flex-shrink-0 mt-0.5 text-amber-600" />
                <p>
                  <strong>Important:</strong> Please use the exact email address registered by the 
                  OJT Coordinator as your company's <strong>contact email</strong>. This links your account 
                  to your organization automatically.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-blue-900/80 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text" 
                  required
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all text-gray-800 text-base"
                  value={form.full_name} 
                  onChange={set('full_name')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-blue-900/80 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email" 
                  required
                  placeholder={isSupervisor ? "company@email.com" : "name@psu.edu.ph"}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all text-gray-800 text-base"
                  value={form.email} 
                  onChange={set('email')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-blue-900/80 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"} 
                  required 
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-11 pr-11 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all text-gray-800 text-base"
                  value={form.password} 
                  onChange={set('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Student-only fields */}
            {isStudent && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Academic Information
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-blue-900/80 uppercase tracking-wider mb-1.5">
                      Student No. <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                        <Hash className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="2021-00123"
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all text-gray-800 text-sm"
                        value={form.student_number} 
                        onChange={set('student_number')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-blue-900/80 uppercase tracking-wider mb-1.5">
                      Section
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                        <Bookmark className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. A, B, C"
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all text-gray-800 text-sm"
                        value={form.section} 
                        onChange={set('section')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-800 to-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-800/20 hover:shadow-xl hover:shadow-blue-800/30 hover:from-blue-700 hover:to-blue-600 active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100 disabled:pointer-events-none transition-all duration-200 text-base mt-3 flex items-center justify-center cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creating Account...</span>
                </div>
              ) : 'Create Account'}
            </button>
          </form>

          {/* Footer register link */}
          <div className="mt-6 text-center text-base">
            <span className="text-gray-500">Have an account? </span>
            <Link to="/login" className="text-amber-600 hover:text-amber-700 font-bold hover:underline transition-colors">
              Sign In
            </Link>
          </div>

          <div className="mt-8 text-center lg:hidden">
            <p className="text-xs text-gray-400 font-medium">
              © {new Date().getFullYear()} Pangasinan State University OJT.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
