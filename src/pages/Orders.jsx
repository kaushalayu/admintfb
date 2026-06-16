import { useState, useEffect } from 'react'
import { ShoppingCart, Search } from 'lucide-react'
import api from '../api/axios'
import DataTable from '../components/DataTable'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    api.get('/admin/orders').then(res => setOrders(res.data.data || [])).catch(err => console.error(err)).finally(() => setLoading(false))
  }, [])

  const filteredOrders = searchTerm
    ? orders.filter(o => {
        const term = searchTerm.toLowerCase()
        return (o.orderNumber?.toLowerCase() || o._id?.toLowerCase() || '').includes(term) ||
               (o.billingAddress?.email?.toLowerCase() || '').includes(term)
      })
    : orders

  const columns = [
    { header: 'Order #', render: row => <strong>#{row.orderNumber || row._id?.slice(-6).toUpperCase()}</strong> },
    { header: 'Customer', render: row => row.billingAddress?.firstName + ' ' + row.billingAddress?.lastName },
    { header: 'Email', render: row => row.billingAddress?.email },
    { header: 'Items', render: row => row.items?.length || 0 },
    { header: 'Total', render: row => `₹${row.total?.toFixed(2)}` },
    { header: 'Payment', render: row => row.paymentMethod?.toUpperCase?.() || '—' },
    { header: 'Status', render: row => <span className={`status-badge ${row.orderStatus}`}>{row.orderStatus}</span> },
    { header: 'Date', render: row => new Date(row.createdAt).toLocaleDateString() },
  ]

  return (
    <div>
      <div className="page-header"><h2>Orders</h2><p>{filteredOrders.length} of {orders.length} total orders</p></div>
      <div className="card">
        <div className="card-header">
          <h3><ShoppingCart size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> All Orders</h3>
          <div className="search-box">
            <Search size={16} />
            <input className="form-control" placeholder="Search by order # or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <DataTable columns={columns} data={filteredOrders} loading={loading} onRowClick={row => window.location.href = `/orders/${row._id}`} />
      </div>
    </div>
  )
}

export default Orders
