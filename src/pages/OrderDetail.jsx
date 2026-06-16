import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Swal from 'sweetalert2'
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/admin/orders/${id}`)
      .then(res => setOrder(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  const updateStatus = async (status) => {
    try {
      await api.put(`/admin/orders/${id}`, { orderStatus: status })
      setOrder(prev => ({ ...prev, orderStatus: status }))
    } catch (err) { Toast.fire({ icon: 'error', title: 'Update failed' }) }
  }

  if (loading) return <div className="empty-state"><h3>Loading...</h3></div>
  if (!order) return <div className="empty-state"><h3>Order not found</h3></div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <button className="btn btn-outline" onClick={() => navigate('/orders')}>← Back</button>
        <h2 style={{ fontSize: '1.2rem' }}>Order {order.orderNumber || order._id?.slice(-6).toUpperCase()}</h2>
        <span className={`status-badge ${order.orderStatus}`} style={{ fontSize: '0.85rem', padding: '6px 16px' }}>{order.orderStatus}</span>
      </div>

      <div className="order-detail-grid">
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Billing Address</h3>
          <p>{order.billingAddress?.firstName} {order.billingAddress?.lastName}</p>
          <p>{order.billingAddress?.address1}</p>
          {order.billingAddress?.address2 && <p>{order.billingAddress.address2}</p>}
          <p>{order.billingAddress?.city}, {order.billingAddress?.state} - {order.billingAddress?.postcode}</p>
          <p>{order.billingAddress?.country}</p>
          <p>📞 {order.billingAddress?.phone}</p>
          <p>✉️ {order.billingAddress?.email}</p>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Order Summary</h3>
          <p><strong>Subtotal:</strong> ₹{order.subtotal?.toFixed(2)}</p>
          <p><strong>Shipping:</strong> ₹{order.shipping?.toFixed(2)}</p>
          {order.discount > 0 && <p><strong>Discount:</strong> -₹{order.discount?.toFixed(2)}</p>}
          <p style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 8 }}><strong>Total:</strong> ₹{order.total?.toFixed(2)}</p>
          <p><strong>Payment:</strong> {order.paymentMethod?.toUpperCase()}</p>
          <p><strong>Payment Status:</strong> <span className={`status-badge ${order.paymentStatus}`}>{order.paymentStatus}</span></p>
          {order.coupon && <p><strong>Coupon:</strong> {order.coupon}</p>}
          <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Items ({order.items?.length || 0})</h3>
        <table className="order-items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.image && <img src={item.image} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />}
                    <span>{item.title}</span>
                  </div>
                </td>
                <td>₹{item.price?.toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td>₹{(item.price * item.quantity)?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Update Status</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              className={`btn btn-sm ${order.orderStatus === status ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => updateStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
