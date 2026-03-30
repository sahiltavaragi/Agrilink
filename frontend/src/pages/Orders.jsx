import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const STATUS_CONFIG = {
  pending:    { icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-900/30', label: 'Pending' },
  confirmed:  { icon: CheckCircle,  color: 'text-blue-400',   bg: 'bg-blue-900/30',   label: 'Confirmed' },
  processing: { icon: Clock,        color: 'text-orange-400', bg: 'bg-orange-900/30', label: 'Processing' }, // New status
  shipped:    { icon: Truck,        color: 'text-purple-400', bg: 'bg-purple-900/30', label: 'Shipped' },
  delivered:  { icon: CheckCircle,  color: 'text-primary-400',bg: 'bg-primary-900/30',label: 'Delivered' },
  cancelled:  { icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-900/30',    label: 'Cancelled' },
}

export default function OrdersPage() {
  const { user } = useAuth()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.id],
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

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-glow-green">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">My Orders</h1>
            <p className="text-gray-400 text-sm">Track all your AgriLink orders</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="card p-6 space-y-3">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-16 rounded" />
              </div>
            ))}
          </div>
        ) : orders?.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => {
              const statusKey = (order.status || 'pending').toLowerCase()
              const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending
              const StatusIcon = cfg.icon
              return (
                <div key={order.id} className="card p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Order ID: #{order.id.slice(0,8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                      <StatusIcon size={12} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-3 mb-4">
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-dark-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.products?.image_url
                            ? <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                            : <span className="text-xl">🌿</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium line-clamp-1">{item.products?.title}</p>
                          <p className="text-gray-500 text-xs">Qty: {item.quantity} × ₹{item.price_at_time?.toLocaleString('en-IN')}</p>
                        </div>
                        <p className="text-primary-400 text-sm font-semibold">₹{(item.quantity * item.price_at_time).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Payment: <span className="text-white capitalize">{order.payment_method?.toUpperCase?.() || 'COD'}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        order.payment_status === 'paid' ? 'bg-primary-900/40 text-primary-400' : 'bg-yellow-900/40 text-yellow-400'
                      }`}>{order.payment_status === 'paid' ? 'Paid' : 'Pending'}</span>
                    </div>
                    <p className="font-bold text-white">
                      Total: <span className="text-primary-400">₹{order.total_amount?.toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card p-16 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="font-semibold text-white mb-2">No orders yet</h3>
            <p className="text-gray-400 text-sm mb-6">Start shopping to place your first order!</p>
            <Link to="/products" className="btn-primary inline-flex">Browse Products</Link>
          </div>
        )}
      </div>
    </Layout>
  )
}
