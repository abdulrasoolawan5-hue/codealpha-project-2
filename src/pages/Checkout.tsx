import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, getSessionId } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'

interface FormData {
  full_name: string
  email: string
  phone: string
  shipping_address: string
  city: string
  postal_code: string
}

export default function Checkout() {
  const { items, totalPrice, cart, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>({
    full_name: '', email: user?.email || '', phone: '',
    shipping_address: '', city: '', postal_code: '',
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [submitting, setSubmitting] = useState(false)

  if (items.length === 0 && !submitting) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-semibold mb-2">Your cart is empty</h1>
        <Link to="/" className="btn btn-primary mt-4">Browse products</Link>
      </div>
    )
  }

  const validate = (): boolean => {
    const e: Partial<FormData> = {}
    if (!formData.full_name.trim()) e.full_name = 'Full name is required.'
    if (!formData.email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Enter a valid email address.'
    if (!formData.phone.trim()) e.phone = 'Phone is required.'
    if (!formData.shipping_address.trim()) e.shipping_address = 'Shipping address is required.'
    if (!formData.city.trim()) e.city = 'City is required.'
    if (!formData.postal_code.trim()) e.postal_code = 'Postal code is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !cart) return
    setSubmitting(true)

    const sessionId = getSessionId()
    const orderData: Record<string, unknown> = {
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      shipping_address: formData.shipping_address,
      city: formData.city,
      postal_code: formData.postal_code,
      total_amount: totalPrice,
      status: 'pending',
    }
    if (user) orderData.user_id = user.id
    else orderData.session_id = sessionId

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select('*')
      .single()

    if (orderError || !order) {
      setSubmitting(false)
      return
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product?.name || '',
      unit_price: item.product?.price || 0,
      quantity: item.quantity,
    }))

    await supabase.from('order_items').insert(orderItems)

    // Decrement stock
    for (const item of items) {
      if (item.product) {
        const newStock = Math.max(0, item.product.stock - item.quantity)
        await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id)
      }
    }

    await clearCart()
    navigate(`/order/${order.id}`)
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) setErrors({ ...errors, [field]: undefined })
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6" noValidate>
        <div className="flex-1 bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
          <h2 className="font-heading text-xl font-semibold pb-3 border-b border-neutral-200">Shipping Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full name <span className="text-red-500">*</span></label>
              <input value={formData.full_name} onChange={(e) => handleChange('full_name', e.target.value)} className="input" />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email <span className="text-red-500">*</span></label>
              <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className="input" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone <span className="text-red-500">*</span></label>
              <input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className="input" />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">City <span className="text-red-500">*</span></label>
              <input value={formData.city} onChange={(e) => handleChange('city', e.target.value)} className="input" />
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Postal code <span className="text-red-500">*</span></label>
              <input value={formData.postal_code} onChange={(e) => handleChange('postal_code', e.target.value)} className="input" />
              {errors.postal_code && <p className="text-xs text-red-500 mt-1">{errors.postal_code}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Shipping address <span className="text-red-500">*</span></label>
              <textarea rows={3} value={formData.shipping_address} onChange={(e) => handleChange('shipping_address', e.target.value)} className="input resize-none" />
              {errors.shipping_address && <p className="text-xs text-red-500 mt-1">{errors.shipping_address}</p>}
            </div>
          </div>
        </div>

        <aside className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 lg:sticky lg:top-20 space-y-4">
            <h2 className="font-heading text-xl font-semibold">Order Summary</h2>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 pb-3 border-b border-neutral-200 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{item.product?.name}</span>
                    <span className="text-xs text-neutral-400">{item.quantity} × ${Number(item.product?.price || 0).toFixed(2)}</span>
                  </div>
                  <span className="font-semibold text-primary">${Number((item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary btn-block btn-lg">
              {submitting ? 'Placing order...' : 'Place order'}
            </button>
          </div>
        </aside>
      </form>
    </div>
  )
}
