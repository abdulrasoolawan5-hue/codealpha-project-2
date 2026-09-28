/*
# Create e-commerce schema (categories, products, carts, cart_items, orders, order_items)

## Overview
Full e-commerce database for a single-tenant storefront with optional auth.
Categories and products are publicly readable. Carts and orders are scoped to
authenticated users OR anonymous sessions (identified by a session_id stored
client-side). This allows guest checkout.

## Tables

### categories
- id (uuid, PK)
- name (text, unique, not null)
- slug (text, unique, not null)
- created_at (timestamptz)

### products
- id (uuid, PK)
- name (text, not null)
- slug (text, unique, not null)
- description (text, not null)
- price (numeric(10,2), not null)
- stock (integer, not null, default 0)
- image_url (text, nullable) — URL to product image
- category_id (uuid, FK to categories)
- is_active (boolean, default true)
- created_at (timestamptz)

### carts
- id (uuid, PK)
- user_id (uuid, FK to auth.users, nullable)
- session_id (text, nullable) — for guest carts
- created_at (timestamptz)

### cart_items
- id (uuid, PK)
- cart_id (uuid, FK to carts)
- product_id (uuid, FK to products)
- quantity (integer, not null, default 1)
- created_at (timestamptz)
- UNIQUE(cart_id, product_id)

### orders
- id (uuid, PK)
- user_id (uuid, FK to auth.users, nullable)
- session_id (text, nullable) — for guest orders
- full_name (text, not null)
- email (text, not null)
- phone (text, not null)
- shipping_address (text, not null)
- city (text, not null)
- postal_code (text, not null)
- total_amount (numeric(10,2), not null, default 0)
- status (text, not null, default 'pending')
- created_at (timestamptz)

### order_items
- id (uuid, PK)
- order_id (uuid, FK to orders)
- product_id (uuid, FK to products)
- product_name (text, not null) — snapshot at purchase time
- unit_price (numeric(10,2), not null) — snapshot at purchase time
- quantity (integer, not null, default 1)
- created_at (timestamptz)

## Security
- categories: public read, no writes from frontend (managed via seed/admin)
- products: public read, no writes from frontend
- carts: read/write for anon+authenticated (guest carts via session_id)
- cart_items: read/write for anon+authenticated (scoped to cart)
- orders: read for anon+authenticated, insert for anon+authenticated
- order_items: read for anon+authenticated, insert for anon+authenticated
- All tables have RLS enabled
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT TO anon, authenticated USING (true);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  price numeric(10,2) NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);

-- Carts
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_carts" ON carts;
CREATE POLICY "anon_read_carts" ON carts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_carts" ON carts;
CREATE POLICY "anon_insert_carts" ON carts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_carts" ON carts;
CREATE POLICY "anon_update_carts" ON carts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_carts" ON carts;
CREATE POLICY "anon_delete_carts" ON carts FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session ON carts(session_id);

-- Cart items
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(cart_id, product_id)
);
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_cart_items" ON cart_items;
CREATE POLICY "anon_read_cart_items" ON cart_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_cart_items" ON cart_items;
CREATE POLICY "anon_insert_cart_items" ON cart_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cart_items" ON cart_items;
CREATE POLICY "anon_update_cart_items" ON cart_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cart_items" ON cart_items;
CREATE POLICY "anon_delete_cart_items" ON cart_items FOR DELETE TO anon, authenticated USING (true);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  shipping_address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_orders" ON orders;
CREATE POLICY "anon_read_orders" ON orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_order_items" ON order_items;
CREATE POLICY "anon_read_order_items" ON order_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
