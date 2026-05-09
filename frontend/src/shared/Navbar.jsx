import React, { useContext, useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { CartContext } from '../context/CartContext'
import {
  Search,
  ShoppingCart,
  User,
  LogOut,
  Menu,
  X,
  Home,
  ShoppingBag,
  Store,
  ChevronDown,
  LayoutDashboard,
  Layout,
  Package
} from 'lucide-react'
import logo from '../assets/logo.png'
import Button from './Button'

const Navbar = () => {
  const { user, logout } = useContext(AuthContext)
  const { items } = useContext(CartContext)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const getMediaUrl = (pathValue) => {
    if (!pathValue) return null;
    const pathStr = String(pathValue).replace(/\\/g, '/');
    if (pathStr.startsWith('http') || pathStr.startsWith('data:')) return pathStr;
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    const uploadsIndex = pathStr.indexOf('/uploads/');
    const cleanPath = uploadsIndex !== -1 ? pathStr.substring(uploadsIndex) : `/uploads/${pathStr.split('/').pop()}`;
    return `${backendUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  }

  const handleSearch = (e) => {
    const query = e.target.value
    if (location.pathname === '/shop') {
      navigate(`/shop?search=${encodeURIComponent(query)}`, { replace: true })
    } else if (e.key === 'Enter') {
      navigate(`/shop?search=${encodeURIComponent(query)}`)
      setIsSearchOpen(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserDropdownOpen && !event.target.closest('.user-dropdown-container')) {
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserDropdownOpen])

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          {/* Logo & Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <img src={logo} alt="Homedify" className="h-10 md:h-14 w-auto object-contain transition-transform group-hover:scale-110" />
            </Link>
          </div>

          {/* Center Navigation - Desktop */}
          <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-10 flex-1">
            <Link to="/" className="text-sm font-bold text-gray-600 navbar-link transition-colors flex items-center gap-1">
              <Home size={18} /> Home
            </Link>
            <Link to="/shop" className="text-sm font-bold text-gray-600 navbar-link transition-colors flex items-center gap-1">
              <ShoppingBag size={18} /> Shop
            </Link>
            <Link to="/seller/register" className="text-sm font-bold text-gray-600 navbar-link transition-colors flex items-center gap-1">
              <Store size={18} /> Become a Seller
            </Link>
          </nav>

          {/* Search & Actions - Desktop */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 flex-shrink-0">
            <div className="relative group">
              <input
                id="global-search"
                name="global-search"
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-sm focus:ring-2 focus:ring-coral/20 focus:border-coral outline-none transition-all w-48 lg:w-64"
                placeholder="Search..."
                onKeyUp={handleSearch}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-coral" size={16} />
            </div>

            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-coral hover:bg-coral-light rounded-full transition-all">
              <ShoppingCart size={22} />
              {items.length > 0 && (
                <span className="absolute top-0 right-0 bg-coral text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                  {items.length}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                <div className="flex flex-col items-end hidden lg:flex">
                  <span className="text-sm font-bold text-gray-900">{user.name || 'User'}</span>
                  <span className="text-[10px] text-coral font-bold uppercase tracking-tighter">{user.role}</span>
                </div>
                <div className="relative user-dropdown-container">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="w-10 h-10 rounded-full bg-coral-light flex items-center justify-center text-coral font-bold cursor-pointer border-2 border-coral/20 hover:border-coral transition-all overflow-hidden"
                  >
                    {user.picture ? (
                      <img 
                        src={getMediaUrl(user.picture)} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <User size={20} style={{ display: user.picture ? 'none' : 'block' }} />
                  </button>
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 shadow-2xl rounded-2xl py-2 transform origin-top-right z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {user.role === 'admin' && (
                        <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-coral-light hover:text-coral" onClick={() => setIsUserDropdownOpen(false)}>Admin Panel</Link>
                      )}
                      {user.role === 'seller' && (
                        <>
                          <Link to="/seller/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-coral-light hover:text-coral" onClick={() => setIsUserDropdownOpen(false)}>Dashboard</Link>
                          <Link to="/seller/products" className="block px-4 py-2 text-sm text-gray-700 hover:bg-coral-light hover:text-coral" onClick={() => setIsUserDropdownOpen(false)}>Products</Link>
                          <Link to="/seller/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-coral-light hover:text-coral" onClick={() => setIsUserDropdownOpen(false)}>Orders</Link>
                          <Link to="/seller/earnings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-coral-light hover:text-coral" onClick={() => setIsUserDropdownOpen(false)}>Earnings</Link>
                        </>
                      )}
                      {['customer', 'user', 'buyer'].includes(user.role) && (
                        <Link to="/customer/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-coral-light hover:text-coral" onClick={() => setIsUserDropdownOpen(false)}>Dashboard</Link>
                      )}
                      <button onClick={() => { logout(); setIsUserDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 mt-1 border-t border-gray-50">
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Button to="/login" variant="primary" size="md" className="shadow-coral/20">
                <User size={18} /> Login
              </Button>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-gray-600 hover:text-coral"
            >
              <Search size={20} />
            </button>

            <Link to="/cart" className="relative p-2 text-gray-600">
              <ShoppingCart size={20} />
              {items.length > 0 && (
                <span className="absolute top-0 right-0 bg-coral text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-coral hover:bg-coral-light focus:outline-none transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar - Conditional */}
      {isSearchOpen && (
        <div className="md:hidden px-4 pb-4 animate-in slide-in-from-top duration-200">
          <div className="relative">
            <input
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none"
              placeholder="Search products..."
              onKeyUp={handleSearch}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top duration-300 overflow-y-auto max-h-[calc(100vh-80px)]">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-coral-light flex items-center gap-3">
              <Home size={20} className="text-coral" /> Home
            </Link>
            <Link to="/shop" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-coral-light flex items-center gap-3">
              <ShoppingBag size={20} className="text-coral" /> Shop
            </Link>
            <Link to="/seller/register" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-coral-light flex items-center gap-3">
              <Store size={20} className="text-coral" /> Become a Seller
            </Link>
            
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
              {!user ? (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-center rounded-xl text-base font-bold text-white bg-coral shadow-lg shadow-coral/20">Login / Register</Link>
              ) : (
                <>
                  <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Menu</div>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                      {LayoutDashboard ? <LayoutDashboard size={20} /> : <Layout size={20} />} Admin Panel
                    </Link>
                  )}
                  {user.role === 'seller' && (
                    <>
                      <Link to="/seller/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                        {LayoutDashboard ? <LayoutDashboard size={20} /> : <Layout size={20} />} Dashboard
                      </Link>
                      <Link to="/seller/products" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                        <Package size={20} /> Products
                      </Link>
                      <Link to="/seller/orders" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                        <ShoppingCart size={20} /> Orders
                      </Link>
                    </>
                  )}
                  {['customer', 'user', 'buyer'].includes(user.role) && (
                    <Link to="/customer/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                      {LayoutDashboard ? <LayoutDashboard size={20} /> : <Layout size={20} />} My Dashboard
                    </Link>
                  )}
                  <button 
                    onClick={() => { logout(); setIsMenuOpen(false); }} 
                    className="block w-full text-left px-3 py-3 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <LogOut size={20} /> Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
