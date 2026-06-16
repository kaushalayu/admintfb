import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Swal from 'sweetalert2'
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const emptyAddress = { label: 'Home', street: '', city: '', state: '', zip: '', country: 'India', isDefault: false }

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [modalError, setModalError] = useState('')
  const [modalLoading, setModalLoading] = useState(false)

  const [addrModal, setAddrModal] = useState(false)
  const [addrUser, setAddrUser] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [addrForm, setAddrForm] = useState({ ...emptyAddress })
  const [addrEditing, setAddrEditing] = useState(null)
  const [addrShowForm, setAddrShowForm] = useState(false)
  const [addrSaving, setAddrSaving] = useState(false)
  const [addrError, setAddrError] = useState('')

  const fetchData = async () => {
    try {
      const { data } = await api.get('/admin/users')
      setUsers(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async () => {
    setModalError('')
    setModalLoading(true)
    try {
      await api.post('/admin/users', formData)
      setShowModal(false)
      setFormData({ name: '', email: '', password: '' })
      setLoading(true)
      fetchData()
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create user')
    } finally {
      setModalLoading(false)
    }
  }

  const handleMakeAdmin = async (id) => {
    try {
      await api.put(`/admin/users/${id}`, { role: 'admin' })
      setLoading(true)
      fetchData()
    } catch (err) {
      Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Failed to update role' })
    }
  }

  const openAddressModal = (user) => {
    setAddrUser(user)
    setAddresses(user.addresses || [])
    setAddrShowForm(false)
    setAddrEditing(null)
    setAddrForm({ ...emptyAddress })
    setAddrError('')
    setAddrModal(true)
  }

  const handleAddrSave = async () => {
    setAddrSaving(true)
    setAddrError('')
    try {
      const { data } = await api.put(`/admin/users/${addrUser._id}`, { addresses })
      setUsers((prev) =>
        prev.map((u) => (u._id === addrUser._id ? { ...u, addresses: data.data.addresses } : u))
      )
      setAddrUser((prev) => ({ ...prev, addresses: data.data.addresses }))
      Toast.fire({ icon: 'success', title: 'Addresses updated' })
    } catch (err) {
      setAddrError(err.response?.data?.message || 'Failed to update addresses')
    } finally {
      setAddrSaving(false)
    }
  }

  const handleAddrSubmit = (e) => {
    e.preventDefault()
    if (!addrForm.street || !addrForm.city || !addrForm.state || !addrForm.zip) {
      setAddrError('Please fill in all required fields')
      return
    }
    let updated
    if (addrEditing !== null) {
      updated = addresses.map((a, i) => (i === addrEditing ? addrForm : a))
    } else {
      if (addrForm.isDefault) {
        updated = [...addresses.map((a) => ({ ...a, isDefault: false })), addrForm]
      } else {
        updated = [...addresses, { ...addrForm, isDefault: addresses.length === 0 }]
      }
    }
    setAddresses(updated)
    setAddrShowForm(false)
    setAddrEditing(null)
    setAddrForm({ ...emptyAddress })
    setAddrError('')
  }

  const handleAddrEdit = (index) => {
    setAddrForm({ ...addresses[index] })
    setAddrEditing(index)
    setAddrShowForm(true)
    setAddrError('')
  }

  const handleAddrDelete = (index) => {
    setAddresses(addresses.filter((_, i) => i !== index))
  }

  const columns = [
    { header: 'Name', render: row => <strong>{row.name}</strong> },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', render: row => row.phone || '—' },
    {
      header: 'Role',
      render: row => <span className={`status-badge ${row.role === 'admin' ? 'active' : ''}`}>{row.role}</span>,
    },
    { header: 'Joined', render: row => new Date(row.createdAt).toLocaleDateString() },
    {
      header: 'Actions',
      render: row => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => Swal.fire({ title: 'User Details', html: `
            <div style="text-align:left">
              <p><strong>Name:</strong> ${row.name}</p>
              <p><strong>Email:</strong> ${row.email}</p>
              <p><strong>Phone:</strong> ${row.phone || '—'}</p>
              <p><strong>Role:</strong> ${row.role}</p>
              <p><strong>Joined:</strong> ${new Date(row.createdAt).toLocaleDateString()}</p>
              <p><strong>Addresses:</strong> ${(row.addresses || []).length}</p>
            </div>`, icon: 'info' })}>View</button>
          {row.role !== 'admin' && (
            <button className="btn btn-primary btn-sm" onClick={() => handleMakeAdmin(row._id)}>Make Admin</button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => openAddressModal(row)}>Addresses</button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header"><h2>Users</h2></div>
      <div className="card">
        <div className="card-header">
          <h3>All Users ({users.length})</h3>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Create Admin User</button>
        </div>
        <DataTable columns={columns} data={users} loading={loading} />
      </div>

      {showModal && (
        <Modal title="Create Admin User" onClose={() => setShowModal(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate} disabled={modalLoading}>{modalLoading ? 'Creating...' : 'Create'}</button></>}>
          {modalError && <div className="alert alert-error">{modalError}</div>}
          <div className="form-group"><label>Name *</label>
            <input className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
          <div className="form-group"><label>Email *</label>
            <input className="form-control" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
          <div className="form-group"><label>Password *</label>
            <input className="form-control" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
        </Modal>
      )}

      {addrModal && addrUser && (
        <Modal title={`Addresses - ${addrUser.name}`} onClose={() => setAddrModal(false)}
          footer={<>
            <button className="btn btn-outline" onClick={() => setAddrModal(false)}>Close</button>
            <button className="btn btn-primary" onClick={handleAddrSave} disabled={addrSaving}>
              {addrSaving ? 'Saving...' : 'Save All Changes'}
            </button>
          </>}>
          {addrError && <div className="alert alert-error">{addrError}</div>}

          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{addresses.length} Address(es)</strong>
            {!addrShowForm && (
              <button className="btn btn-primary btn-sm" onClick={() => { setAddrForm({ ...emptyAddress }); setAddrEditing(null); setAddrShowForm(true); setAddrError('') }}>
                + Add Address
              </button>
            )}
          </div>

          {addrShowForm && (
            <form onSubmit={handleAddrSubmit} style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Label</label>
                  <select className="form-control" value={addrForm.label} onChange={e => setAddrForm({ ...addrForm, label: e.target.value })}>
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Street *</label>
                  <input className="form-control" value={addrForm.street} onChange={e => setAddrForm({ ...addrForm, street: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input className="form-control" value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input className="form-control" value={addrForm.state} onChange={e => setAddrForm({ ...addrForm, state: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>ZIP *</label>
                  <input className="form-control" value={addrForm.zip} onChange={e => setAddrForm({ ...addrForm, zip: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input className="form-control" value={addrForm.country} onChange={e => setAddrForm({ ...addrForm, country: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="addrDefault" checked={addrForm.isDefault} onChange={e => setAddrForm({ ...addrForm, isDefault: e.target.checked })} />
                  <label htmlFor="addrDefault" style={{ margin: 0 }}>Set as default</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="submit" className="btn btn-primary btn-sm">{addrEditing !== null ? 'Update' : 'Add'}</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => { setAddrShowForm(false); setAddrError('') }}>Cancel</button>
              </div>
            </form>
          )}

          {addresses.length === 0 && !addrShowForm ? (
            <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>No addresses saved for this user.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {addresses.map((addr, i) => (
                <div key={i} style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  padding: 12,
                  background: addr.isDefault ? '#f0faf0' : '#fff',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <strong>{addr.label}</strong>
                      {addr.isDefault && <span style={{ marginLeft: 8, fontSize: 11, background: '#4caf50', color: '#fff', padding: '2px 8px', borderRadius: 4 }}>Default</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handleAddrEdit(i)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleAddrDelete(i)}>Delete</button>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                    {addr.street}, {addr.city}, {addr.state} - {addr.zip}, {addr.country}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

export default Users
