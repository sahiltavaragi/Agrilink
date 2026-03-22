import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import Layout from '../components/Layout'
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, ShoppingBag } from 'lucide-react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-32 text-center">
        <ShoppingBag size={64} className="text-gray-700 mx-auto mb-6" />
        <h1 className="font-display font-bold text-2xl text-white mb-3">Your cart is empty</h1>
        <p className="text-gray-400 mb-8">Browse our products and add items to your cart</p>
        <Link to="/products" className="btn-primary">Shop Now <ArrowRight size={18} /></Link>
      </div>
    </Layout>
  )

  const DELIVERY = 50
  const GST = Math.round(totalPrice * 0.05)

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display font-bold text-3xl text-white">
            Shopping Cart <span className="text-gray-500 text-xl font-normal">({totalItems} items)</span>
          </h1>
          <button onClick={clearCart} className="btn-ghost text-sm text-red-400 hover:text-red-300">
            <Trash2 size={15} /> Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="card p-5 flex gap-4 items-center animate-fade-in">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-dark-700 flex-shrink-0">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl">🌿</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.id}`} className="font-semibold text-white text-sm hover:text-primary-400 transition-colors line-clamp-2">
                    {item.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                  <p className="font-bold text-primary-400 mt-2">₹{item.price?.toLocaleString('en-IN')}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2 bg-dark-700/60 border border-white/10 rounded-xl px-2 py-1">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                      <Minus size={13} />
                    </button>
                    <span className="text-white text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                      <Plus size={13} />
                    </button>
                  </div>
                  <p className="text-white font-bold text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div className="card p-6 sticky top-20">
              <h2 className="font-semibold text-white text-lg mb-5">Order Summary</h2>
              <div className="space-y-3 text-sm mb-5">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Delivery</span>
                  <span>₹{DELIVERY}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>GST (5%)</span>
                  <span>₹{GST}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-white text-base">
                  <span>Total</span>
                  <span className="text-primary-400">₹{(totalPrice + DELIVERY + GST).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button onClick={() => navigate('/checkout')} className="btn-primary w-full py-3.5">
                Proceed to Checkout <ArrowRight size={17} />
              </button>
              <Link to="/products" className="btn-ghost w-full justify-center mt-3 text-sm">
                Continue Shopping
              </Link>

              <div className="mt-5 p-3 bg-primary-900/20 border border-primary-800/30 rounded-xl text-xs text-center text-primary-400">
                🔒 Secure checkout powered by Razorpay
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
