import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Sprout, ShoppingCart, User, Menu, X, Search,
  LogOut, ShieldCheck, Store, ChevronDown, Package
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'

export default function Navbar() {
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Signed out successfully')
      navigate('/')
      setProfileOpen(false)
    } catch {
      toast.error('Error signing out')
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
    { to: '/community', label: 'Community' },
  ]

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
      scrolled 
        ? "bg-dark-900/80 backdrop-blur-xl border-b border-white/5 py-2" 
        : "bg-transparent py-4"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow-green"
            >
              <Sprout size={22} className="text-white" />
            </motion.div>
            <span className="font-display font-bold text-2xl text-white tracking-tight">
              Agri<span className="text-primary-500">Link</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 bg-dark-800/40 rounded-full px-2 py-1 border border-white/5">
            {navLinks.map(({ to, label }) => (
              <NavLink 
                key={to} 
                to={to} 
                end={to === '/'}
                className={({ isActive }) => cn(
                  "px-5 py-2 rounded-full text-sm font-medium transition-all duration-300",
                  isActive 
                    ? "bg-primary-500 text-white shadow-glow-green" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative group">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-dark-800/50 border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 w-40 focus:w-64 transition-all duration-500"
              />
            </form>

            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/cart" className="relative p-2.5 rounded-full bg-dark-800/50 border border-white/5 text-gray-400 hover:text-primary-400 transition-colors">
                  <ShoppingCart size={20} />
                  {totalItems > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-dark-900"
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </motion.span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-white/10 bg-dark-800/50 hover:bg-dark-700/80 transition-all group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shadow-inner">
                      <span className="text-xs font-bold text-white uppercase">
                        {profile?.full_name?.[0] || user.email?.[0]}
                      </span>
                    </div>
                    <ChevronDown size={14} className={cn("text-gray-500 transition-transform duration-300", profileOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-64 bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-3 z-50 overflow-hidden"
                      >
                        <div className="px-5 py-3 border-b border-white/5 mb-2 bg-white/5">
                          <p className="text-sm font-bold text-white truncate">{profile?.full_name || 'Farmer'}</p>
                          <p className="text-[11px] text-gray-500 truncate mb-2">{user.email}</p>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              profile?.role === 'admin' ? "bg-earth-500/20 text-earth-400" :
                              profile?.role === 'seller' ? "bg-primary-500/20 text-primary-400" :
                              "bg-blue-500/20 text-blue-400"
                            )}>
                              {profile?.role || 'Buyer'}
                            </span>
                            {profile?.role === 'seller' && (
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                profile?.is_approved_seller ? "bg-primary-500 animate-pulse" : "bg-yellow-500"
                              )} />
                            )}
                          </div>
                        </div>

                        <div className="px-2 space-y-1">
                          <NavbarItem to="/profile" icon={User} label="My Profile" onClick={() => setProfileOpen(false)} />
                          <NavbarItem to="/orders" icon={Package} label="My Orders" onClick={() => setProfileOpen(false)} />
                          
                          {profile?.role === 'seller' && profile?.is_approved_seller && (
                            <NavbarItem to="/seller/dashboard" icon={Store} label="Seller Dashboard" onClick={() => setProfileOpen(false)} highlight />
                          )}
                          
                          {profile?.role === 'admin' && (
                            <NavbarItem to="/admin" icon={ShieldCheck} label="Admin Control" onClick={() => setProfileOpen(false)} highlight />
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-white/5 px-2">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                          >
                            <LogOut size={16} /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-6 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Login
                </Link>
                <Link to="/register" className="btn-primary px-6 py-2.5 text-sm shadow-glow-green">
                  Join AgriLink
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-1">
            <button 
              onClick={() => { navigate('/products'); setMobileOpen(false); }}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Search size={22} />
            </button>

            {user && (
              <Link to="/cart" className="relative p-2 text-gray-400">
                <ShoppingCart size={22} />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-dark-900">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-400 hover:text-white transition-colors ml-1"
            >
              {mobileOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark-900 border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-1">
              {/* Mobile Search */}
              <div className="pb-6">
                <form onSubmit={handleSearch} className="relative">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search AgriLink..."
                    className="w-full bg-dark-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-primary-500/50"
                  />
                </form>
              </div>

              <div className="space-y-1">
                {navLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-xl text-lg font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
              
              <div className="pt-6 mt-6 border-t border-white/5">
                {authLoading ? (
                  <div className="px-4 py-2 flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                    <span className="text-xs text-gray-500">Syncing...</span>
                  </div>
                ) : user ? (
                  <div className="space-y-4">
                    <div className="px-4 flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-lg font-bold text-white uppercase">
                          {profile?.full_name?.[0] || user.email?.[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-bold truncate">{profile?.full_name || 'Farmer'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      <NavbarMobileLink to="/profile" icon={User} label="My Profile" onClick={() => setMobileOpen(false)} />
                      <NavbarMobileLink to="/orders" icon={Package} label="My Orders" onClick={() => setMobileOpen(false)} />
                      
                      {profile?.role === 'seller' && profile?.is_approved_seller && (
                        <NavbarMobileLink to="/seller/dashboard" icon={Store} label="Seller Dashboard" onClick={() => setMobileOpen(false)} highlight />
                      )}
                      
                      {profile?.role === 'admin' && (
                        <NavbarMobileLink to="/admin" icon={ShieldCheck} label="Admin Control" onClick={() => setMobileOpen(false)} highlight />
                      )}
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-sm"
                      >
                        <LogOut size={18} /> Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 px-2">
                    <Link 
                      to="/login" 
                      onClick={() => setMobileOpen(false)} 
                      className="flex items-center justify-center w-full py-3.5 rounded-xl bg-dark-800 text-white font-bold text-sm border border-white/5 hover:bg-dark-700 transition-colors"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/register" 
                      onClick={() => setMobileOpen(false)} 
                      className="flex items-center justify-center w-full py-3.5 rounded-xl bg-primary-500 text-white font-bold text-sm shadow-glow-green"
                    >
                      Join AgriLink
                    </Link>
                    <div className="pt-4 flex items-center justify-center">
                      <Link 
                        to="/login?role=admin" 
                        onClick={() => setMobileOpen(false)} 
                        className="text-gray-500 text-xs hover:text-primary-400 flex items-center gap-1.5 transition-colors"
                      >
                        <ShieldCheck size={12} /> Admin Login
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

function NavbarItem({ to, icon: Icon, label, onClick, highlight }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200",
        highlight 
          ? "text-primary-400 hover:bg-primary-500/10" 
          : "text-gray-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon size={16} />
      <span className="font-medium">{label}</span>
    </Link>
  )
}

function NavbarMobileLink({ to, icon: Icon, label, onClick, highlight }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200",
        highlight 
          ? "text-primary-400 bg-primary-500/5 font-bold" 
          : "text-gray-400 hover:bg-white/5 hover:text-white font-medium"
      )}
    >
      <Icon size={18} />
      <span className="text-sm">{label}</span>
    </Link>
  )
}
