import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart } from '@/context/CartContext'

export default function CartPage() {
  const { items, loading, updateQuantity, removeItem, totalPrice, itemCount } = useCart()

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-neutral-200 rounded w-1/4" />
        <div className="h-40 bg-neutral-200 rounded-xl" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag size={48} className="mx-auto text-neutral-300 mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Your cart is empty</h1>
        <p className="text-neutral-500 mb-6">Browse our products and add something you like.</p>
        <Link to="/" className="btn btn-primary">Continue shopping</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Items */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <thead className="bg-neutral-100">
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Subtotal</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={item.product?.image_url || '/placeholder.svg'} alt={item.product?.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                      <div>
                        <Link to={`/product/${item.product?.slug}`} className="font-semibold text-sm hover:text-primary">{item.product?.name}</Link>
                        <p className="text-xs text-neutral-400">{item.product?.category?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold text-primary">${Number(item.product?.price || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center border border-neutral-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, Math.min(item.product?.stock || 1, item.quantity + 1))}
                        className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-primary">${Number((item.product?.price || 0) * item.quantity).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-neutral-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${item.product?.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 lg:sticky lg:top-20 space-y-4">
            <h2 className="font-heading text-xl font-semibold">Order Summary</h2>
            <div className="flex justify-between text-sm text-neutral-600">
              <span>Items</span>
              <span>{itemCount}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
            </div>
            <Link to="/checkout" className="btn btn-primary btn-block btn-lg">
              Checkout <ArrowRight size={16} />
            </Link>
            <Link to="/" className="btn btn-secondary btn-block">Continue shopping</Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
