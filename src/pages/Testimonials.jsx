import { useState, useEffect } from 'react'
import { Star, MessageSquare, Plus, Edit3, Trash2, Eye, EyeOff } from 'lucide-react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Swal from 'sweetalert2'
import ImageUpload from '../components/ImageUpload'

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const Testimonials = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', title: '', content: '', rating: 5, image: '', isActive: true, order: 0 })

  const fetchData = async () => {
    try {
      const { data } = await api.get('/admin/testimonials')
      setItems(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => {
    setForm({ name: '', title: '', content: '', rating: 5, image: '', isActive: true, order: 0 })
    setModal('add')
  }

  const openEdit = (item) => {
    setForm({ name: item.name, title: item.title || '', content: item.content, rating: item.rating || 5, image: item.image || '', isActive: item.isActive, order: item.order || 0 })
    setModal({ type: 'edit', id: item._id })
  }

  const handleSave = async () => {
    try {
      if (modal?.type === 'edit') {
        await api.put(`/admin/testimonials/${modal.id}`, form)
      } else {
        await api.post('/admin/testimonials', form)
      }
      setModal(null)
      fetchData()
      Toast.fire({ icon: 'success', title: 'Testimonial saved!' })
    } catch (err) { Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Save failed' }) }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Delete testimonial?', text: 'This cannot be undone', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' })
    if (!result.isConfirmed) return
    try { await api.delete(`/admin/testimonials/${id}`); fetchData(); Toast.fire({ icon: 'success', title: 'Testimonial deleted' }) }
    catch (err) { Toast.fire({ icon: 'error', title: 'Delete failed' }) }
  }

  const toggleActive = async (item) => {
    try { await api.put(`/admin/testimonials/${item._id}`, { isActive: !item.isActive }); fetchData(); Toast.fire({ icon: 'success', title: 'Status updated' }) }
    catch (err) { Toast.fire({ icon: 'error', title: 'Update failed' }) }
  }

  const renderStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(<Star key={i} size={14} fill={i <= rating ? '#f59e0b' : 'none'} color={i <= rating ? '#f59e0b' : '#d1d5db'} style={{ marginRight: 2 }} />)
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center' }}>{stars}</span>
  }

  const columns = [
    { header: 'Name', render: row => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {row.image ? <img src={row.image} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 600 }}>{row.name.charAt(0)}</div>}
        <div><strong>{row.name}</strong>{row.title ? <div style={{ fontSize: 12, color: '#6b7280' }}>{row.title}</div> : null}</div>
      </div>
    ) },
    { header: 'Rating', render: row => renderStars(row.rating || 5) },
    { header: 'Content', render: row => <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280' }}>{row.content}</div> },
    { header: 'Order', render: row => <span className="status-badge active" style={{ background: '#e0e7ff', color: '#4f46e5' }}>{row.order || 0}</span> },
    { header: 'Status', render: row => (
      <span className={`status-badge ${row.isActive ? 'active' : 'inactive'}`} onClick={() => toggleActive(row)} style={{ cursor: 'pointer' }}>
        {row.isActive ? <Eye size={12} style={{ marginRight: 4 }} /> : <EyeOff size={12} style={{ marginRight: 4 }} />}
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    {
      header: 'Actions', width: '120px',
      render: row => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-outline btn-sm" onClick={() => openEdit(row)}><Edit3 size={14} /></button>
          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row._id)}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h3><MessageSquare size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Testimonials ({items.length})</h3>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} style={{ marginRight: 4 }} />Add Testimonial</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading} />

      {modal && (
        <Modal title={modal?.type === 'edit' ? 'Edit Testimonial' : 'Add Testimonial'} onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Customer name" />
            </div>
            <div className="form-group">
              <label>Title</label>
              <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Happy Customer" />
            </div>
          </div>
          <div className="form-group">
            <label>Content *</label>
            <textarea className="form-control" rows={3} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Testimonial text" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Rating</label>
              <select className="form-control" value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{'★'.repeat(r)}{'☆'.repeat(5 - r)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Order</label>
              <input className="form-control" type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} />
            </div>
          </div>
          <div className="form-group">
            <ImageUpload value={form.image} onChange={(val) => setForm(prev => ({...prev, image: val}))} label="Image" />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              <span>Active</span>
            </label>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Testimonials
