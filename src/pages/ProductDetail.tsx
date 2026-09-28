import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Check, ChevronRight, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types'
import { useCart } from '@/context/CartContext'
import ProductCard from '@/components/ProductCard'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [toast, setToast] = useState<{ msg: string; isError: boolean } | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) {
          setProduct(null)
          setLoading(false)
          return
        }
        const prod = data as Product
        setProduct(prod)
        if (prod.category_id) {
          const { data: rel } = await supabase
            .from('products')
            .select('*, category:categories(*)')
            .eq('category_id', prod.category_id)
            .eq('is_active', true)
            .neq('id', prod.id)
            .limit(4)
          setRelated(rel as Product[] || [])
        }
        setLoading(false)
      })
  }, [slug])

  const handleAdd = async () => {
    if (!product) return
    setAdding(true)
    const { error } = await addToCart(product, quantity)
    setAdding(false)
    if (error) {
      setToast({ msg: error, isError: true })
    } else {
      setToast({ msg: `Added ${quantity} × ${product.name} to cart.`, isError: false })
    }
    setTimeout(() => setToast(null), 3500)
  }

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-8 animate-pulse">
        <div className="aspect-square bg-neutral-200 rounded-xl flex-1 max-w-lg" />
        <div className="flex-1 space-y-4">
          <div className="h-4 bg-neutral-200 rounded w-1/4" />
          <div className="h-8 bg-neutral-200 rounded w-3/4" />
          <div className="h-6 bg-neutral-200 rounded w-1/3" />
          <div className="h-24 bg-neutral-200 rounded" />
          <div className="h-10 bg-neutral-200 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-semibold mb-2">Product not found</h1>
        <Link to="/" className="btn btn-primary mt-4">Back to shop</Link>
      </div>
    )
  }

  const inStock = product.stock > 0
  const lowStock = product.stock > 0 && product.stock <= 10

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6 flex-wrap" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary">Shop</Link>
        <ChevronRight size={14} />
        {product.category && (
          <>
            <Link to={`/?category=${product.category.slug}`} className="hover:text-primary">{product.category.name}</Link>
            <ChevronRight size={14} />
          </>
        )}
        <span className="text-neutral-800 font-medium">{product.name}</span>
      </nav>

      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary mb-6">
        <ArrowLeft size={16} />
        Back to products
      </Link>

      {/* Product detail */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:max-w-lg flex-shrink-0">
          <div className="aspect-square rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
            <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          {product.category && (
            <span className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">{product.category.name}</span>
          )}
          <h1 className="text-3xl font-bold text-neutral-900">{product.name}</h1>
          <p className="text-2xl font-bold text-primary">${Number(product.price).toFixed(2)}</p>

          <div>
            {inStock && !lowStock && <span className="badge badge-success">In stock ({product.stock} available)</span>}
            {lowStock && <span className="badge badge-warning">Low stock — only {product.stock} left</span>}
            {!inStock && <span className="badge badge-error">Out of stock</span>}
          </div>

          <div className="pt-2">
            <h2 className="text-lg font-semibold mb-1">Description</h2>
            <p className="text-neutral-600 leading-relaxed">{product.description}</p>
          </div>

          {inStock && (
            <>
              <div className="pt-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center border border-neutral-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                      min={1}
                      max={product.stock}
                      className="w-14 text-center border-x border-neutral-200 py-2 text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="text-xs text-neutral-400">Max: {product.stock}</span>
                </div>
              </div>

              <button onClick={handleAdd} disabled={adding} className="btn btn-primary btn-lg btn-block mt-2">
                {adding ? 'Adding...' : (
                  <>
                    <ShoppingCart size={18} />
                    Add to cart — ${Number(product.price * quantity).toFixed(2)}
                  </>
                )}
              </button>
              {toast && (
                <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'} flex items-center gap-1.5`}>
                  {toast.isError ? null : <Check size={14} />}
                  {toast.msg}
                </div>
              )}
            </>
          )}
          {!inStock && (
            <button className="btn btn-secondary btn-lg btn-block" disabled>Out of stock</button>
          )}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">You may also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
