import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Order, OrderItem } from '@/types'

export default function OrderHistory() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<(Order & { items?: OrderItem[] })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data as (Order & { items?: OrderItem[] })[] || [])
        setLoading(false)
      })
  }, [user])

  if (authLoading) return null
  if (!user) return <Navigate to="/login" replace />

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-neutral-500 mt-1">Your order history</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-neutral-200 rounded-xl" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-6 animate-fade-in">
          {orders.map((order) => (
            <div key={order.id} className="card p-6">
              <div className="flex justify-between items-start pb-4 border-b border-neutral-200 mb-4">
                <div>
                  <span className="font-heading text-lg font-semibold block">Order #{order.id.slice(0, 8)}</span>
                  <span className="text-sm text-neutral-400">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                <span className="badge badge-success capitalize">{order.status}</span>
              </div>
              <ul className="space-y-2 mb-4">
                {order.items?.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 text-sm pb-2 border-b border-neutral-100 last:border-0">
                    <div>
                      <span className="font-medium">{item.product_name}</span>
                      <span className="text-neutral-400 ml-2">{item.quantity} × ${Number(item.unit_price).toFixed(2)}</span>
                    </div>
                    <span className="font-semibold text-primary">${Number(item.unit_price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center pt-4 border-t border-neutral-200 flex-wrap gap-2">
                <span className="text-sm text-neutral-400">Shipping to: {order.full_name}, {order.city} {order.postal_code}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-400">Total</span>
                  <span className="text-xl font-bold text-primary">${Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-neutral-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-neutral-500 mb-6">When you place an order, it will appear here.</p>
          <Link to="/" className="btn btn-primary">Start shopping</Link>
        </div>
      )}
    </div>
  )
}
