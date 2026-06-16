import { useState, useEffect } from 'react'
import api from '../api/axios'
import DataTable from '../components/DataTable'

const Newsletter = () => {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/newsletter')
      .then(res => setSubscribers(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const exportCSV = () => {
    const csv = 'Email,Subscribed,Date\n' + subscribers.map(s =>
      `"${s.email}","${s.subscribed ? 'Yes' : 'No'}","${new Date(s.createdAt).toLocaleDateString()}"`
    ).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'newsletter-subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    { header: 'Email', render: row => <strong>{row.email}</strong> },
    {
      header: 'Status',
      render: row => <span className={`status-badge ${row.subscribed ? 'published' : 'draft'}`}>{row.subscribed ? 'Subscribed' : 'Unsubscribed'}</span>,
    },
    { header: 'Date', render: row => new Date(row.createdAt).toLocaleDateString() },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h3>Newsletter Subscribers ({subscribers.length})</h3>
        <button className="btn btn-primary" onClick={exportCSV}>Export CSV</button>
      </div>
      <DataTable columns={columns} data={subscribers} loading={loading} />
    </div>
  )
}

export default Newsletter
