import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase, getSessionId } from '@/lib/supabase'
import type { Cart, CartItem, Product } from '@/types'

interface CartContextValue {
  cart: Cart | null
  items: CartItem[]
  itemCount: number
  totalPrice: number
  loading: boolean
  addToCart: (product: Product, quantity?: number) => Promise<{ error: string | null }>
  updateQuantity: (itemId: string, quantity: number) => Promise<{ error: string | null }>
  removeItem: (itemId: string) => Promise<{ error: string | null }>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCart = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const sessionId = getSessionId()

    let query = supabase.from('carts').select('*')
    if (session?.user) {
      query = query.eq('user_id', session.user.id)
    } else {
      query = query.eq('session_id', sessionId).is('user_id', null)
    }
    query = query.order('created_at', { ascending: false }).limit(1)

    const { data: existingCart } = await query.maybeSingle()

    let cartRow = existingCart as Cart | null

    if (!cartRow) {
      const insertData: Record<string, unknown> = {}
      if (session?.user) {
        insertData.user_id = session.user.id
      } else {
        insertData.session_id = sessionId
      }
      const { data: newCart, error } = await supabase
        .from('carts')
        .insert(insertData)
        .select('*')
        .single()
      if (error) {
        setLoading(false)
        return
      }
      cartRow = newCart as Cart
    }

    setCart(cartRow)

    if (cartRow) {
      const { data: cartItems } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('cart_id', cartRow.id)
      setItems((cartItems as CartItem[]) || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const addToCart = useCallback(
    async (product: Product, quantity = 1): Promise<{ error: string | null }> => {
      if (!cart) return { error: 'Cart not loaded yet. Please try again.' }
      if (quantity < 1) return { error: 'Quantity must be at least 1.' }

      const existing = items.find((i) => i.product_id === product.id)
      const currentQty = existing?.quantity || 0
      const newQty = currentQty + quantity

      if (newQty > product.stock) {
        const available = product.stock - currentQty
        if (available <= 0) {
          return { error: `You already have all ${currentQty} available units in your cart.` }
        }
        return { error: `Only ${available} more available (stock: ${product.stock}).` }
      }

      if (existing) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQty })
          .eq('id', existing.id)
        if (error) return { error: 'Failed to update cart.' }
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({ cart_id: cart.id, product_id: product.id, quantity })
        if (error) return { error: 'Failed to add item to cart.' }
      }

      await fetchCart()
      return { error: null }
    },
    [cart, items, fetchCart]
  )

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number): Promise<{ error: string | null }> => {
      if (quantity < 1) return { error: 'Quantity must be at least 1.' }
      const item = items.find((i) => i.id === itemId)
      if (item?.product && quantity > item.product.stock) {
        return { error: `Only ${item.product.stock} units available.` }
      }
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId)
      if (error) return { error: 'Failed to update quantity.' }
      await fetchCart()
      return { error: null }
    },
    [items, fetchCart]
  )

  const removeItem = useCallback(
    async (itemId: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId)
      if (error) return { error: 'Failed to remove item.' }
      await fetchCart()
      return { error: null }
    },
    [fetchCart]
  )

  const clearCart = useCallback(async () => {
    if (!cart) return
    await supabase.from('cart_items').delete().eq('cart_id', cart.id)
    await fetchCart()
  }, [cart, fetchCart])

  const refreshCart = useCallback(async () => {
    await fetchCart()
  }, [fetchCart])

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ cart, items, itemCount, totalPrice, loading, addToCart, updateQuantity, removeItem, clearCart, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
