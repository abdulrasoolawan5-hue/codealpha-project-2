import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { ShoppingCart, Menu, X, LogOut, Package, User } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'

export default function Layout() {
  const { itemCount } = useCart()
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-2xl text-accent" aria-hidden="true">
                <ShoppingCart className="inline" size={24} />
              </span>
              <span className="font-heading text-xl font-bold text-primary">Commerce</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/" className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-primary transition-colors">
                Shop
              </Link>
              <Link to="/cart" className="relative px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-primary transition-colors">
                <span className="flex items-center gap-1.5">
                  <ShoppingCart size={18} />
                  Cart
                  {itemCount > 0 && (
                    <span className="badge bg-accent text-white min-w-[20px] h-5 px-1.5 text-xs justify-center">
                      {itemCount}
                    </span>
                  )}
                </span>
              </Link>
              {user ? (
                <>
                  <Link to="/orders" className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-primary transition-colors flex items-center gap-1.5">
                    <Package size={18} />
                    My Orders
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <LogOut size={18} />
                    Logout ({user.email?.split('@')[0]})
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-primary transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Register
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="md:hidden border-t border-neutral-200 bg-white px-4 py-3 flex flex-col gap-1 animate-slide-up">
            <Link to="/" className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100" onClick={() => setMenuOpen(false)}>
              Shop
            </Link>
            <Link to="/cart" className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 flex items-center justify-between" onClick={() => setMenuOpen(false)}>
              Cart
              {itemCount > 0 && (
                <span className="badge bg-accent text-white">{itemCount}</span>
              )}
            </Link>
            {user ? (
              <>
                <Link to="/orders" className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100" onClick={() => setMenuOpen(false)}>
                  My Orders
                </Link>
                <button onClick={handleSignOut} className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 text-left">
                  Logout ({user.email?.split('@')[0]})
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap justify-between items-center gap-2 text-sm text-neutral-500">
          <p>&copy; {new Date().getFullYear()} Commerce. All rights reserved.</p>
          <p className="text-neutral-400">Built with React, Vite &amp; Supabase</p>
        </div>
      </footer>
    </div>
  )
}
