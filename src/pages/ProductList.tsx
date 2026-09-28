import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Category, Product } from '@/types'
import ProductCard from '@/components/ProductCard'

const PER_PAGE = 12

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const categorySlug = searchParams.get('category') || ''
  const searchQuery = searchParams.get('q') || ''
  const sort = searchParams.get('sort') || ''

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories(data || [])
    })
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('products').select('*, category:categories(*)', { count: 'exact' }).eq('is_active', true)

    if (categorySlug) {
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).maybeSingle()
      if (cat) query = query.eq('category_id', cat.id)
    }
    if (searchQuery) query = query.ilike('name', `%${searchQuery}%`)

    if (sort === 'price_low') query = query.order('price', { ascending: true })
    else if (sort === 'price_high') query = query.order('price', { ascending: false })
    else if (sort === 'name') query = query.order('name', { ascending: true })
    else query = query.order('created_at', { ascending: false })

    query = query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
    const { data, count } = await query
    setProducts(data as Product[] || [])
    setTotalPages(Math.ceil((count || 0) / PER_PAGE))
    setLoading(false)
  }, [categorySlug, searchQuery, sort, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { setPage(1) }, [categorySlug, searchQuery, sort])

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    setSearchParams(params)
  }

  const clearFilters = () => setSearchParams(new URLSearchParams())

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">
          {searchQuery ? `Results for "${searchQuery}"` : categorySlug ? categories.find(c => c.slug === categorySlug)?.name || 'Shop' : 'All Products'}
        </h1>
        <p className="text-neutral-500 mt-1">Browse our full catalogue</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className="lg:w-60 flex-shrink-0">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 lg:sticky lg:top-20">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-neutral-700">
              <SlidersHorizontal size={16} />
              Filters
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Search</label>
                <div className="relative">
                  <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => updateParam('q', e.target.value)}
                    placeholder="Search..."
                    className="input pl-8"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Category</label>
                <select value={categorySlug} onChange={(e) => updateParam('category', e.target.value)} className="input">
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Sort by</label>
                <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="input">
                  <option value="">Newest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
              {(searchQuery || categorySlug || sort) && (
                <button onClick={clearFilters} className="btn btn-secondary btn-block btn-sm">
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-neutral-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-neutral-200 rounded w-1/3" />
                    <div className="h-4 bg-neutral-200 rounded w-2/3" />
                    <div className="h-6 bg-neutral-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-4 mt-8" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn btn-secondary btn-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-neutral-500">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn btn-secondary btn-sm"
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <Search size={48} className="mx-auto text-neutral-300 mb-4" />
              <h2 className="text-xl font-semibold text-neutral-700 mb-2">No products found</h2>
              <p className="text-neutral-500 mb-6">Try adjusting your search or filters.</p>
              <button onClick={clearFilters} className="btn btn-primary">Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
