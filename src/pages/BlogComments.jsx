import { useState, useEffect } from 'react'
import { MessageCircle, CheckCircle, Trash2, ExternalLink, Globe, Mail, AlertCircle } from 'lucide-react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import Swal from 'sweetalert2'
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const BlogComments = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchData = async () => {
    try {
      const params = {}
      if (filter === 'pending') params.approved = 'false'
      if (filter === 'approved') params.approved = 'true'
      const { data } = await api.get('/admin/blog-comments', { params })
      setItems(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filter])

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/blog-comments/${id}/approve`)
      fetchData()
    } catch (err) { Toast.fire({ icon: 'error', title: 'Approve failed' }) }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Are you sure?', text: 'Delete this comment?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Yes, delete it!' })
    if (!result.isConfirmed) return
    try { await api.delete(`/admin/blog-comments/${id}`); fetchData() }
    catch (err) { Toast.fire({ icon: 'error', title: 'Delete failed' }) }
  }

  const columns = [
    { header: 'Comment', render: row => (
      <div style={{ maxWidth: 350 }}>
        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.4, marginBottom: 4 }}>{row.content}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 12 }}>{row.name}</strong>
          <a href={`mailto:${row.email}`} style={{ fontSize: 11, color: '#6366f1', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <Mail size={10} />{row.email}
          </a>
          {row.website && (
            <a href={row.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#6366f1', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <Globe size={10} />Website
            </a>
          )}
        </div>
      </div>
    )},
    { header: 'Post', render: row => (
      row.post
        ? <div style={{ fontSize: 13 }}>{row.post.title || row.post.slug || 'Unknown'}</div>
        : <span style={{ color: '#9ca3af', fontSize: 13 }}>Deleted Post</span>
    )},
    { header: 'Date', render: row => (
      <div style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
        {new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
    )},
    { header: 'Status', render: row => (
      <span className={`status-badge ${row.isApproved ? 'active' : 'inactive'}`}>
        {row.isApproved ? 'Approved' : 'Pending'}
      </span>
    )},
    {
      header: 'Actions', width: '140px',
      render: row => (
        <div style={{ display: 'flex', gap: 6 }}>
          {!row.isApproved && (
            <button className="btn btn-success btn-sm" onClick={() => handleApprove(row._id)} title="Approve">
              <CheckCircle size={14} />
            </button>
          )}
          {row.post?.slug && (
            <a href={`/blog/${row.post.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" title="View post">
              <ExternalLink size={14} />
            </a>
          )}
          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row._id)} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h3><MessageCircle size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Blog Comments ({items.length})</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'pending', 'approved'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setFilter(f); setLoading(true) }}>
              {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Approved'}
            </button>
          ))}
        </div>
      </div>
      <DataTable columns={columns} data={items} loading={loading} />
    </div>
  )
}

export default BlogComments
