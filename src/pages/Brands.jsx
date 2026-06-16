import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, Tag } from 'lucide-react'
import api from '../api/axios'
import Swal from 'sweetalert2'
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
import ImageUpload from '../components/ImageUpload'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const Brands = () => {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', slug: '', logo: '' })

  const fetchData = async () => {
    try {       const { data } = await api.get('/admin/brands'); setBrands(data.data || []) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => { setForm({ name: '', slug: '', logo: '' }); setModal('add') }
  const openEdit = (brand) => { setForm(brand); setModal({ type: 'edit', id: brand._id }) }

  const handleSave = async () => {
    try {
      if (modal?.type === 'edit') await api.put(`/admin/brands/${modal.id}`, form)
      else await api.post('/admin/brands', form)
      setModal(null); fetchData(); Toast.fire({ icon: 'success', title: 'Saved' })
    } catch (err) { Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Save failed' }) }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Delete?', text: 'This cannot be undone', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' })
    if (!result.isConfirmed) return
    try { await api.delete(`/admin/brands/${id}`); fetchData(); Toast.fire({ icon: 'success', title: 'Deleted' }) }
    catch (err) { Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Delete failed' }) }
  }

  const columns = [
    { header: 'Logo', render: row => row.logo ? <img src={row.logo} alt="" className="image-preview" /> : '—' },
    { header: 'Name', render: row => <strong>{row.name}</strong> },
    { header: 'Slug', accessor: 'slug' },
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
      <div className="page-header"><h2>Brands</h2><p>Manage your product brands</p></div>
      <div className="card">
        <div className="card-header">
          <h3><Tag size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> All Brands</h3>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Brand</button>
        </div>
        <DataTable columns={columns} data={brands} loading={loading} />
      </div>

      {modal && (
        <Modal title={modal?.type === 'edit' ? 'Edit Brand' : 'Add Brand'} onClose={() => setModal(null)}
          footer={<><button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <div className="form-group"><label>Name *</label>
            <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} /></div>
          <div className="form-group"><label>Slug</label><input className="form-control" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
          <div className="form-group"><ImageUpload value={form.logo} onChange={(val) => setForm({...form, logo: val})} label="Logo" /></div>
        </Modal>
      )}
    </div>
  )
}

export default Brands
