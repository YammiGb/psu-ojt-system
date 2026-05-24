import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, GraduationCap, CheckCircle2 } from 'lucide-react'

// Import images
import psuLogo from '../../img/psu_logo.png'
import psuBg from '../../img/psuSchool_bg.jpg'

const ROLE_REDIRECT = {
  student:     '/student',
  coordinator: '/coordinator',
  supervisor:  '/supervisor',
  admin:       '/admin',
}

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome, ${user.full_name}!`)
      navigate(ROLE_REDIRECT[user.role] || '/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

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
            On-the-Job Training <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
              Monitoring & Evaluation
            </span> System
          </h1>
          
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            A comprehensive portal designed to bridge academic excellence with professional training, ensuring seamless evaluation and performance tracking for PSU students.
          </p>

          {/* Feature Highlights */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-amber-500/20 rounded-full border border-amber-400/30">
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Digital DTR & Weekly Journals</h4>
                <p className="text-sm text-blue-200/90">Easily log hours and submit journals online for supervisor validation.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-amber-500/20 rounded-full border border-amber-400/30">
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Dual-Assessment Grading</h4>
                <p className="text-sm text-blue-200/90">Fair and structured 50/50 evaluation system between supervisor and coordinator.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-amber-500/20 rounded-full border border-amber-400/30">
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Digital MOA & Placement Workflows</h4>
                <p className="text-sm text-blue-200/90">Streamlined agreement processing and automated company assignment matching.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-blue-800/60 text-xs text-blue-300/80">
            Empowering PSU Students for a Global Future. © {new Date().getFullYear()} Pangasinan State University.
          </div>
        </div>
      </div>

      {/* Right side - Login Panel */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Background Image for Mobile only */}
        <div 
          className="absolute inset-0 bg-cover bg-center lg:hidden"
          style={{ backgroundImage: `url(${psuBg})` }}
        />
        {/* Mobile Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/90 to-amber-950/90 lg:hidden" />

        {/* Form container */}
        <div className="relative z-10 w-full max-w-lg bg-white/95 lg:bg-white p-10 sm:p-12 rounded-2xl lg:rounded-none shadow-2xl lg:shadow-none border border-gray-100 lg:border-none backdrop-blur-sm lg:backdrop-blur-none transition-all duration-300">
          
          {/* Logo and Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-5 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-amber-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <img 
                src={psuLogo} 
                alt="PSU Logo" 
                className="relative w-28 h-28 sm:w-32 sm:h-32 object-contain transition-transform duration-300 group-hover:scale-105" 
              />
            </div>
            <h2 className="text-3xl font-extrabold text-blue-900 text-center tracking-tight">
              OJT MONITORING SYSTEM
            </h2>
            <p className="text-gray-500 lg:text-gray-400 text-base mt-1.5 text-center font-medium">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handle} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-blue-900/80 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <Mail className="w-6 h-6" />
                </div>
                <input
                  type="email" 
                  required
                  placeholder="name@psu.edu.ph"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all text-gray-800 text-base"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-blue-900/80 uppercase tracking-wider">
                  Password
                </label>
                <a href="#forgot" className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors">
                  Forgot Password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock className="w-6 h-6" />
                </div>
                <input
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all text-gray-800 text-base"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2.5 block text-sm text-gray-600 select-none cursor-pointer">
                Remember my credentials
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-gradient-to-r from-blue-800 to-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-800/20 hover:shadow-xl hover:shadow-blue-800/30 hover:from-blue-700 hover:to-blue-600 active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100 disabled:pointer-events-none transition-all duration-200 text-base mt-2 flex items-center justify-center cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Footer register link */}
          <div className="mt-8 text-center text-base">
            <span className="text-gray-500">New to the system? </span>
            <Link to="/register" className="text-amber-600 hover:text-amber-700 font-bold hover:underline transition-colors">
              Create an Account
            </Link>
          </div>

          <div className="mt-12 text-center lg:hidden">
            <p className="text-xs text-gray-400 font-medium">
              © {new Date().getFullYear()} Pangasinan State University OJT.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
