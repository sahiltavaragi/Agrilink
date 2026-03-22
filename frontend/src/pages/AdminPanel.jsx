import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import {
  Users, Store, Package, TrendingUp, CheckCircle, XCircle,
  Search, ShieldCheck, MessageSquare, ShoppingBag, Wallet,
  Trash2, Eye, ArrowUpRight, Clock, MapPin, Phone, User as UserIcon,
  ChevronDown, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'

export default function AdminPanel() {
  const [tab, setTab] = useState('sellers')
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  // ── Stats ─────────────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount'),
        // supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'seller').eq('is_approved_seller', false),
        // supabase.from('products').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
      ])
      const totalRevenue = ordersRes.data?.reduce((s, o) => s + Number(o.total_amount), 0) || 0
      
      return [
        { label: 'Total Users', value: usersRes.count || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Products', value: productsRes.count || 0, icon: Package, color: 'text-primary-400', bg: 'bg-primary-500/10' },
        { label: 'Total Orders', value: ordersRes.data?.length || 0, icon: ShoppingBag, color: 'text-earth-400', bg: 'bg-earth-500/10' },
        { label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
      ]
    },
  })

  // ── Pending Sellers ───────────────────────────────────────────
  const { data: pendingSellers } = useQuery({
    queryKey: ['admin-pending-sellers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'seller').eq('is_approved_seller', false)
      if (error) throw error
      return data
    },
  })

  // ── Pending Products ──────────────────────────────────────────
  const { data: pendingProducts } = useQuery({
    queryKey: ['admin-pending-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*, users(full_name)').eq('approval_status', 'pending').order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  // ── All Users ─────────────────────────────────────────────────
  const { data: allUsers } = useQuery({
    queryKey: ['admin-all-users', search],
    queryFn: async () => {
      let q = supabase.from('users').select('*').order('created_at', { ascending: false }).limit(50)
      if (search) q = q.ilike('full_name', `%${search}%`)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })

  // ── All Orders ────────────────────────────────────────────────
  const { data: allOrders } = useQuery({
    queryKey: ['admin-all-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, users(full_name), order_items(quantity, price_at_time, products(title))')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    },
    enabled: tab === 'orders',
  })

  // ── Community Posts ───────────────────────────────────────────
  const { data: posts } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, users(full_name)')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    },
    enabled: tab === 'community',
  })

  // ── Wallets ───────────────────────────────────────────────────
  const { data: wallets } = useQuery({
    queryKey: ['admin-wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, wallet_balance')
        .order('wallet_balance', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: tab === 'wallets',
  })

  // ── Mutations ─────────────────────────────────────────────────
  const sellerMutation = useMutation({
    mutationFn: async ({ id, approve }) => {
      const updates = approve
        ? { role: 'seller', is_approved_seller: true }
        : { role: 'buyer', is_approved_seller: false }
      const { error } = await supabase.from('users').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { approve }) => {
      qc.invalidateQueries({ queryKey: ['admin-pending-sellers'] })
      qc.invalidateQueries({ queryKey: ['admin-all-users'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success(approve ? 'Seller approved! ✅' : 'Seller rejected ❌')
    },
  })

  const productMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from('products').update({ approval_status: status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['admin-pending-products'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success(status === 'approved' ? 'Product approved! ✅' : 'Product rejected ❌')
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-posts'] })
      toast.success('Post removed')
    },
  })

  const addWalletMutation = useMutation({
    mutationFn: async ({ userId, amount }) => {
      const { error } = await supabase.rpc('add_wallet_balance', { p_user_id: userId, p_amount: amount })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-wallets'] })
      toast.success('Wallet balance added!')
    },
  })

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const TABS = [
    { id: 'sellers',   label: 'Seller Approvals',  badge: stats?.pendingSellers },
    { id: 'products',  label: 'Product Approvals',  badge: stats?.pendingProducts },
    { id: 'orders',    label: 'All Orders' },
    { id: 'users',     label: 'Users' },
    { id: 'community', label: 'Community' },
    { id: 'wallets',   label: 'Wallets' },
  ]

  const STAT_CARDS = [
    { icon: Users,      label: 'Total Users',  value: stats?.users?.toLocaleString() || '—',          color: 'from-primary-900/50 to-dark-800 border-primary-700/30', iconColor: 'text-primary-400' },
    { icon: Package,    label: 'Products',     value: stats?.products?.toLocaleString() || '—',       color: 'from-blue-900/30 to-dark-800 border-blue-700/30',      iconColor: 'text-blue-400' },
    { icon: ShoppingBag,label: 'Orders',       value: stats?.orders?.toLocaleString() || '—',         color: 'from-earth-900/40 to-dark-800 border-earth-700/30',    iconColor: 'text-earth-400' },
    { icon: TrendingUp, label: 'Revenue',      value: `₹${(stats?.revenue || 0).toLocaleString('en-IN')}`, color: 'from-yellow-900/30 to-dark-800 border-yellow-700/30', iconColor: 'text-yellow-400' },
  ]

  const STATUS_COLORS = {
    pending:   'bg-yellow-900/40 text-yellow-400',
    confirmed: 'bg-blue-900/40 text-blue-400',
    shipped:   'bg-purple-900/40 text-purple-400',
    delivered: 'bg-primary-900/40 text-primary-400',
    cancelled: 'bg-red-900/40 text-red-400',
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pt-32">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-earth-500/10 rounded-2xl flex items-center justify-center text-earth-500">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-4xl font-display font-extrabold text-white">Admin Control</h1>
          </div>
          <p className="text-gray-500">Oversee the AgriLink ecosystem, manage users, and approve products.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats?.map(({ label, value, icon: Icon, color, bg }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-dark-800/40 border border-white/5 p-8 rounded-[2rem] hover:border-white/10 transition-all duration-300"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500", bg)}>
                <Icon size={24} className={color} />
              </div>
              <div className="text-3xl font-display font-black text-white mb-1">{value}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-dark-800/40 p-1 rounded-2xl border border-white/5 w-fit mb-10">
          {TABS.map(({ id, label, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                tab === id 
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" 
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              )}
            >
              {label}
              {badge > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] rounded-full bg-red-500 text-white font-black">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'sellers' && (
              <div className="grid gap-4">
                {!pendingSellers || pendingSellers.length === 0 ? (
                  <EmptyState icon={Store} title="No Pending Applications" subtitle="All seller applications have been reviewed." />
                ) : pendingSellers.map((u) => (
                  <div key={u.id} className="bg-dark-800/40 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 flex items-center gap-6 w-full">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-xl">
                        {u.full_name?.[0] || 'S'}
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-white mb-1">{u.full_name}</h3>
                        <p className="text-gray-500 text-sm">{u.email}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1.5 text-xs text-gray-600 font-bold">
                            <Clock size={12} /> Applied {formatDate(u.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => sellerMutation.mutate({ id: u.id, approve: true })}
                        className="flex-1 md:flex-none btn-primary px-8 py-3 bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500 hover:text-white transition-all"
                      >
                        <CheckCircle size={18} /> Approve
                      </button>
                      <button 
                        onClick={() => sellerMutation.mutate({ id: u.id, approve: false })}
                        className="flex-1 md:flex-none btn-secondary px-8 py-3 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <XCircle size={18} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {tab === 'products' && (
              <div className="grid gap-4">
                {!pendingProducts || pendingProducts.length === 0 ? (
                  <EmptyState icon={Package} title="No Pending Products" subtitle="All listed products are currently approved." />
                ) : pendingProducts.map((p) => (
                  <div key={p.id} className="bg-dark-800/40 border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-24 h-24 bg-dark-700 rounded-2xl overflow-hidden flex-shrink-0">
                      {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20 text-3xl">🌿</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-display font-bold text-white mb-1 truncate">{p.title}</h3>
                      <p className="text-gray-500 text-xs mb-3 line-clamp-1">{p.description}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-primary-400 font-bold text-sm">₹{p.price}</span>
                        <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">Seller: {p.users?.full_name}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => productMutation.mutate({ id: p.id, status: 'approved' })}
                        className="flex-1 md:flex-none p-4 bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-2xl hover:bg-primary-500 hover:text-white transition-all"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button 
                        onClick={() => productMutation.mutate({ id: p.id, status: 'rejected' })}
                        className="flex-1 md:flex-none p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'orders' && (
              <div className="grid gap-4">
                {!allOrders || allOrders.length === 0 ? (
                  <EmptyState icon={ShoppingBag} title="No Orders Yet" subtitle="Orders will appear here once customers start buying." />
                ) : allOrders.map((o) => (
                  <div key={o.id} className="bg-dark-800/40 border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all">
                    <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-dark-700 rounded-full text-gray-400">Order #{o.id.slice(0, 8)}</span>
                          <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", STATUS_COLORS[o.status] || STATUS_COLORS.pending)}>{o.status}</span>
                        </div>
                        <p className="text-gray-500 text-xs">Buyer: <span className="text-white font-bold">{o.users?.full_name}</span> · {formatDate(o.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Revenue</p>
                        <p className="text-2xl font-display font-black text-primary-400">₹{o.total_amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                      {o.order_items?.map((item, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-xs text-gray-400">
                          {item.products?.title} <span className="text-gray-600 ml-1">×{item.quantity}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'users' && (
              <div className="bg-dark-800/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                <div className="p-6 border-b border-white/5">
                  <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-dark-700 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">
                        <th className="px-8 py-5">User</th>
                        <th className="px-8 py-5">Role</th>
                        <th className="px-8 py-5">Wallet</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allUsers?.map((u) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
                                {u.full_name?.[0] || 'U'}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">{u.full_name}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                              u.role === 'admin' ? "bg-earth-500/20 text-earth-400" :
                              u.role === 'seller' ? "bg-primary-500/20 text-primary-400" :
                              "bg-dark-600 text-gray-400"
                            )}>
                              {u.role || 'buyer'}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-sm font-bold text-white">₹{u.wallet_balance?.toLocaleString() || 0}</p>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button className="p-2 text-gray-600 hover:text-white transition-colors">
                              <ChevronDown size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* ── Community Management ── */}
            {tab === 'community' && (
              <div className="animate-fade-in space-y-3">
                {!posts?.length ? (
                  <div className="card p-16 text-center">
                    <MessageSquare size={48} className="text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-400">No community posts yet</p>
                  </div>
                ) : posts.map(post => (
                  <div key={post.id} className="card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-9 h-9 bg-primary-800 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {post.users?.full_name?.[0] || 'F'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium text-sm">{post.users?.full_name || 'Farmer'}</p>
                            <span className="text-gray-600 text-xs">{formatDate(post.created_at)}</span>
                          </div>
                          <p className="text-gray-300 text-sm line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>❤️ {post.likes_count || 0} likes</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => { if (confirm('Delete this post?')) deletePostMutation.mutate(post.id) }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-900/20 text-red-400 border border-red-800/30 hover:bg-red-700 hover:text-white rounded-xl text-xs font-medium transition-all flex-shrink-0">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Wallets ── */}
            {tab === 'wallets' && (
              <div className="animate-fade-in">
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-5 text-gray-500 font-medium">User</th>
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">Role</th>
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">Wallet Balance</th>
                          <th className="text-left py-3 px-4 text-gray-500 font-medium">Add Money</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wallets?.map(u => (
                          <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary-800 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                  {u.full_name?.[0] || 'U'}
                                </div>
                                <span className="text-white">{u.full_name || '—'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`badge ${u.role === 'admin' ? 'badge-earth' : u.role === 'seller' ? 'badge-green' : 'bg-dark-600 text-gray-400'}`}>
                                {u.role || 'buyer'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-primary-400 font-bold text-base">₹{Number(u.wallet_balance || 0).toLocaleString('en-IN')}</span>
                            </td>
                            <td className="py-3 px-4">
                              <AddWalletForm userId={u.id} onAdd={(amount) => addWalletMutation.mutate({ userId: u.id, amount })} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Default state for other tabs */}
            {!['sellers', 'products', 'orders', 'users', 'community', 'wallets'].includes(tab) && (
              <EmptyState icon={TrendingUp} title="Coming Soon" subtitle={`The ${tab} management interface is being updated.`} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  )
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="py-24 text-center bg-dark-800/20 border border-dashed border-white/10 rounded-[3rem]">
      <div className="w-20 h-20 bg-dark-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon size={32} className="text-gray-600" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mx-auto">{subtitle}</p>
    </div>
  )
}

function AddWalletForm({ onAdd }) {
  const [amount, setAmount] = useState('')
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="₹ amount"
        min="1"
        className="bg-dark-700 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-28 focus:outline-none focus:border-primary-500/50"
      />
      <button
        onClick={() => { if (amount > 0) { onAdd(parseFloat(amount)); setAmount('') } }}
        className="px-3 py-1.5 bg-primary-600/20 text-primary-400 border border-primary-600/30 hover:bg-primary-600 hover:text-white rounded-lg text-xs font-medium transition-all">
        Add
      </button>
    </div>
  )
}
