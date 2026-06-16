import { useState, useEffect } from 'react'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const Contacts = () => {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewTarget, setViewTarget] = useState(null)

  useEffect(() => {
    api.get('/admin/contact')
      .then(res => setContacts(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { header: 'Name', render: row => <strong>{row.firstName} {row.lastName}</strong> },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', render: row => row.phone || '—' },
    { header: 'Date', render: row => new Date(row.createdAt).toLocaleDateString() },
    {
      header: 'Read',
      render: row => <span className={`status-badge ${row.isRead ? 'published' : 'draft'}`}>{row.isRead ? 'Read' : 'New'}</span>,
    },
  ]

  const markAsRead = async (id) => {
    try {
      await api.put(`/admin/contact/${id}`, { isRead: true })
      setContacts(prev => prev.map(c => c._id === id ? { ...c, isRead: true } : c))
    } catch (err) { console.error(err) }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Contact Submissions ({contacts.length})</h3>
      </div>
      <DataTable
        columns={columns}
        data={contacts}
        loading={loading}
        onRowClick={(row) => {
          if (!row.isRead) markAsRead(row._id)
          setViewTarget(row)
        }}
      />

      {viewTarget && (
        <Modal title="Contact Details" onClose={() => setViewTarget(null)}>
          <p><strong>Name:</strong> {viewTarget.firstName} {viewTarget.lastName}</p>
          <p><strong>Email:</strong> {viewTarget.email}</p>
          <p><strong>Phone:</strong> {viewTarget.phone || '—'}</p>
          <p><strong>Date:</strong> {new Date(viewTarget.createdAt).toLocaleString()}</p>
          <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
          <p><strong>Message:</strong></p>
          <p style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, marginTop: 4, whiteSpace: 'pre-wrap' }}>{viewTarget.message}</p>
        </Modal>
      )}
    </div>
  )
}

export default Contacts
