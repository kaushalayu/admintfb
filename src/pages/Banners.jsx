import { useState, useEffect } from 'react'
import { Image, Plus, Edit3, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Swal from 'sweetalert2'
import ImageUpload from '../components/ImageUpload'

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const Banners = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ title: '', subtitle: '', description: '', image: '', link: '', btnText: 'Shop Now', type: 'hero', order: 0, isActive: true })

  const fetchData = async () => {
    try {
      const { data } = await api.get('/admin/banners')
      setItems(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => {
    setForm({ title: '', subtitle: '', description: '', image: '', link: '', btnText: 'Shop Now', type: 'hero', order: 0, isActive: true })
    setModal('add')
  }

  const openEdit = (item) => {
    setForm({ title: item.title, subtitle: item.subtitle || '', description: item.description || '', image: item.image, link: item.link || '', btnText: item.btnText || 'Shop Now', type: item.type || 'hero', order: item.order || 0, isActive: item.isActive })
    setModal({ type: 'edit', id: item._id })
  }

  const handleSave = async () => {
    try {
      if (modal?.type === 'edit') {
        await api.put(`/admin/banners/${modal.id}`, form)
      } else {
        await api.post('/admin/banners', form)
      }
      setModal(null)
      fetchData()
      Toast.fire({ icon: 'success', title: 'Banner saved!' })
    } catch (err) { Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Save failed' }) }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Delete banner?', text: 'This cannot be undone', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' })
    if (!result.isConfirmed) return
    try { await api.delete(`/admin/banners/${id}`); fetchData(); Toast.fire({ icon: 'success', title: 'Banner deleted' }) }
    catch (err) { Toast.fire({ icon: 'error', title: 'Delete failed' }) }
  }

  const toggleActive = async (item) => {
    try { await api.put(`/admin/banners/${item._id}`, { isActive: !item.isActive }); fetchData(); Toast.fire({ icon: 'success', title: 'Status updated' }) }
    catch (err) { Toast.fire({ icon: 'error', title: 'Update failed' }) }
  }

  const columns = [
    { header: 'Preview', render: row => (
      row.image
        ? <img src={row.image} alt={row.title} style={{ width: 80, height: 45, borderRadius: 6, objectFit: 'cover', border: '1px solid #e5e7eb' }} />
        : <div style={{ width: 80, height: 45, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 11 }}>No Image</div>
    ) },
    { header: 'Title', render: row => <div><strong>{row.title}</strong>{row.subtitle ? <div style={{ fontSize: 12, color: '#6b7280' }}>{row.subtitle}</div> : null}</div> },
    { header: 'Button', render: row => row.btnText ? <span className="status-badge active" style={{ background: '#dbeafe', color: '#2563eb' }}>{row.btnText}</span> : <span className="status-badge inactive">—</span> },
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
          {row.link && <a href={row.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" title="View link"><ExternalLink size={14} /></a>}
          <button className="btn btn-outline btn-sm" onClick={() => openEdit(row)}><Edit3 size={14} /></button>
          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row._id)}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h3><Image size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Banners ({items.length})</h3>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} style={{ marginRight: 4 }} />Add Banner</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading} />

      {modal && (
        <Modal title={modal?.type === 'edit' ? 'Edit Banner' : 'Add Banner'} onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </>
          }
        >
          <div className="form-group">
            <label>Title *</label>
            <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Banner heading" />
          </div>
          <div className="form-group">
            <label>Subtitle</label>
            <input className="form-control" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="Banner subheading" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Hero banner description" />
          </div>
          <div className="form-group">
            <ImageUpload value={form.image} onChange={(val) => setForm(prev => ({...prev, image: val}))} label="Image *" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Link URL</label>
              <input className="form-control" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="/shop or https://..." />
            </div>
            <div className="form-group">
              <label>Button Text</label>
              <input className="form-control" value={form.btnText} onChange={e => setForm({ ...form, btnText: e.target.value })} placeholder="Shop Now" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Section Type</label>
              <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="hero">Hero Slider</option>
                <option value="promo_row_1">Promo Row 1</option>
                <option value="promo_row_2">Promo Row 2</option>
              </select>
            </div>
            <div className="form-group">
              <label>Order</label>
              <input className="form-control" type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} />
            </div>
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

export default Banners
