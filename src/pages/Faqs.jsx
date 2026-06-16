import { useState, useEffect } from 'react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Swal from 'sweetalert2'
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const Faqs = () => {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ question: '', answer: '', category: 'general', order: 0 })

  const fetchData = async () => {
    try {
      const { data } = await api.get('/admin/faq')
      setFaqs(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => { setForm({ question: '', answer: '', category: 'general', order: 0 }); setModal('add') }

  const openEdit = (faq) => {
    setForm({ question: faq.question, answer: faq.answer, category: faq.category, order: faq.order || 0 })
    setModal({ type: 'edit', id: faq._id })
  }

  const handleSave = async () => {
    try {
      if (modal?.type === 'edit') {
        await api.put(`/admin/faq/${modal.id}`, form)
      } else {
        await api.post('/admin/faq', form)
      }
      setModal(null)
      fetchData()
    } catch (err) { Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Save failed' }) }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Are you sure?', text: 'Delete this FAQ?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Yes, delete it!' })
    if (!result.isConfirmed) return
    try { await api.delete(`/admin/faq/${id}`); fetchData() }
    catch (err) { Toast.fire({ icon: 'error', title: 'Delete failed' }) }
  }

  const columns = [
    { header: 'Question', render: row => <strong>{row.question}</strong> },
    { header: 'Category', render: row => <span className="status-badge active">{row.category}</span> },
    { header: 'Order', accessor: 'order' },
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
        <h3>FAQs ({faqs.length})</h3>
        <button className="btn btn-primary" onClick={openAdd}>+ Add FAQ</button>
      </div>
      <DataTable columns={columns} data={faqs} loading={loading} />

      {modal && (
        <Modal title={modal?.type === 'edit' ? 'Edit FAQ' : 'Add FAQ'} onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </>
          }
        >
          <div className="form-group">
            <label>Question *</label>
            <input className="form-control" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Answer *</label>
            <textarea className="form-control" rows={4} value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="general">General</option>
                <option value="shipping">Shipping</option>
                <option value="payment">Payment</option>
                <option value="orders">Orders</option>
                <option value="returns">Returns</option>
              </select>
            </div>
            <div className="form-group">
              <label>Order</label>
              <input className="form-control" type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Faqs
