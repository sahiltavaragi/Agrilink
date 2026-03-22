import { ShoppingCart, Star, Heart, ArrowUpRight, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

const CATEGORY_STYLES = {
  'Poultry Farming': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Sheep/Goat Farming': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Fish Farming': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Organic Fertilizers': 'bg-primary-500/10 text-primary-500 border-primary-500/20',
  'Indoor Farming': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Outdoor Equipment': 'bg-earth-500/10 text-earth-500 border-earth-500/20',
}

export default function ProductCard({ product }) {
  const { addItem } = useCart()

  function handleAddToCart(e) {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
  }

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Link 
        to={`/products/${product.id}`} 
        className="group relative block bg-dark-800/40 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-4 hover:border-primary-500/30 hover:bg-dark-800/60 transition-all duration-500 overflow-hidden shadow-xl"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-dark-700 mb-5">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-700 to-dark-800">
              <span className="text-7xl group-hover:scale-125 transition-transform duration-500 opacity-20">🌿</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.is_featured && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-earth-500 text-white text-[10px] font-bold rounded-full shadow-lg shadow-earth-500/30">
                <Star size={10} className="fill-white" />
                FEATURED
              </span>
            )}
            {product.quantity > 0 && product.quantity < 10 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-lg shadow-red-500/30">
                <Zap size={10} className="fill-white" />
                LOW STOCK
              </span>
            )}
          </div>

          {/* Out of Stock Overlay */}
          {product.quantity === 0 && (
            <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center">
              <span className="px-5 py-2.5 bg-white/10 border border-white/20 text-white text-xs font-bold rounded-full tracking-widest uppercase">
                Sold Out
              </span>
            </div>
          )}

          {/* Quick Action Button */}
          <button 
            onClick={handleAddToCart}
            disabled={product.quantity === 0}
            className="absolute bottom-4 right-4 w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-primary-500/40 translate-y-20 group-hover:translate-y-0 transition-all duration-500 hover:bg-primary-400 hover:scale-110 active:scale-95 disabled:hidden"
          >
            <ShoppingCart size={20} />
          </button>
        </div>

        {/* Product Details */}
        <div className="px-2 pb-2">
          <div className="flex items-center justify-between mb-3">
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
              CATEGORY_STYLES[product.category] || 'bg-dark-600 text-gray-400 border-white/5'
            )}>
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-earth-400">
              <Star size={12} className="fill-earth-400" />
              <span className="text-[10px] font-bold">4.8</span>
            </div>
          </div>

          <h3 className="text-white font-display font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary-400 transition-colors">
            {product.title}
          </h3>

          <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Price</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-display font-black text-white">
                  ₹{product.price?.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-gray-500 line-through decoration-red-500/50">
                  ₹{(product.price * 1.2).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 group-hover:text-primary-400 transition-colors">
              DETAILS
              <ArrowUpRight size={14} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
