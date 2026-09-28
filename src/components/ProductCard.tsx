import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Check } from 'lucide-react'
import type { Product } from '@/types'
import { useCart } from '@/context/CartContext'

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const [toast, setToast] = useState<{ msg: string; isError: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  const inStock = product.stock > 0

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!inStock) return
    setLoading(true)
    const { error } = await addToCart(product, 1)
    setLoading(false)
    if (error) {
      setToast({ msg: error, isError: true })
    } else {
      setToast({ msg: `Added ${product.name} to cart.`, isError: false })
    }
    setTimeout(() => setToast(null), 3500)
  }

  return (
    <article className="card card-hover flex flex-col group">
      <Link to={`/product/${product.slug}`} className="block aspect-square overflow-hidden bg-neutral-100">
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">
          {product.category?.name || ''}
        </span>
        <Link to={`/product/${product.slug}`} className="font-semibold text-neutral-800 text-sm leading-snug hover:text-primary transition-colors">
          {product.name}
        </Link>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-lg font-bold text-primary">
            ${Number(product.price).toFixed(2)}
          </span>
          {inStock ? (
            <span className="badge badge-success">In stock</span>
          ) : (
            <span className="badge badge-error">Out of stock</span>
          )}
        </div>
        {inStock ? (
          <>
            <button
              onClick={handleAdd}
              disabled={loading}
              className="btn btn-primary btn-block btn-sm mt-1"
            >
              {loading ? 'Adding...' : (
                <>
                  <ShoppingCart size={14} />
                  Add to cart
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
        ) : (
          <button className="btn btn-secondary btn-block btn-sm mt-1" disabled>
            Out of stock
          </button>
        )}
      </div>
    </article>
  )
}
