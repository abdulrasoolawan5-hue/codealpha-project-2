export interface Category {
  id: string
  name: string
  slug: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  stock: number
  image_url: string | null
  category_id: string
  is_active: boolean
  created_at: string
  category?: Category
}

export interface Cart {
  id: string
  user_id: string | null
  session_id: string | null
  created_at: string
}

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  quantity: number
  created_at: string
  product?: Product
}

export interface Order {
  id: string
  user_id: string | null
  session_id: string | null
  full_name: string
  email: string
  phone: string
  shipping_address: string
  city: string
  postal_code: string
  total_amount: number
  status: string
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  unit_price: number
  quantity: number
  created_at: string
}

export interface CartWithItems extends Cart {
  items: CartItem[]
}
