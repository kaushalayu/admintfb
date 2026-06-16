import { useAuth } from '../context/AuthContext'
import { LogOut, Menu } from 'lucide-react'

const Header = ({ onMenuToggle }) => {
  const { user, logout } = useAuth()

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          <Menu size={22} />
        </button>
        <div className="header-breadcrumb">
          <span className="breadcrumb-active">Dashboard</span>
        </div>
      </div>
      <div className="header-right">
        <div className="header-user">
          <div className="header-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{user?.name || 'Admin'}</span>
            <span className="header-user-role">{user?.role || 'Administrator'}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={logout} title="Logout">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}

export default Header
