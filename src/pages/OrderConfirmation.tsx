import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Order, OrderItem } from '@/types'

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase.from('orders').select('*').eq('id', id).maybeSingle().then(async ({ data }) => {
      if (!data) { setLoading(false); return }
      setOrder(data as Order)
      const { data: oi } = await supabase.from('order_items').select('*').eq('order_id', id)
      setItems(oi as OrderItem[] || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="animate-pulse h-96 bg-neutral-200 rounded-xl" />

  if (!order) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-semibold mb-2">Order not found</h1>
        <Link to="/" className="btn btn-primary mt-4">Back to shop</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="flex justify-center mb-4">
        <CheckCircle size={64} className="text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
      <p className="text-neutral-500 mb-8">Thank you for your purchase. Your order number is <strong className="text-neutral-800">#{order.id.slice(0, 8)}</strong>.</p>

      <div className="bg-white rounded-xl border border-neutral-200 p-6 text-left space-y-6">
        <div>
          <h2 className="font-heading text-lg font-semibold mb-3 pb-2 border-b border-neutral-200">Shipping To</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between"><span className="text-neutral-400">Name</span><span>{order.full_name}</span></div>
            <div className="flex justify-between"><span className="text-neutral-400">Email</span><span>{order.email}</span></div>
            <div className="flex justify-between"><span className="text-neutral-400">Phone</span><span>{order.phone}</span></div>
            <div className="flex justify-between"><span className="text-neutral-400">City</span><span>{order.city} {order.postal_code}</span></div>
            <div className="sm:col-span-2 flex justify-between"><span className="text-neutral-400">Address</span><span>{order.shipping_address}</span></div>
          </div>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold mb-3 pb-2 border-b border-neutral-200">Order Items</h2>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 text-sm pb-2 border-b border-neutral-100 last:border-0">
                <div>
                  <span className="font-medium">{item.product_name}</span>
                  <span className="text-neutral-400 ml-2">{item.quantity} × ${Number(item.unit_price).toFixed(2)}</span>
                </div>
                <span className="font-semibold text-primary">${Number(item.unit_price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center pt-4 mt-2">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">${Number(order.total_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-neutral-400 text-sm">Status</span>
            <span className="badge badge-success capitalize">{order.status}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-center mt-8 flex-wrap">
        <Link to="/" className="btn btn-primary btn-lg">Continue shopping</Link>
      </div>
    </div>
  )
}
