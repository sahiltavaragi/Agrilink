import { Link } from 'react-router-dom'
import { ArrowRight, Sprout, ShieldCheck, Truck, Star, Users, Package, TrendingUp, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

const CATEGORIES = [
  { name: 'Poultry Farming', emoji: '🐔', color: 'from-yellow-500/10 to-yellow-500/5', border: 'border-yellow-500/20', iconColor: 'text-yellow-500' },
  { name: 'Sheep/Goat Farming', emoji: '🐑', color: 'from-orange-500/10 to-orange-500/5', border: 'border-orange-500/20', iconColor: 'text-orange-500' },
  { name: 'Fish Farming', emoji: '🐟', color: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/20', iconColor: 'text-blue-500' },
  { name: 'Organic Fertilizers', emoji: '🌿', color: 'from-primary-500/10 to-primary-500/5', border: 'border-primary-500/20', iconColor: 'text-primary-500' },
  { name: 'Indoor Farming', emoji: '🏠', color: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/20', iconColor: 'text-purple-500' },
  { name: 'Outdoor Equipment', emoji: '🚜', color: 'from-earth-500/10 to-earth-500/5', border: 'border-earth-500/20', iconColor: 'text-earth-500' },
]

const STATS = [
  { icon: Users, label: 'Farmers Joined', value: '12,000+' },
  { icon: Package, label: 'Products Listed', value: '3,500+' },
  { icon: TrendingUp, label: 'Orders Completed', value: '28,000+' },
  { icon: Star, label: 'Avg. Rating', value: '4.8 / 5' },
]

const WHY_CARDS = [
  { icon: ShieldCheck, title: 'Verified Sellers', desc: 'All sellers are manually reviewed and approved by our team ensuring quality products.' },
  { icon: Sprout, title: '100% Organic', desc: 'All farming inputs are certified organic, safe for your soil and crops.' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Pan-India delivery network to reach your farm within 3–5 business days.' },
]

export default function HomePage() {
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .gt('quantity', 0)
        .limit(8)
      if (error) throw error
      return data
    },
  })

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-hero-pattern opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/10 via-dark-900/40 to-dark-900" />
        
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 -left-20 w-[400px] h-[400px] bg-earth-500/10 rounded-full blur-[100px]" 
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-bold mb-8 shadow-glow-green/10"
            >
              <Sprout size={16} className="animate-bounce" />
              <span>India's Most Trusted Organic Marketplace</span>
            </motion.div>

            <h1 className="font-display font-extrabold text-6xl sm:text-7xl xl:text-8xl text-white leading-[1] mb-8 tracking-tight">
              Grow Better <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600">
                Together
              </span>
            </h1>

            <p className="text-gray-400 text-xl md:text-2xl max-w-xl mb-12 leading-relaxed">
              Empowering farmers with high-quality organic inputs, direct from verified sellers. 
              Join 12,000+ farmers growing a greener India.
            </p>

            <div className="flex flex-wrap gap-5">
              <Link to="/products" className="group btn-primary text-lg px-10 py-5 shadow-glow-green/20">
                Start Shopping
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/community" className="btn-secondary text-lg px-10 py-5 bg-white/5 border-white/10 hover:bg-white/10">
                Join Community
              </Link>
            </div>

            {/* Quick Stats Overlay */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/5">
              {STATS.slice(0, 3).map(({ label, value }) => (
                <div key={label}>
                  <div className="text-2xl font-bold text-white mb-1">{value}</div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero Image / Visual Element */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group">
              <img 
                src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=800" 
                alt="Organic Farming"
                className="w-full h-[600px] object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
              
              <div className="absolute bottom-8 left-8 right-8 p-6 bg-dark-800/80 backdrop-blur-xl border border-white/10 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center shadow-glow-green">
                    <Star size={20} className="text-white fill-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold">4.8/5 Avg. Rating</div>
                    <div className="text-gray-400 text-sm">from 2,500+ farmer reviews</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-earth-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-primary-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-primary-500 font-bold uppercase tracking-[0.2em] text-xs mb-4"
              >
                Categories
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white">
                What are you <br /> looking for?
              </h2>
            </div>
            <Link to="/products" className="group flex items-center gap-3 text-gray-400 hover:text-white font-bold transition-all">
              <span>View All Categories</span>
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary-500 group-hover:bg-primary-500 transition-all">
                <ChevronRight size={20} className="group-hover:text-white" />
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {CATEGORIES.map(({ name, emoji, color, border }, idx) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  to={`/products?category=${encodeURIComponent(name)}`}
                  className={cn(
                    "group relative block h-full p-8 rounded-[2rem] border bg-gradient-to-br transition-all duration-500 overflow-hidden",
                    color, border, "hover:-translate-y-2 hover:shadow-2xl"
                  )}
                >
                  <div className="relative z-10 text-center">
                    <div className="text-5xl mb-6 group-hover:scale-125 transition-transform duration-500 block">
                      {emoji}
                    </div>
                    <p className="text-white text-sm font-bold leading-tight group-hover:text-primary-400 transition-colors">
                      {name}
                    </p>
                  </div>
                  {/* Decorative background circle */}
                  <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-32 bg-dark-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white">
              Trending <span className="text-primary-500">Inputs</span>
            </h2>
            <Link to="/products" className="hidden sm:flex items-center gap-2 text-primary-400 font-bold hover:text-primary-300 transition-colors">
              Explore Store <ArrowRight size={18} />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-4 space-y-4">
                  <div className="w-full aspect-square bg-white/5 rounded-2xl animate-pulse" />
                  <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : featuredProducts?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-dark-800/50 rounded-[3rem] border border-white/5">
              <div className="w-20 h-20 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package size={32} className="text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Featured Products Yet</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-8">
                Be the first to list high-quality organic inputs on AgriLink.
              </p>
              <Link to="/profile" className="btn-primary px-8">Become a Seller</Link>
            </div>
          )}
        </div>
      </section>

      {/* Why AgriLink - Modern Grid */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-6">
              Empowering the Next Generation of Farmers
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              We bridge the gap between quality manufacturers and progressive farmers who care about soil health and productivity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {WHY_CARDS.map(({ icon: Icon, title, desc }, idx) => (
              <motion.div 
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="group p-10 rounded-[2.5rem] bg-dark-800/40 border border-white/5 hover:border-primary-500/30 transition-all duration-500"
              >
                <div className="w-20 h-20 bg-primary-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary-500 group-hover:shadow-glow-green transition-all duration-500">
                  <Icon size={32} className="text-primary-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-4">{title}</h3>
                <p className="text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Visual Banner */}
      <section className="pb-32 px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto relative rounded-[4rem] overflow-hidden bg-gradient-to-br from-primary-600 to-primary-900 p-12 md:p-24 text-center"
        >
          {/* Background Patterns */}
          <div className="absolute inset-0 bg-hero-pattern opacity-10 mix-blend-overlay" />
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black/20 rounded-full blur-[100px]" />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-8 leading-tight">
              Ready to grow your <br /> farming business?
            </h2>
            <p className="text-primary-50/80 text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed">
              Whether you are buying or selling, AgriLink provides the tools you need to succeed in organic farming.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/register" className="btn-primary bg-white text-primary-900 hover:bg-primary-50 px-12 py-5 text-lg shadow-2xl">
                Get Started Now
              </Link>
              <Link to="/products" className="btn-secondary bg-primary-800/40 border-white/20 text-white hover:bg-primary-800/60 px-12 py-5 text-lg">
                Browse Marketplace
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </Layout>
  )
}
