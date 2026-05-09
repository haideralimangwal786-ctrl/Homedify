import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Landing from './pages/Landing'
import Shop from './pages/Shop'
import ProductDetails from './pages/ProductDetails'
import SellerRegister from './pages/SellerRegister'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import SellerDashboard from './pages/SellerDashboard'
import SellerProducts from './pages/SellerProducts'
import SellerAddProduct from './pages/SellerAddProduct'
import SellerProfile from './pages/SellerProfile'
import SellerEarnings from './pages/SellerEarnings'
import CartPage from './pages/CartPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminVerification from './pages/AdminVerification'
import AdminWithdrawals from './pages/AdminWithdrawals'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { NotificationProvider } from './context/NotificationContext'
import ProtectedRoute from './shared/ProtectedRoute'
import CategoriesAdmin from './pages/CategoriesAdmin'
import SellerCategories from './pages/SellerCategories'
import UserOrders from './pages/UserOrders'
import UserDashboard from './pages/UserDashboard'
import UserProfile from './pages/UserProfile'
import UserWishlist from './pages/UserWishlist'
import UserAddresses from './pages/UserAddresses'
import UserNotifications from './pages/UserNotifications'
import UserReviews from './pages/UserReviews'
import UserOrderDetails from './pages/UserOrderDetails'
import SellerOrders from './pages/SellerOrders'
import SellerNotifications from './pages/SellerNotifications'
import OrderSuccess from './pages/OrderSuccess'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import UserSupport from './pages/UserSupport'
import UserTrack from './pages/UserTrack'
import VerifyEmailSuccess from './pages/VerifyEmailSuccess'

import { SettingsProvider } from './context/SettingsContext'

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <WishlistProvider>
            <NotificationProvider>
              <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/seller/register" element={<SellerRegister />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/verify-email-success" element={<VerifyEmailSuccess />} />

              {/* Seller Routes */}
              <Route path="/seller/dashboard" element={<ProtectedRoute allowed={["seller", "admin"]}><SellerDashboard /></ProtectedRoute>} />
              <Route path="/seller/products" element={<ProtectedRoute allowed={["seller", "admin"]}><SellerProducts /></ProtectedRoute>} />
              <Route path="/seller/add-product" element={<ProtectedRoute allowed={["seller", "admin"]}><SellerAddProduct /></ProtectedRoute>} />
              <Route path="/seller/earnings" element={<ProtectedRoute allowed={["seller", "admin"]}><SellerEarnings /></ProtectedRoute>} />
              <Route path="/seller/profile" element={<ProtectedRoute allowed={["seller", "admin"]}><SellerProfile /></ProtectedRoute>} />
              <Route path="/seller/categories" element={<ProtectedRoute allowed={["seller", "admin"]}><SellerCategories /></ProtectedRoute>} />
              <Route path="/seller/orders" element={<ProtectedRoute allowed={["seller", "admin"]}><SellerOrders /></ProtectedRoute>} />
              <Route path="/seller/notifications" element={<ProtectedRoute allowed={["seller", "admin"]}><SellerNotifications /></ProtectedRoute>} />

              {/* Customer Routes */}
              <Route path="/customer/dashboard" element={<ProtectedRoute allowed={["customer", "buyer", "user", "admin"]}><UserDashboard /></ProtectedRoute>} />
              <Route path="/customer/profile" element={<ProtectedRoute allowed={["customer", "buyer", "user", "seller", "admin"]}><UserProfile /></ProtectedRoute>} />
              <Route path="/customer/wishlist" element={<ProtectedRoute allowed={["customer", "buyer", "user", "seller", "admin"]}><UserWishlist /></ProtectedRoute>} />
              <Route path="/customer/addresses" element={<ProtectedRoute allowed={["customer", "buyer", "user", "seller", "admin"]}><UserAddresses /></ProtectedRoute>} />
              <Route path="/customer/notifications" element={<ProtectedRoute allowed={["customer", "buyer", "user", "admin"]}><UserNotifications /></ProtectedRoute>} />
              <Route path="/customer/reviews" element={<ProtectedRoute allowed={["customer", "buyer", "user", "admin"]}><UserReviews /></ProtectedRoute>} />
              <Route path="/customer/orders" element={<ProtectedRoute allowed={["customer", "buyer", "user", "admin"]}><UserOrders /></ProtectedRoute>} />
              <Route path="/customer/orders/:id" element={<ProtectedRoute allowed={["customer", "buyer", "user", "admin"]}><UserOrderDetails /></ProtectedRoute>} />
              <Route path="/customer/track" element={<ProtectedRoute allowed={["customer", "buyer", "user", "admin"]}><UserTrack /></ProtectedRoute>} />
              <Route path="/customer/track/:id" element={<ProtectedRoute allowed={["customer", "buyer", "user", "admin"]}><UserTrack /></ProtectedRoute>} />
              <Route path="/customer/support" element={<ProtectedRoute allowed={["customer", "buyer", "user", "admin"]}><UserSupport /></ProtectedRoute>} />

              {/* Legacy/Redirect Routes for SEO/UX */}
              <Route path="/dashboard" element={<ProtectedRoute allowed={["customer", "buyer", "user", "seller", "admin"]}><UserDashboard /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute allowed={["customer", "buyer", "user", "admin"]}><UserOrders /></ProtectedRoute>} />

              <Route path="/cart" element={<CartPage />} />
              <Route path="/order-success" element={<ProtectedRoute allowed={["customer", "buyer", "admin"]}><OrderSuccess /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute allowed={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/verification" element={<ProtectedRoute allowed={["admin"]}><AdminVerification /></ProtectedRoute>} />
              <Route path="/admin/withdrawals" element={<ProtectedRoute allowed={["admin"]}><AdminWithdrawals /></ProtectedRoute>} />
              <Route path="/admin/categories" element={<ProtectedRoute allowed={["admin"]}><CategoriesAdmin /></ProtectedRoute>} />

              {/* Catch-all — prevents React Router 'No routes matched' console warnings */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
            </NotificationProvider>
          </WishlistProvider>
        </CartProvider>
      </SettingsProvider>
    </AuthProvider >
  )
}

export default App
