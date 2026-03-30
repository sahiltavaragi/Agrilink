import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import {
  Plus, Edit2, Trash2, Package, DollarSign, ShoppingBag, TrendingUp, X, Upload, AlertCircle,
  ArrowUpRight, Clock, MapPin, Phone, User as UserIcon, Camera, Search, Filter, MoreVertical,
  CheckCircle, XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'

const CATEGORIES = ['Poultry Farming', 'Sheep/Goat Farming', 'Fish Farming', 'Organic Fertilizers', 'Indoor Farming', 'Outdoor Equipment']

const EMPTY_FORM = { title: '', description: '', price: '', quantity: '', category: CATEGORIES[0], image_url: '' }

export default function SellerDashboard() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('products')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)
  const qc = useQueryClient()

  const { data: products, isLoading } = useQuery({
    queryKey: ['seller-products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const { data: orders } = useQuery({
    queryKey: ['seller-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*, orders(status, created_at, total_amount, delivery_address), products(title)')
        .eq('seller_id', user.id)
        .order('orders(created_at)', { ascending: false })
        .limit(30)
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const totalEarnings = orders?.reduce((sum, o) => sum + (o.price_at_time * o.quantity), 0) || 0

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-orders', user?.id] })
      toast.success('Order status updated!')
    },
    onError: (err) => {
      console.error(err)
      toast.error('Failed to update status')
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingProduct) {
        const { error } = await supabase.from('products').update(data).eq('id', editingProduct.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert({ ...data, seller_id: user.id, approval_status: 'pending' })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-products'] })
      toast.success(editingProduct ? 'Product updated!' : 'Product submitted for approval! 🕐 Admin will review it.')
      setShowForm(false)
      setEditingProduct(null)
      setForm(EMPTY_FORM)
    },
    onError: () => toast.error('Failed to save product'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller-products'] }); toast.success('Product deleted') },
  })

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      
      const { data: upData, error: upErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (upErr) throw upErr

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(path)

      setForm(f => ({ ...f, image_url: data.publicUrl }))
      toast.success('Image uploaded!')
    } catch (err) {
      console.error('Upload error:', err)
      toast.error(err.message || 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  function openEdit(product) {
    setEditingProduct(product)
    setForm({ title: product.title, description: product.description || '', price: product.price, quantity: product.quantity, category: product.category, image_url: product.image_url || '' })
    setShowForm(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.price || !form.quantity) { toast.error('Fill in required fields'); return }
    saveMutation.mutate({ ...form, price: parseFloat(form.price), quantity: parseInt(form.quantity) })
  }

  const stats = [
    { icon: Package, label: 'Active Products', value: products?.filter(p => p.quantity > 0).length || 0, color: 'text-primary-400', bg: 'bg-primary-500/10' },
    { icon: ShoppingBag, label: 'Pending Orders', value: orders?.filter(o => o.orders?.status === 'pending').length || 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: DollarSign, label: 'Wallet Balance', value: `₹${(profile?.wallet_balance || 0).toLocaleString('en-IN')}`, color: 'text-earth-400', bg: 'bg-earth-500/10' },
    { icon: TrendingUp, label: 'Total Sales', value: orders?.length || 0, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pt-32">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-display font-extrabold text-white mb-2">Seller Dashboard</h1>
            <p className="text-gray-500">Manage your organic products and track your farm sales.</p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingProduct(null)
              setForm(EMPTY_FORM)
              setShowForm(true)
            }}
            className="btn-primary px-8 py-4 shadow-glow-green/20 self-start"
          >
            <Plus size={20} />
            <span>Add New Product</span>
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map(({ icon: Icon, label, value, color, bg }, idx) => (
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
        <div className="flex items-center gap-1 bg-dark-800/40 p-1 rounded-2xl border border-white/5 w-fit mb-10">
          {[
            { id: 'products', label: 'My Products', icon: Package },
            { id: 'orders', label: 'Recent Orders', icon: ShoppingBag },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                tab === id 
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" 
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === 'products' ? (
            <motion.div
              key="products-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card h-48 animate-pulse bg-white/5" />
                ))
              ) : products?.length === 0 ? (
                <div className="col-span-full py-24 text-center bg-dark-800/20 border border-dashed border-white/10 rounded-[3rem]">
                  <Package size={48} className="text-gray-700 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-white mb-2">No Products Yet</h3>
                  <p className="text-gray-500 mb-8">Start your farming business by listing your first product.</p>
                  <button 
                    onClick={() => { setEditingProduct(null); setForm(EMPTY_FORM); setShowForm(true) }}
                    className="btn-secondary px-8"
                  >
                    Add Your First Product
                  </button>
                </div>
              ) : products?.map((p) => (
                <div key={p.id} className="group bg-dark-800/40 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-primary-500/30 transition-all duration-500 shadow-xl">
                  <div className="relative aspect-video overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-dark-700 flex items-center justify-center text-4xl opacity-20">🌿</div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg",
                        p.approval_status === 'approved' ? "bg-primary-500 text-white" :
                        p.approval_status === 'pending' ? "bg-yellow-500 text-black" : "bg-red-500 text-white"
                      )}>
                        {p.approval_status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-display font-bold text-white mb-1 truncate">{p.title}</h3>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{p.category}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-primary-400">₹{p.price}</div>
                        <div className="text-[10px] text-gray-500 font-bold">{p.quantity} in stock</div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                      <button
                        onClick={() => openEdit(p)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(p.id)}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="orders-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {!orders || orders.length === 0 ? (
                <div className="py-24 text-center bg-dark-800/20 border border-dashed border-white/10 rounded-[3rem]">
                  <ShoppingBag size={48} className="text-gray-700 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-white">No Orders Received</h3>
                  <p className="text-gray-500 mt-2">When customers buy your products, they'll appear here.</p>
                </div>
              ) : orders.map((o) => (
                <div key={o.id} className="bg-dark-800/40 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start hover:border-white/10 transition-all">
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-dark-700 rounded-full text-gray-400">
                        Order #{o.order_id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-gray-600 font-bold flex items-center gap-2">
                        <Clock size={12} />
                        {new Date(o.orders?.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-display font-bold text-white mb-2">{o.products?.title}</h3>
                    <div className="flex items-center gap-6 mb-6">
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Quantity</span>
                        <span className="text-lg font-bold text-white">{o.quantity} Units</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Total Paid</span>
                        <span className="text-lg font-bold text-primary-400">₹{(o.price_at_time * o.quantity).toLocaleString()}</span>
                      </div>
                    </div>

                    {o.orders?.delivery_address && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-primary-400 font-bold text-[10px] uppercase tracking-widest">
                            <UserIcon size={14} /> Customer
                          </div>
                          <p className="text-white font-bold">{o.orders.delivery_address.name}</p>
                          <p className="flex items-center gap-2 text-gray-400 text-xs">
                            <Phone size={12} /> {o.orders.delivery_address.phone}
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-primary-400 font-bold text-[10px] uppercase tracking-widest">
                            <MapPin size={14} /> Shipping To
                          </div>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            {o.orders.delivery_address.line1}, {o.orders.delivery_address.city}<br />
                            {o.orders.delivery_address.state} - {o.orders.delivery_address.pincode}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="md:w-64 w-full flex flex-col gap-3">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 px-1">Order Status</span>
                    {['delivered', 'cancelled'].includes(o.orders?.status) ? (
                      <div className={cn(
                        "w-full py-4 px-6 rounded-2xl border flex items-center justify-center gap-3 font-bold",
                        o.orders?.status === 'delivered' ? "bg-primary-500/10 border-primary-500/20 text-primary-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                      )}>
                        {o.orders?.status === 'delivered' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                        {o.orders?.status.toUpperCase()}
                      </div>
                    ) : (
                      <div className="relative group/select">
                        <select 
                          value={(o.orders?.status || 'pending').toLowerCase()}
                          onChange={(e) => updateOrderStatusMutation.mutate({ orderId: o.order_id, status: e.target.value })}
                          className="w-full appearance-none bg-dark-700 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                          <MoreVertical size={18} />
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] text-center text-gray-600 mt-2">Updating status notifies the buyer instantly.</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Product Modal */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowForm(false)}
                className="absolute inset-0 bg-dark-900/90 backdrop-blur-xl" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-dark-800 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden"
              >
                {/* Modal Header */}
                <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white">
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Fill in the details for your organic product.</p>
                  </div>
                  <button onClick={() => setShowForm(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-gray-400 hover:text-white transition-all">
                    <X size={24} />
                  </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">Product Title</label>
                    <input
                      required
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-dark-700 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary-500 transition-all"
                      placeholder="e.g. Premium Vermicompost"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">Description</label>
                    <textarea
                      required
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full bg-dark-700 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary-500 transition-all min-h-[120px]"
                      placeholder="Describe your product's organic benefits..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={form.price}
                        onChange={e => setForm({ ...form, price: e.target.value })}
                        className="w-full bg-dark-700 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">Stock Quantity</label>
                      <input
                        type="number"
                        required
                        value={form.quantity}
                        onChange={e => setForm({ ...form, quantity: e.target.value })}
                        className="w-full bg-dark-700 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">Category</label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className="w-full appearance-none bg-dark-700 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary-500 transition-all cursor-pointer"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <MoreVertical size={20} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">Product Image</label>
                    <div className="flex items-center gap-6">
                      <div className="w-32 h-32 rounded-[2rem] bg-dark-700 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group/img relative">
                        {form.image_url ? (
                          <>
                            <img src={form.image_url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-dark-900/60 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center">
                              <Camera size={24} className="text-white" />
                            </div>
                          </>
                        ) : (
                          <Camera size={32} className="text-gray-600" />
                        )}
                        <input 
                          type="file" 
                          onChange={handleImageUpload} 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          disabled={uploading}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 leading-relaxed mb-4">
                          Upload a clear, high-quality image of your organic product. Square images work best. Max 5MB.
                        </p>
                        {uploading && (
                          <div className="flex items-center gap-3 text-primary-400 text-xs font-bold animate-pulse">
                            <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                            Uploading Image...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 py-4 px-6 bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveMutation.isPending || uploading}
                      className="flex-[2] btn-primary py-4 text-lg"
                    >
                      {saveMutation.isPending ? (
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                      ) : (
                        <>{editingProduct ? 'Update Product' : 'Create Product'}</>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}
