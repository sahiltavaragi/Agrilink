import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sprout, Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const BENEFITS = [
  'Access 3,500+ organic farming products',
  'Connect with the farmer community',
  'Track orders in real-time',
  'Option to become a seller',
]

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.password) { toast.error('Please fill all fields'); return }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.fullName)
      toast.success('Account created! Please check your email to verify. 🌱')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-dark-900 bg-hero-pattern">
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
        {/* Left – Benefits */}
        <div className="flex flex-col justify-center px-4 py-10">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-glow-green">
              <Sprout size={22} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">Agri<span className="text-gradient">Link</span></span>
          </Link>
          <h1 className="font-display font-extrabold text-4xl text-white leading-tight mb-4">
            Join the Future<br />of <span className="text-gradient">Farming</span>
          </h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Create your free account and get access to India's largest organic farming marketplace.
          </p>
          <ul className="space-y-3">
            {BENEFITS.map(b => (
              <li key={b} className="flex items-center gap-3 text-gray-300 text-sm">
                <CheckCircle size={17} className="text-primary-400 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Right – Form */}
        <div className="card p-8">
          <h2 className="font-display font-bold text-xl text-white mb-6">Create your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input type="text" value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Ramesh Kumar" required className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com" required className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 characters" required className="input-field pl-10 pr-11" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input type="password" value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Repeat password" required className="input-field pl-10" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 text-base mt-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                : <><span>Create Account</span><ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="divider" />
          <p className="text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
