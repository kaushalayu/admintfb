import { useState, useEffect } from 'react'
import { Grid, Plus, Edit3, Trash2, Eye, EyeOff } from 'lucide-react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Swal from 'sweetalert2'
import ImageUpload from '../components/ImageUpload'

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const Portfolio = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', image: '', category: 'general', link: '', order: 0, isActive: true })

  const fetchData = async () => {
    try {
      const { data } = await api.get('/admin/portfolio')
      setItems(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => {
    setForm({ title: '', description: '', image: '', category: 'general', link: '', order: 0, isActive: true })
    setModal('add')
  }

  const openEdit = (item) => {
    setForm({ title: item.title, description: item.description || '', image: item.image, category: item.category || 'general', link: item.link || '', order: item.order || 0, isActive: item.isActive })
    setModal({ type: 'edit', id: item._id })
  }

  const handleSave = async () => {
    try {
      if (modal?.type === 'edit') {
        await api.put(`/admin/portfolio/${modal.id}`, form)
      } else {
        await api.post('/admin/portfolio', form)
      }
      setModal(null)
      fetchData()
      Toast.fire({ icon: 'success', title: 'Portfolio item saved!' })
    } catch (err) { Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Save failed' }) }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Delete portfolio item?', text: 'This cannot be undone', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' })
    if (!result.isConfirmed) return
    try { await api.delete(`/admin/portfolio/${id}`); fetchData(); Toast.fire({ icon: 'success', title: 'Deleted' }) }
    catch (err) { Toast.fire({ icon: 'error', title: 'Delete failed' }) }
  }

  const toggleActive = async (item) => {
    try { await api.put(`/admin/portfolio/${item._id}`, { isActive: !item.isActive }); fetchData(); Toast.fire({ icon: 'success', title: 'Status updated' }) }
    catch (err) { Toast.fire({ icon: 'error', title: 'Update failed' }) }
  }

  const columns = [
    { header: 'Preview', render: row => (
      row.image
        ? <img src={row.image} alt={row.title} style={{ width: 80, height: 56, borderRadius: 6, objectFit: 'cover', border: '1px solid #e5e7eb' }} />
        : <div style={{ width: 80, height: 56, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 11 }}>No Image</div>
    ) },
    { header: 'Title', render: row => <div><strong>{row.title}</strong>{row.description ? <div style={{ fontSize: 12, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description}</div> : null}</div> },
    { header: 'Category', render: row => <span className="status-badge active" style={{ background: '#dbeafe', color: '#2563eb' }}>{row.category || 'general'}</span> },
    { header: 'Order', render: row => <span className="status-badge active" style={{ background: '#e0e7ff', color: '#4f46e5' }}>{row.order || 0}</span> },
    { header: 'Status', render: row => (
      <span className={`status-badge ${row.isActive ? 'active' : 'inactive'}`} onClick={() => toggleActive(row)} style={{ cursor: 'pointer' }}>
        {row.isActive ? <Eye size={12} style={{ marginRight: 4 }} /> : <EyeOff size={12} style={{ marginRight: 4 }} />}
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    {
      header: 'Actions', width: '100px',
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
        <h3><Grid size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Portfolio ({items.length})</h3>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} style={{ marginRight: 4 }} />Add Item</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading} />

      {modal && (
        <Modal title={modal?.type === 'edit' ? 'Edit Portfolio Item' : 'Add Portfolio Item'} onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </>
          }
        >
          <div className="form-group">
            <label>Title *</label>
            <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Portfolio item title" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
          </div>
          <div className="form-group">
            <ImageUpload value={form.image} onChange={(val) => setForm(prev => ({...prev, image: val}))} label="Image *" />
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Recommended: 800x600px or similar landscape ratio</p>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="general">General</option>
                <option value="living-room">Living Room</option>
                <option value="bedroom">Bedroom</option>
                <option value="dining">Dining</option>
                <option value="office">Office</option>
                <option value="outdoor">Outdoor</option>
                <option value="custom">Custom Work</option>
              </select>
            </div>
            <div className="form-group">
              <label>Order</label>
              <input className="form-control" type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} />
            </div>
          </div>
          <div className="form-group">
            <label>External Link (optional)</label>
            <input className="form-control" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
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

export default Portfolio
