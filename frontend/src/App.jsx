import { Routes, Route } from 'react-router-dom'
// v2 deployment - restarting for configuration update
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute'

import HomePage from './pages/Home'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import ProductsPage from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import CartPage from './pages/Cart'
import CheckoutPage from './pages/Checkout'
import ProfilePage from './pages/Profile'
import SellerDashboard from './pages/SellerDashboard'
import AdminPanel from './pages/AdminPanel'
import CommunityPage from './pages/Community'
import OrdersPage from './pages/Orders'

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl mb-6">🌾</div>
      <h1 className="font-display font-bold text-4xl text-white mb-4">404 – Page Not Found</h1>
      <p className="text-gray-400 mb-8">The page you're looking for doesn't exist or was moved.</p>
      <a href="/" className="btn-primary">Go Home</a>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/community" element={<CommunityPage />} />

          {/* Auth – guest only */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Protected – any logged in user */}
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />

          {/* Seller only */}
          <Route path="/seller/dashboard" element={<ProtectedRoute requiredRole="seller"><SellerDashboard /></ProtectedRoute>} />

          {/* Admin only */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  )
}
