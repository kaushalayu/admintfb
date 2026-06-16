import { useState, useEffect } from 'react'
import { Users, Plus, Edit3, Trash2, Eye, EyeOff, ArrowUpDown } from 'lucide-react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Swal from 'sweetalert2'
import ImageUpload from '../components/ImageUpload'

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const TeamPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', title: '', image: '', socialLinks: { facebook: '', twitter: '', skype: '', youtube: '' }, isActive: true, order: 0 })

  const fetchData = async () => {
    try {
      const { data } = await api.get('/admin/team')
      setItems(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => {
    setForm({ name: '', title: '', image: '', socialLinks: { facebook: '', twitter: '', skype: '', youtube: '' }, isActive: true, order: 0 })
    setModal('add')
  }

  const openEdit = (item) => {
    setForm({
      name: item.name,
      title: item.title || '',
      image: item.image || '',
      socialLinks: item.socialLinks || { facebook: '', twitter: '', skype: '', youtube: '' },
      isActive: item.isActive,
      order: item.order || 0,
    })
    setModal({ type: 'edit', id: item._id })
  }

  const handleSave = async () => {
    try {
      if (modal?.type === 'edit') {
        await api.put(`/admin/team/${modal.id}`, form)
      } else {
        await api.post('/admin/team', form)
      }
      setModal(null)
      fetchData()
      Toast.fire({ icon: 'success', title: 'Team member saved!' })
    } catch (err) { Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Save failed' }) }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Delete team member?', text: 'This cannot be undone', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' })
    if (!result.isConfirmed) return
    try { await api.delete(`/admin/team/${id}`); fetchData(); Toast.fire({ icon: 'success', title: 'Team member deleted' }) }
    catch (err) { Toast.fire({ icon: 'error', title: 'Delete failed' }) }
  }

  const toggleActive = async (item) => {
    try { await api.put(`/admin/team/${item._id}`, { isActive: !item.isActive }); fetchData(); Toast.fire({ icon: 'success', title: 'Status updated' }) }
    catch (err) { Toast.fire({ icon: 'error', title: 'Update failed' }) }
  }

  const setSocial = (key, value) => {
    setForm({ ...form, socialLinks: { ...form.socialLinks, [key]: value } })
  }

  const columns = [
    { header: 'Name', render: row => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {row.image ? <img src={row.image} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 600 }}>{row.name.charAt(0)}</div>}
        <div><strong>{row.name}</strong>{row.title ? <div style={{ fontSize: 12, color: '#6b7280' }}>{row.title}</div> : null}</div>
      </div>
    ) },
    { header: 'Order', render: row => <span className="status-badge active" style={{ background: '#e0e7ff', color: '#4f46e5' }}>{row.order || 0}</span> },
    { header: 'Social', render: row => {
      const links = row.socialLinks || {}
      const count = ['facebook', 'twitter', 'skype', 'youtube'].filter(k => links[k]).length
      return <span style={{ color: '#6b7280', fontSize: 13 }}>{count} link{count !== 1 ? 's' : ''}</span>
    }},
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
        <h3><Users size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Team Members ({items.length})</h3>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} style={{ marginRight: 4 }} />Add Member</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading} />

      {modal && (
        <Modal title={modal?.type === 'edit' ? 'Edit Team Member' : 'Add Team Member'} onClose={() => setModal(null)}
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
              <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Member name" />
            </div>
            <div className="form-group">
              <label>Title / Role</label>
              <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. CEO - Founder" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Order</label>
              <input className="form-control" type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} />
            </div>
            <div className="form-group" style={{ justifyContent: 'center', paddingTop: 24 }}>
              <label className="checkbox-label" style={{ margin: 0 }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                <span>Active</span>
              </label>
            </div>
          </div>
          <div className="form-group">
            <ImageUpload value={form.image} onChange={(val) => setForm(prev => ({...prev, image: val}))} label="Photo" />
          </div>
          <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginTop: 16 }}>
            <legend style={{ fontSize: 13, fontWeight: 600, color: '#374151', padding: '0 8px' }}>Social Links</legend>
            <div className="form-row">
              <div className="form-group">
                <label>Facebook URL</label>
                <input className="form-control" value={form.socialLinks.facebook} onChange={e => setSocial('facebook', e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <div className="form-group">
                <label>Twitter URL</label>
                <input className="form-control" value={form.socialLinks.twitter} onChange={e => setSocial('twitter', e.target.value)} placeholder="https://twitter.com/..." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Skype URL</label>
                <input className="form-control" value={form.socialLinks.skype} onChange={e => setSocial('skype', e.target.value)} placeholder="Skype link" />
              </div>
              <div className="form-group">
                <label>YouTube URL</label>
                <input className="form-control" value={form.socialLinks.youtube} onChange={e => setSocial('youtube', e.target.value)} placeholder="https://youtube.com/..." />
              </div>
            </div>
          </fieldset>
        </Modal>
      )}
    </div>
  )
}

export default TeamPage