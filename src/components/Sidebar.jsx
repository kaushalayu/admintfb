import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, FolderTree, Tag, ShoppingCart, TicketPercent,
  FileText, HelpCircle, Users, MessageSquare, Mail, Star, Image, Settings,
  MessageCircle, PanelsTopLeft, MessageCircle as MessageCircleIcon, UserCheck,
} from 'lucide-react'

const navItems = [
  { section: 'Main' },
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { section: 'Catalog' },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Categories', path: '/categories', icon: FolderTree },
  { label: 'Brands', path: '/brands', icon: Tag },
  { section: 'Sales' },
  { label: 'Orders', path: '/orders', icon: ShoppingCart },
  { label: 'Coupons', path: '/coupons', icon: TicketPercent },
  { section: 'Content' },
  { label: 'Blog Posts', path: '/blog', icon: FileText },
  { label: 'Blog Comments', path: '/blog-comments', icon: MessageCircleIcon },
  { label: 'FAQs', path: '/faqs', icon: HelpCircle },
  { label: 'Team', path: '/team', icon: UserCheck },
  { section: 'Users' },
  { label: 'Users', path: '/users', icon: Users },
  { section: 'Inbox' },
  { label: 'Contacts', path: '/contacts', icon: MessageSquare },
  { label: 'Newsletter', path: '/newsletter', icon: Mail },
  { section: 'Manage' },
  { label: 'Reviews', path: '/reviews', icon: Star },
  { label: 'Testimonials', path: '/testimonials', icon: MessageCircle },
  { label: 'Banners', path: '/banners', icon: PanelsTopLeft },
  { label: 'Media', path: '/media', icon: Image },
  { label: 'Settings', path: '/settings', icon: Settings },
]

const Sidebar = ({ open, onClose }) => (
  <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="sidebar-brand">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <LayoutDashboard size={22} />
        </div>
        <div>
          <h2>Furniture Boutique</h2>
          <small>Admin Panel v1.0</small>
        </div>
      </div>
    </div>
    <nav className="sidebar-nav" onClick={() => onClose?.()}>
      {navItems.map((item, i) =>
        item.section ? (
          <div key={i} className="sidebar-section">{item.section}</div>
        ) : (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <item.icon size={18} className="nav-icon" />
            <span>{item.label}</span>
          </NavLink>
        )
      )}
    </nav>
  </aside>
)

export default Sidebar
