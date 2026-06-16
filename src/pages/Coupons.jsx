import { useState, useEffect } from 'react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Swal from 'sweetalert2'
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const Coupons = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({
    code: '', type: 'percentage', value: '', minAmount: 0, usageLimit: 0, expiresAt: '', isActive: true,
  })

  const fetchData = async () => {
    try {
      const { data } = await api.get('/admin/coupons')
      setCoupons(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => {
    setForm({ code: '', type: 'percentage', value: '', minAmount: 0, usageLimit: 0, expiresAt: '', isActive: true })
    setModal('add')
  }

  const openEdit = (coupon) => {
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minAmount: coupon.minAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : '',
      isActive: coupon.isActive ?? true,
    })
    setModal({ type: 'edit', id: coupon._id })
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        minAmount: Number(form.minAmount),
        usageLimit: Number(form.usageLimit),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      }
      if (modal?.type === 'edit') {
        await api.put(`/admin/coupons/${modal.id}`, payload)
      } else {
        await api.post('/admin/coupons', payload)
      }
      setModal(null)
      fetchData()
    } catch (err) { Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Save failed' }) }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Are you sure?', text: 'Delete this coupon?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Yes, delete it!' })
    if (!result.isConfirmed) return
    try { await api.delete(`/admin/coupons/${id}`); fetchData() }
    catch (err) { Toast.fire({ icon: 'error', title: 'Delete failed' }) }
  }

  const columns = [
    { header: 'Code', render: row => <strong>{row.code}</strong> },
    {
      header: 'Type',
      render: row => <span className="status-badge active">{row.type === 'percentage' ? '%' : '₹'} {row.type}</span>,
    },
    { header: 'Value', render: row => row.type === 'percentage' ? `${row.value}%` : `₹${row.value}` },
    { header: 'Min Amount', render: row => `₹${row.minAmount || 0}` },
    { header: 'Used', render: row => `${row.usedCount || 0}/${row.usageLimit || '∞'}` },
    { header: 'Expires', render: row => row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : 'Never' },
    {
      header: 'Active',
      render: row => <span className={`status-badge ${row.isActive ? 'published' : 'draft'}`}>{row.isActive ? 'Yes' : 'No'}</span>,
    },
    {
      header: 'Actions',
      render: row => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-outline btn-sm" onClick={() => openEdit(row)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row._id)}>Delete</button>
        </div>
      ),
    },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h3>Coupons ({coupons.length})</h3>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Coupon</button>
      </div>
      <DataTable columns={columns} data={coupons} loading={loading} />

      {modal && (
        <Modal title={modal?.type === 'edit' ? 'Edit Coupon' : 'Add Coupon'} onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label>Code *</label>
              <input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Value *</label>
              <input className="form-control" type="number" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Min Amount</label>
              <input className="form-control" type="number" step="0.01" value={form.minAmount} onChange={e => setForm({ ...form, minAmount: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Usage Limit (0 = unlimited)</label>
              <input className="form-control" type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Expires At</label>
              <input className="form-control" type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active
            </label>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Coupons
