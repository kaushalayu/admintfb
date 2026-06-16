import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import Categories from './pages/Categories'
import Brands from './pages/Brands'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import BlogPosts from './pages/BlogPosts'
import BlogPostForm from './pages/BlogPostForm'
import Users from './pages/Users'
import Faqs from './pages/Faqs'
import Contacts from './pages/Contacts'
import Newsletter from './pages/Newsletter'
import Coupons from './pages/Coupons'
import Reviews from './pages/Reviews'
import Testimonials from './pages/Testimonials'
import TeamPage from './pages/Team'
import Banners from './pages/Banners'
import BlogComments from './pages/BlogComments'
import Settings from './pages/Settings'
import Media from './pages/Media'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="admin-loader">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

const AdminLayout = ({ children }) => (
  <div className="admin-layout">
    <Sidebar />
    <div className="admin-main">
      <Header />
      <div className="admin-content">{children}</div>
    </div>
  </div>
)

const ProtectedPage = ({ children }) => (
  <ProtectedRoute>
    <AdminLayout>{children}</AdminLayout>
  </ProtectedRoute>
)

const App = () => (
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
      <Route path="/products" element={<ProtectedPage><Products /></ProtectedPage>} />
      <Route path="/products/new" element={<ProtectedPage><ProductForm /></ProtectedPage>} />
      <Route path="/products/edit/:id" element={<ProtectedPage><ProductForm /></ProtectedPage>} />
      <Route path="/categories" element={<ProtectedPage><Categories /></ProtectedPage>} />
      <Route path="/brands" element={<ProtectedPage><Brands /></ProtectedPage>} />
      <Route path="/orders" element={<ProtectedPage><Orders /></ProtectedPage>} />
      <Route path="/orders/:id" element={<ProtectedPage><OrderDetail /></ProtectedPage>} />
      <Route path="/blog" element={<ProtectedPage><BlogPosts /></ProtectedPage>} />
      <Route path="/blog/new" element={<ProtectedPage><BlogPostForm /></ProtectedPage>} />
      <Route path="/blog/edit/:id" element={<ProtectedPage><BlogPostForm /></ProtectedPage>} />
      <Route path="/users" element={<ProtectedPage><Users /></ProtectedPage>} />
      <Route path="/faqs" element={<ProtectedPage><Faqs /></ProtectedPage>} />
      <Route path="/contacts" element={<ProtectedPage><Contacts /></ProtectedPage>} />
      <Route path="/newsletter" element={<ProtectedPage><Newsletter /></ProtectedPage>} />
      <Route path="/coupons" element={<ProtectedPage><Coupons /></ProtectedPage>} />
      <Route path="/reviews" element={<ProtectedPage><Reviews /></ProtectedPage>} />
      <Route path="/testimonials" element={<ProtectedPage><Testimonials /></ProtectedPage>} />
      <Route path="/team" element={<ProtectedPage><TeamPage /></ProtectedPage>} />
      <Route path="/banners" element={<ProtectedPage><Banners /></ProtectedPage>} />
      <Route path="/blog-comments" element={<ProtectedPage><BlogComments /></ProtectedPage>} />
      <Route path="/settings" element={<ProtectedPage><Settings /></ProtectedPage>} />
      <Route path="/media" element={<ProtectedPage><Media /></ProtectedPage>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AuthProvider>
)

export default App
