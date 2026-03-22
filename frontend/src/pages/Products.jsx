import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import Layout from '../components/Layout'

const CATEGORIES = [
  'All',
  'Poultry Farming',
  'Sheep/Goat Farming',
  'Fish Farming',
  'Organic Fertilizers',
  'Indoor Farming',
  'Outdoor Equipment',
]

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'created_at-desc' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Name A–Z', value: 'title-asc' },
]

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'All')
  const [sortBy, setSortBy] = useState('created_at-desc')
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    const q = searchParams.get('search') || ''
    const cat = searchParams.get('category') || 'All'
    if (q !== search) setSearch(q)
    if (cat !== category) setCategory(cat)
  }, [searchParams, search, category])

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search, category, sortBy, priceRange],
    queryFn: async () => {
      const [col, dir] = sortBy.split('-')
      let q = supabase
        .from('products')
        .select('*')
        .gte('price', priceRange[0])
        .lte('price', priceRange[1])
        .order(col, { ascending: dir === 'asc' })

      if (category !== 'All') q = q.eq('category', category)
      if (search.trim()) q = q.ilike('title', `%${search.trim()}%`)

      const { data, error } = await q.limit(48)
      if (error) throw error
      return data
    },
    placeholderData: [],
  })

  function applySearch(e) {
    e.preventDefault()
    setSearchParams({ ...(category !== 'All' && { category }), ...(search && { search }) })
  }

  function handleCategory(cat) {
    setCategory(cat)
    setSearchParams({ ...(cat !== 'All' && { category: cat }), ...(search && { search }) })
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-white mb-1">All Products</h1>
          <p className="text-gray-400">Browse {products?.length ?? '...'} organic farming products</p>
        </div>

        {/* Search + Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={applySearch} className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="input-field pl-10 pr-4 w-full"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); setSearchParams({}) }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X size={15} />
              </button>
            )}
          </form>

          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="input-field pr-10 appearance-none cursor-pointer min-w-[180px]"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          <button onClick={() => setFilterOpen(!filterOpen)}
            className="btn-secondary flex items-center gap-2 text-sm">
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div className="card p-6 mb-6 animate-slide-up">
            <h3 className="font-semibold text-white mb-3 text-sm">Price Range</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">₹{priceRange[0].toLocaleString()}</span>
              <input type="range" min={0} max={50000} step={500}
                value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="flex-1 accent-primary-500"
              />
              <span className="text-sm text-gray-400">₹{priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => handleCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                category === cat
                  ? 'bg-primary-600 text-white shadow-glow-green'
                  : 'bg-dark-700/60 text-gray-400 border border-white/10 hover:border-primary-600/40 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton h-48" />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-20 card">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="font-semibold text-white mb-2">No products found</h3>
            <p className="text-gray-400 text-sm">Try a different search or category</p>
            <button onClick={() => { setSearch(''); setCategory('All'); setSearchParams({}) }}
              className="btn-secondary mt-4 text-sm">
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
