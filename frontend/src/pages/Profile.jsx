import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { User, Package, Store, ChevronRight, Star, LogOut, Edit2, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate, Link } from 'react-router-dom'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const SELLER_BENEFITS = [
  'Access to 12,000+ active buyers',
  'Manage your own product listings',
  'Secure payouts via UPI/bank transfer',
  'Dedicated seller analytics dashboard',
]

export default function ProfilePage() {
  const { user, profile, signOut, updateProfile, refetchProfile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('profile')
  const [applying, setApplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '' })

  // Refetch profile when switching to seller tab to ensure approval status is current
  useEffect(() => {
    if (tab === 'seller') refetchProfile()
  }, [tab, refetchProfile])

  const { data: orders } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(title, image_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const { data: followStats } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      const [followers, following] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('followed_id', user.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id)
      ])
      return { followers: followers.count || 0, following: following.count || 0 }
    },
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5s to keep it updated
  })

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  async function handleApplySeller() {
    setApplying(true)
    try {
      await updateProfile({ role: 'seller', is_approved_seller: false })
      toast.success('Seller application submitted! Awaiting admin approval. ⏳')
    } catch {
      toast.error('Could not submit application')
    } finally {
      setApplying(false)
    }
  }

  async function handleSaveProfile() {
    try {
      await updateProfile(editForm)
      setEditing(false)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    }
  }

  const statusColors = {
    pending: 'badge-yellow',
    confirmed: 'badge-green',
    processing: 'badge-green',
    shipped: 'bg-blue-900/40 text-blue-400 badge',
    delivered: 'badge-green',
    cancelled: 'badge-red',
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="card p-6 flex flex-col sm:flex-row gap-5 items-center sm:items-start mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-glow-green">
            {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display font-bold text-2xl text-white">{profile?.full_name || 'User'}</h1>
            <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
            <div className="flex gap-4 mt-2 mb-3 justify-center sm:justify-start">
              <div className="text-sm"><span className="text-white font-bold">{followStats?.followers || 0}</span> <span className="text-gray-400">followers</span></div>
              <div className="text-sm"><span className="text-white font-bold">{followStats?.following || 0}</span> <span className="text-gray-400">following</span></div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-1">
              <span className={`badge ${profile?.role === 'admin' ? 'badge-earth' : profile?.role === 'seller' ? 'badge-green' : 'bg-dark-600 text-gray-400'}`}>
                {profile?.role || 'Buyer'}
              </span>
              {profile?.role === 'seller' && (
                <span className={profile?.is_approved_seller ? 'badge-green' : 'badge-yellow'}>
                  {profile?.is_approved_seller ? '✓ Approved' : '⏳ Pending Approval'}
                </span>
              )}
            </div>
          </div>
          <button onClick={handleSignOut}
            className="btn-ghost text-red-400 hover:text-red-300 text-sm flex items-center gap-2">
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 mb-6">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'orders', label: 'My Orders', icon: Package },
            { id: 'seller', label: 'Seller', icon: Store },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all duration-200 -mb-px ${
                tab === id ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Tab: Profile */}
        {tab === 'profile' && (
          <div className="card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Personal Information</h2>
              {!editing
                ? <button onClick={() => setEditing(true)} className="btn-ghost text-sm"><Edit2 size={14} /> Edit</button>
                : <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="btn-ghost text-sm text-gray-400">Cancel</button>
                    <button onClick={handleSaveProfile} className="btn-primary text-sm px-4 py-2">Save</button>
                  </div>
              }
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Full Name</label>
                {editing
                  ? <input value={editForm.full_name} onChange={e => setEditForm(f => ({...f, full_name: e.target.value}))} className="input-field" />
                  : <p className="text-white">{profile?.full_name || '—'}</p>
                }
              </div>
              <div>
                <label className="label">Email</label>
                <p className="text-gray-400">{user?.email}</p>
              </div>
              <div>
                <label className="label">Phone</label>
                {editing
                  ? <input value={editForm.phone} onChange={e => setEditForm(f => ({...f, phone: e.target.value}))} placeholder="+91..." className="input-field" />
                  : <p className="text-white">{profile?.phone || '—'}</p>
                }
              </div>
              <div>
                <label className="label">Wallet Balance</label>
                <p className="text-primary-400 font-bold">₹{(profile?.wallet_balance || 0).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <label className="label">Member Since</label>
                <p className="text-gray-400">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—'}</p>
              </div>
              <div>
                <label className="label">Role</label>
                <p className="text-white capitalize">{profile?.role || 'Buyer'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Orders */}
        {tab === 'orders' && (
          <div className="space-y-4 animate-fade-in">
            {!orders || orders.length === 0 ? (
              <div className="card p-12 text-center">
                <Package size={48} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400">No orders yet</p>
                <Link to="/products" className="btn-primary mt-4 inline-flex">Shop Now</Link>
              </div>
            ) : orders.map(order => (
              <div key={order.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-medium text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-gray-500 text-xs">{new Date(order.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  <span className={statusColors[order.status] || 'badge'}>{order.status}</span>
                </div>
                <div className="text-sm text-gray-400">
                  {order.order_items?.map(i => i.products?.title).join(', ')}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <span className="text-primary-400 font-bold">₹{order.total_amount?.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-gray-500">{order.payment_method?.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Seller */}
        {tab === 'seller' && (
          <div className="animate-fade-in">
            {profile?.role === 'seller' ? (
              <div className="card p-8 text-center">
                {profile?.is_approved_seller ? (
                  <>
                    <CheckCircle size={48} className="text-primary-400 mx-auto mb-4" />
                    <h2 className="font-display font-bold text-xl text-white mb-2">You're an Approved Seller!</h2>
                    <p className="text-gray-400 text-sm mb-6">Manage your products, view orders, and track earnings from your seller dashboard.</p>
                    <Link to="/seller/dashboard" className="btn-primary">Go to Seller Dashboard</Link>
                  </>
                ) : (
                  <>
                    <Clock size={48} className="text-yellow-400 mx-auto mb-4" />
                    <h2 className="font-display font-bold text-xl text-white mb-2">Application Under Review</h2>
                    <p className="text-gray-400 text-sm">Our team will review your application and get back to you within 24–48 hours.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="card p-8">
                <div className="text-center mb-8">
                  <div className="text-5xl mb-4">🌱</div>
                  <h2 className="font-display font-bold text-2xl text-white mb-3">Become a Seller on AgriLink</h2>
                  <p className="text-gray-400 max-w-md mx-auto">Join thousands of sellers reaching farmers across India. Start selling your organic products today.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {SELLER_BENEFITS.map(b => (
                    <div key={b} className="flex items-center gap-3 p-3 bg-primary-900/20 border border-primary-800/20 rounded-xl text-sm text-gray-300">
                      <CheckCircle size={16} className="text-primary-400 flex-shrink-0" />
                      {b}
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <button onClick={handleApplySeller} disabled={applying}
                    className="btn-primary px-10 py-3.5 text-base">
                    {applying ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Apply to Become a Seller'}
                  </button>
                  <p className="text-gray-500 text-xs mt-3">Approval takes 24–48 hours. No fees to apply.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
