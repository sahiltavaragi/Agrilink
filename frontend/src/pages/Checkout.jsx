import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { MapPin, CreditCard, Banknote, Wallet, CheckCircle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRazorpay } from 'react-razorpay'
import axios from 'axios'

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { Razorpay, isLoading: isRazorpayLoading } = useRazorpay()
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [address, setAddress] = useState({
    name: profile?.full_name || '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [loading, setLoading] = useState(false)

  const DELIVERY = 50
  const GST = Math.round(totalPrice * 0.05)
  const total = totalPrice + DELIVERY + GST

  async function handlePlaceOrder() {
    if (!address.name || !address.phone || !address.line1 || !address.city || !address.pincode) {
      toast.error('Please fill in all address fields')
      return
    }
    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setLoading(true)
    try {
      if (paymentMethod === 'razorpay') {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
        // 1. Create order on backend
        const { data: order } = await axios.post(`${backendUrl}/api/payment/create-order`, {
          amount: total,
          userId: user.id,
          items,
          address,
        })

        // 2. Open Razorpay Checkout
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'AgriLink',
          description: 'Payment for your order',
          order_id: order.id,
          handler: async (response) => {
            try {
              // 3. Verify payment on backend
              const verifyRes = await axios.post(`${backendUrl}/api/payment/verify`, {
                ...response,
                userId: user.id,
                items,
                address,
              })

              if (verifyRes.data.success) {
                // Success!
                clearCart()
                toast.success('Payment successful! Order placed. 🌱')
                navigate('/orders')
              } else {
                toast.error('Payment verification failed.')
              }
            } catch (err) {
              console.error('Verification error:', err)
              toast.error('Payment verification failed.')
            }
          },
          prefill: {
            name: address.name,
            contact: address.phone,
            email: user.email,
          },
          theme: { color: '#10b981' }, // emerald-500
        }

        const rzp = new Razorpay(options)
        rzp.open()
        setLoading(false)
        return // Exit here, verification handler takes over
      }

      if (paymentMethod === 'wallet') {
        const { data: success, error: walletErr } = await supabase.rpc('deduct_wallet_balance', { p_user_id: user.id, p_amount: total })
        if (walletErr || !success) throw new Error('Insufficient wallet balance or wallet error')
      }

      // Insert order directly into Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          status: 'pending',
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
          delivery_address: address,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Insert order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Decrement stock for each product (simple read then update)
      for (const item of items) {
        try {
          const { data: prod } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', item.id)
            .single()
          if (prod) {
            await supabase
              .from('products')
              .update({ quantity: Math.max(0, prod.quantity - item.quantity) })
              .eq('id', item.id)
          }
        } catch {
          // Non-critical — order already saved, just log
          console.warn('Stock update failed for', item.id)
        }
      }

      clearCart()
      toast.success('Order placed successfully! 🌱')
      navigate('/orders')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-display font-bold text-3xl text-white mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left */}
          <div className="lg:col-span-3 space-y-6">
            {/* Delivery Address */}
            <div className="card p-6">
              <h2 className="font-semibold text-white flex items-center gap-2 mb-5">
                <MapPin size={18} className="text-primary-400" /> Delivery Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input value={address.name} onChange={e => setAddress(a => ({...a, name: e.target.value}))}
                    placeholder="Ramesh Kumar" className="input-field" />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input value={address.phone} onChange={e => setAddress(a => ({...a, phone: e.target.value}))}
                    placeholder="+91 9876543210" className="input-field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Address Line</label>
                  <input value={address.line1} onChange={e => setAddress(a => ({...a, line1: e.target.value}))}
                    placeholder="House no, Street, Village/Town" className="input-field" />
                </div>
                <div>
                  <label className="label">City</label>
                  <input value={address.city} onChange={e => setAddress(a => ({...a, city: e.target.value}))}
                    placeholder="Bengaluru" className="input-field" />
                </div>
                <div>
                  <label className="label">State</label>
                  <input value={address.state} onChange={e => setAddress(a => ({...a, state: e.target.value}))}
                    placeholder="Karnataka" className="input-field" />
                </div>
                <div>
                  <label className="label">Pincode</label>
                  <input value={address.pincode} onChange={e => setAddress(a => ({...a, pincode: e.target.value}))}
                    placeholder="560001" className="input-field" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card p-6">
              <h2 className="font-semibold text-white flex items-center gap-2 mb-5">
                <CreditCard size={18} className="text-primary-400" /> Payment Method
              </h2>
              <div className="space-y-3">
                {[
                  { id: 'cod', icon: Banknote, label: 'Cash on Delivery', sub: 'Pay when your order arrives', disabled: false },
                  { id: 'razorpay', icon: CreditCard, label: 'Pay Online', sub: 'UPI, Card, Net Banking via Razorpay', disabled: false },
                  { id: 'wallet', icon: Wallet, label: `Wallet (₹${profile?.wallet_balance || 0})`, sub: `Balance: ₹${profile?.wallet_balance || 0}`, disabled: (profile?.wallet_balance || 0) < total },
                ].map(({ id, icon: Icon, label, sub, disabled }) => (
                  <label key={id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    paymentMethod === id
                      ? 'border-primary-500/60 bg-primary-900/20'
                      : 'border-white/10 hover:border-white/20'
                  } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                    <input type="radio" name="payment" value={id} disabled={disabled}
                      checked={paymentMethod === id} onChange={() => setPaymentMethod(id)}
                      className="accent-primary-500" />
                    <Icon size={20} className="text-primary-400 flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">{label}</p>
                      <p className="text-gray-500 text-xs">{sub}</p>
                    </div>
                    {paymentMethod === id && <CheckCircle size={18} className="text-primary-400 ml-auto" />}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right – Summary */}
          <div className="lg:col-span-2">
            <div className="card p-6 sticky top-20">
              <h2 className="font-semibold text-white mb-4">Order Summary</h2>
              <div className="space-y-3 mb-5">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-400 line-clamp-1 flex-1 mr-2">{item.title} × {item.quantity}</span>
                    <span className="text-white font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>₹{totalPrice.toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-400"><span>Delivery</span><span>₹{DELIVERY}</span></div>
                <div className="flex justify-between text-gray-400"><span>GST (5%)</span><span>₹{GST}</span></div>
                <div className="flex justify-between font-bold text-white text-base pt-2 border-t border-white/10">
                  <span>Total</span><span className="text-primary-400">₹{total.toLocaleString()}</span>
                </div>
              </div>

              <button onClick={handlePlaceOrder} disabled={loading || items.length === 0 || (paymentMethod === 'razorpay' && isRazorpayLoading)}
                className="btn-primary w-full py-4 mt-6 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                {loading || (paymentMethod === 'razorpay' && isRazorpayLoading)
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  : <><span>Place Order</span><ArrowRight size={17} /></>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
