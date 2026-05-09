import React, { useEffect, useState, useContext, useRef } from 'react'
import axios from 'axios'
import Navbar from '../shared/Navbar'
import ProductCard from '../shared/ProductCard'
import Footer from '../shared/Footer'
import { CartContext } from '../context/CartContext'
import {
  Filter, Search, X, ChevronDown, Star, ShieldCheck, TrendingUp,
  Sparkles, ChefHat, Palette, Package, Grid, LayoutList
} from 'lucide-react'

const Shop = () => {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [mainCategory, setMainCategory] = useState('Craft')
  const [selectedSubCats, setSelectedSubCats] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [priceRange, setPriceRange] = useState(10000)
  const [sortBy, setSortBy] = useState('newest')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const sortRef = useRef(null)

  const { add } = useContext(CartContext)

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      try {
        const [prodRes, catRes] = await Promise.all([
          axios.get('/api/v1/products'),
          axios.get('/api/v1/site/categories')
        ])

        // Products
        const raw = prodRes.data
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.data?.products)
              ? raw.data.products
              : []
        setProducts(list)
        setFilteredProducts(list)

        // Categories
        const catList = catRes.data?.data || []
        setCategories(catList)
      } catch (err) {
        console.error('Failed to fetch data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [])

  // Grouped Category Data for UI
  const categoryData = {
    Craft: {
      label: 'Handmade Crafts',
      subCategories: categories.filter(c => c.marketplace === 'craft' && c.isActive).map(c => c.name)
    },
    Food: {
      label: 'Home-Made Food',
      subCategories: categories.filter(c => c.marketplace === 'food' && c.isActive).map(c => c.name)
    }
  }

  useEffect(() => {
    let result = products.filter(p => {
      const categoryName = p.categoryId?.name || p.category?.name || ''
      const pMarketplace = p.marketplace || (p.categoryId?.marketplace === 'craft' ? 'Craft' : 'Food') || 'Craft'
      const pSub = p.categoryId?.name || p.category?.name || ''

      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = !query ||
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.sellerId?.shopName && p.sellerId.shopName.toLowerCase().includes(query)) ||
        (categoryName && categoryName.toLowerCase().includes(query))

      const matchesPrice = p.price <= priceRange

      if (query) {
        return matchesSearch && matchesPrice
      } else {
        const matchesMain = pMarketplace.toLowerCase() === mainCategory.toLowerCase()
        const matchesSub = selectedSubCats.length === 0 || selectedSubCats.includes(pSub)
        return matchesMain && matchesSub && matchesPrice
      }
    })

    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price)
    if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price)
    if (sortBy === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0))

    setFilteredProducts(result)
  }, [mainCategory, selectedSubCats, searchQuery, priceRange, sortBy, products, categories])

  const toggleSubCat = (sub) => {
    setSelectedSubCats(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    )
  }

  const handleMainCatChange = (cat) => {
    setMainCategory(cat)
    setSelectedSubCats([])
  }

  const clearFilters = () => {
    setSearchQuery('')
    setPriceRange(10000)
    setSelectedSubCats([])
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: <Sparkles size={16} /> },
    { value: 'price-low', label: 'Price: Low to High', icon: <TrendingUp size={16} /> },
    { value: 'price-high', label: 'Price: High to Low', icon: <TrendingUp size={16} className="rotate-180" /> },
    { value: 'rating', label: 'Top Rated', icon: <Star size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* CONVERSION-FOCUSED HERO */}
      <section className="bg-gradient-to-br from-coral/10 via-white to-coral/5 py-12 mt-4 border-y border-coral/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-coral" size={20} />
              <span className="text-sm font-bold text-gray-700">100% Verified Sellers</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="text-coral" fill="currentColor" size={20} />
              <span className="text-sm font-bold text-gray-700">4.8 Average Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="text-coral" size={20} />
              <span className="text-sm font-bold text-gray-700">Fast Delivery</span>
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-3">
              Discover <span className="text-coral">Handmade</span> Treasures
            </h1>
            <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
              Support Pakistani women entrepreneurs. Every purchase makes a difference.
            </p>
          </div>

          {/* Search Bar - BIG & PROMINENT */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} md={24} />
              <input
                id="shop-search"
                name="shop-search"
                type="text"
                placeholder="Search..."
                className="w-full pl-12 md:pl-16 pr-4 md:pr-24 py-4 md:py-5 bg-white border-2 border-gray-200 rounded-2xl text-sm md:text-base font-medium shadow-lg focus:outline-none focus:ring-4 focus:ring-coral/20 focus:border-coral transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 px-6 py-3 bg-coral text-white rounded-xl font-bold hover:bg-coral/90 transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* Category Tabs - Large & Attractive */}
          <div className="flex justify-center">
            <div className="inline-flex flex-col sm:flex-row gap-2 sm:gap-3 bg-white p-2 rounded-2xl shadow-lg w-full sm:w-auto">
              {['Craft', 'Food'].map(cat => (
                <button
                  key={cat}
                  onClick={() => handleMainCatChange(cat)}
                  className={`px-4 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all ${mainCategory === cat
                    ? 'bg-coral text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {cat === 'Craft' ? <Palette size={18} /> : <ChefHat size={18} />}
                    {cat} Marketplace
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN SHOP SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">

          {/* FILTERS SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Filter size={20} className="text-coral" />
                  Filters
                </h2>
                {(selectedSubCats.length > 0 || searchQuery || priceRange < 10000) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-coral hover:underline font-bold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Categories</h3>
                <div className="space-y-2">
                  {(categoryData[mainCategory]?.subCategories || []).map(sub => (
                    <label
                      key={sub}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        id={`filter-${sub}`}
                        name={`filter-${sub}`}
                        type="checkbox"
                        checked={selectedSubCats.includes(sub)}
                        onChange={() => toggleSubCat(sub)}
                        className="w-4 h-4 rounded border-gray-300 text-coral focus:ring-coral accent-coral"
                      />
                      <span className="text-sm font-medium text-gray-700">{sub}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">Price Range</h3>
                  <span className="text-sm font-bold text-coral">PKR {priceRange.toLocaleString()}</span>
                </div>
                <input
                  id="price-range"
                  name="price-range"
                  type="range"
                  min="500"
                  max="10000"
                  step="500"
                  className="w-full accent-coral h-2 bg-gray-200 rounded-lg cursor-pointer"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>PKR 500</span>
                  <span>PKR 10,000</span>
                </div>
              </div>
            </div>
          </aside>

          {/* PRODUCTS SECTION */}
          <main className="lg:col-span-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden w-full mb-6 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 flex items-center justify-center gap-2"
            >
              <Filter size={18} />
              Filters & Sort
            </button>

            {/* Results Bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600 font-medium">
                <span className="font-bold text-gray-900">{filteredProducts.length}</span> products found
              </p>

              <div className="flex items-center gap-3">
                {/* View Toggle - Hidden on Mobile */}
                <div className="hidden sm:flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                      ? 'bg-coral text-white'
                      : 'text-gray-400 hover:text-gray-600'
                      }`}
                    title="Grid View"
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                      ? 'bg-coral text-white'
                      : 'text-gray-400 hover:text-gray-600'
                      }`}
                    title="List View"
                  >
                    <LayoutList size={18} />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="relative" ref={sortRef}>
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:border-coral transition-colors"
                  >
                    Sort: {sortOptions.find(o => o.value === sortBy)?.label}
                    <ChevronDown size={16} className={`transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSortOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1">
                      {sortOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSortBy(opt.value)
                            setIsSortOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${sortBy === opt.value ? 'text-coral bg-coral/5' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {opt.icon}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-12 h-12 border-3 border-coral/20 border-t-coral rounded-full animate-spin"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4'
                : 'flex flex-col gap-4'
              }>
                {filteredProducts.map(p => (
                  <ProductCard key={p._id} product={p} viewMode={viewMode} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center">
                <Package size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-coral text-white rounded-xl font-bold hover:bg-coral/90"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </section>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-black">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Categories</h3>
                <div className="space-y-2">
                  {(categoryData[mainCategory]?.subCategories || []).map(sub => (
                    <label key={sub} className="flex items-center gap-3 p-2">
                      <input
                        id={`mobile-filter-${sub}`}
                        name={`mobile-filter-${sub}`}
                        type="checkbox"
                        checked={selectedSubCats.includes(sub)}
                        onChange={() => toggleSubCat(sub)}
                        className="w-4 h-4 rounded border-gray-300 text-coral focus:ring-coral accent-coral"
                      />
                      <span className="text-sm font-medium">{sub}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold">Price Range</h3>
                  <span className="text-sm font-bold text-coral">PKR {priceRange.toLocaleString()}</span>
                </div>
                <input
                  id="mobile-price-range"
                  name="mobile-price-range"
                  type="range"
                  min="500"
                  max="10000"
                  step="500"
                  className="w-full accent-coral"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                />
              </div>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-3 bg-coral text-white rounded-xl font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default Shop
