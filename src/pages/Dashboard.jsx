import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingCart, Users, MessageSquare, IndianRupee, AlertTriangle, MessageCircle, Eye } from 'lucide-react'
import api from '../api/axios'
import StatsCard from '../components/StatsCard'
import DataTable from '../components/DataTable'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/admin/dashboard/stats')
        if (data.success) setStats(data.data)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const orderColumns = [
    { header: 'Order #', render: row => <strong>#{row.orderNumber || row._id?.slice(-6).toUpperCase()}</strong> },
    { header: 'Customer', render: row => row.billingAddress?.firstName + ' ' + row.billingAddress?.lastName },
    { header: 'Total', render: row => `₹${row.total?.toFixed(2)}` },
    { header: 'Status', render: row => <span className={`status-badge ${row.orderStatus}`}>{row.orderStatus}</span> },
    { header: 'Date', render: row => new Date(row.createdAt).toLocaleDateString() },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p>Welcome back! Here's what's happening today.</p>
      </div>

      <div className="stats-grid">
        <StatsCard label="Total Products" value={stats?.totalProducts || 0} icon={Package} change={`${stats?.totalProducts || 0} items`} color="#6366f1" />
        <StatsCard label="Total Orders" value={stats?.totalOrders || 0} icon={ShoppingCart} change={`${stats?.pendingOrders || 0} pending`} color="#10b981" />
        <StatsCard label="Total Users" value={stats?.totalUsers || 0} icon={Users} change={`${stats?.todayUsers || 0} today`} color="#f59e0b" />
        <StatsCard label="Revenue" value={`₹${(stats?.totalSales || 0).toLocaleString()}`} icon={IndianRupee} change={`₹${(stats?.todaySales || 0).toLocaleString()} today`} color="#ec4899" />
        <StatsCard label="Pending Comments" value={stats?.pendingComments || 0} icon={MessageCircle} change="Awaiting moderation" color="#06b6d4" />
        <StatsCard label="Low Stock Items" value="3" icon={AlertTriangle} change="-2 from last week" changeType="down" color="#ef4444" />
      </div>

      <div className="card">
        <div className="card-header">
          <h3><ShoppingCart size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Recent Orders</h3>
          <Link to="/orders" className="btn btn-outline btn-sm">View All →</Link>
        </div>
        <DataTable columns={orderColumns} data={stats?.recentOrders || []} loading={loading} />
      </div>
    </div>
  )
}

export default Dashboard
