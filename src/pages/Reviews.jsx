import { useState, useEffect } from 'react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Swal from 'sweetalert2'
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const Reviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewTarget, setViewTarget] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/admin/reviews?page=${page}&limit=15`)
      setReviews(data.data)
      setPagination(data.pagination)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReviews() }, [page])

  const toggleApprove = async (id, current) => {
    try {
      await api.put(`/admin/reviews/${id}`, { isApproved: !current })
      fetchReviews()
    } catch (err) { Toast.fire({ icon: 'error', title: 'Update failed' }) }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Are you sure?', text: 'Delete this review?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Yes, delete it!' })
    if (!result.isConfirmed) return
    try { await api.delete(`/admin/reviews/${id}`); fetchReviews() }
    catch (err) { Toast.fire({ icon: 'error', title: 'Delete failed' }) }
  }

  const columns = [
    { header: 'Product', render: row => row.product?.title || '—' },
    { header: 'Name', render: row => <strong>{row.name}</strong> },
    { header: 'Rating', render: row => '★'.repeat(row.rating) + '☆'.repeat(5 - row.rating) },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Approved',
      render: row => (
        <span className={`status-badge ${row.isApproved ? 'published' : 'draft'}`}
          style={{ cursor: 'pointer' }} onClick={() => toggleApprove(row._id, row.isApproved)}>
          {row.isApproved ? 'Approved' : 'Pending'}
        </span>
      ),
    },
    { header: 'Date', render: row => new Date(row.createdAt).toLocaleDateString() },
    {
      header: 'Actions',
      render: row => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setViewTarget(row)}>View</button>
          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row._id)}>Delete</button>
        </div>
      ),
    },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h3>Product Reviews ({pagination?.total || 0})</h3>
      </div>
      <DataTable columns={columns} data={reviews} loading={loading} />
      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button key={i + 1} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
          <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {viewTarget && (
        <Modal title="Review Details" onClose={() => setViewTarget(null)}>
          <p><strong>Product:</strong> {viewTarget.product?.title || '—'}</p>
          <p><strong>Name:</strong> {viewTarget.name}</p>
          <p><strong>Email:</strong> {viewTarget.email}</p>
          <p><strong>Rating:</strong> {'★'.repeat(viewTarget.rating) + '☆'.repeat(5 - viewTarget.rating)}</p>
          {viewTarget.title && <p><strong>Title:</strong> {viewTarget.title}</p>}
          <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
          <p><strong>Review:</strong></p>
          <p style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, marginTop: 4, whiteSpace: 'pre-wrap' }}>{viewTarget.content}</p>
          <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
          <p><strong>Date:</strong> {new Date(viewTarget.createdAt).toLocaleString()}</p>
          <p><strong>Status:</strong> <span className={`status-badge ${viewTarget.isApproved ? 'published' : 'draft'}`}>{viewTarget.isApproved ? 'Approved' : 'Pending'}</span></p>
        </Modal>
      )}
    </div>
  )
}

export default Reviews
