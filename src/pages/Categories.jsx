import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, FolderTree } from 'lucide-react'
import api from '../api/axios'
import Swal from 'sweetalert2'
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
import ImageUpload from '../components/ImageUpload'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', image: '', order: 0 })

  const fetchData = async () => {
    try {       const { data } = await api.get('/admin/categories'); setCategories(data.data || []) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => { setForm({ name: '', slug: '', description: '', image: '', order: 0 }); setModal('add') }
  const openEdit = (cat) => { setForm(cat); setModal({ type: 'edit', id: cat._id }) }

  const handleSave = async () => {
    try {
      if (modal?.type === 'edit') await api.put(`/admin/categories/${modal.id}`, form)
      else await api.post('/admin/categories', form)
      setModal(null); fetchData(); Toast.fire({ icon: 'success', title: 'Saved' })
    } catch (err) { Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Save failed' }) }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Delete?', text: 'This cannot be undone', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' })
    if (!result.isConfirmed) return
    try { await api.delete(`/admin/categories/${id}`); fetchData(); Toast.fire({ icon: 'success', title: 'Deleted' }) }
    catch (err) { Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Delete failed' }) }
  }

  const columns = [
    { header: 'Image', render: row => row.image ? <img src={row.image} alt="" className="image-preview" /> : '—' },
    { header: 'Name', render: row => <strong>{row.name}</strong> },
    { header: 'Slug', accessor: 'slug' },
    { header: 'Order', accessor: 'order' },
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
    <div>
      <div className="page-header"><h2>Categories</h2><p>Organize your product catalog</p></div>
      <div className="card">
        <div className="card-header">
          <h3><FolderTree size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> All Categories</h3>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Category</button>
        </div>
        <DataTable columns={columns} data={categories} loading={loading} />
      </div>

      {modal && (
        <Modal title={modal?.type === 'edit' ? 'Edit Category' : 'Add Category'} onClose={() => setModal(null)}
          footer={<><button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-group"><label>Name *</label>
            <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} /></div>
          <div className="form-group"><label>Slug</label><input className="form-control" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
          <div className="form-group"><label>Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-group"><ImageUpload value={form.image} onChange={(val) => setForm({...form, image: val})} label="Image" /></div>
          <div className="form-group"><label>Order</label><input className="form-control" type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} /></div>
        </Modal>
      )}
    </div>
  )
}

export default Categories
