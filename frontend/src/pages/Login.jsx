import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Sprout, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      await signIn(form.email, form.password)
      toast.success('Welcome back! 🌱')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-dark-900 bg-hero-pattern">
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-56 h-56 bg-earth-600/8 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-glow-green">
              <Sprout size={24} className="text-white" />
            </div>
            <span className="font-display font-bold text-3xl text-white">Agri<span className="text-gradient">Link</span></span>
          </Link>
          <h1 className="font-display font-bold text-2xl text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-sm">Sign in to continue farming smarter</p>
        </div>

        {/* Form Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                  className="input-field pl-10 pr-11"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base relative overflow-hidden"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                <><span>Sign In</span><ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
              Create one for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
