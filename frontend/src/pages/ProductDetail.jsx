import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import Layout from '../components/Layout'
import { ShoppingCart, ArrowLeft, Star, Package, Truck, ShieldCheck } from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, users(full_name, avatar_url)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })

  if (isLoading) return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="skeleton h-96 rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
            <div className="skeleton h-20 rounded" />
            <div className="skeleton h-12 rounded" />
          </div>
        </div>
      </div>
    </Layout>
  )

  if (!product) return (
    <Layout>
      <div className="text-center py-32">
        <p className="text-gray-400 text-lg">Product not found</p>
        <button onClick={() => navigate('/products')} className="btn-primary mt-4">Back to Products</button>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft size={17} /> Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Image */}
          <div className="card overflow-hidden h-96">
            {product.image_url
              ? <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-8xl">🌿</div>
            }
          </div>

          {/* Info */}
          <div>
            <span className="badge-green mb-3 inline-block">{product.category}</span>
            <h1 className="font-display font-bold text-3xl text-white mb-3">{product.title}</h1>
            <div className="flex items-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
              <span className="text-gray-500 text-sm">(4.8)</span>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed mb-6">{product.description}</p>

            <div className="flex items-end gap-3 mb-6">
              <span className="font-display font-bold text-4xl text-primary-400">
                ₹{product.price?.toLocaleString('en-IN')}
              </span>
              <span className="text-gray-500 text-sm mb-1">{product.quantity > 0 ? `${product.quantity} units available` : 'Out of stock'}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: Package, label: 'In Stock', sub: `${product.quantity} units` },
                { icon: Truck, label: 'Delivery', sub: '3-5 days' },
                { icon: ShieldCheck, label: 'Verified', sub: 'Organic' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="card-glass rounded-xl p-3 text-center">
                  <Icon size={18} className="text-primary-400 mx-auto mb-1" />
                  <p className="text-white text-xs font-medium">{label}</p>
                  <p className="text-gray-500 text-xs">{sub}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => addItem(product)}
                disabled={product.quantity === 0}
                className="btn-primary flex-1 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button
                onClick={() => { addItem(product); navigate('/cart') }}
                disabled={product.quantity === 0}
                className="btn-earth flex-1 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            {product.users && (
              <div className="flex items-center gap-3 mt-6 p-4 card-glass rounded-xl">
                <div className="w-10 h-10 bg-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {product.users.full_name?.[0] || 'S'}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{product.users.full_name}</p>
                  <p className="text-gray-500 text-xs">Verified Seller</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
