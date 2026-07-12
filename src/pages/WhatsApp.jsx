import { useState, useEffect, useCallback } from 'react'
import Swal from 'sweetalert2'
import {
  MessageCircle, Upload, Send, Search, Trash2, Plus, User, Filter, Clock,
  CheckCircle, XCircle, FileText, Download, FileCode, Edit3, Eye, EyeOff, AlertTriangle, SquareCheck,
} from 'lucide-react'
import api from '../api/axios'

const CATEGORIES = ['marketing', 'utility', 'authentication']
const LANGUAGES = [
  { code: 'en_US', label: 'English (US)' },
  { code: 'en_GB', label: 'English (UK)' },
  { code: 'hi', label: 'Hindi' },
  { code: 'hi_IN', label: 'Hindi (India)' },
  { code: 'ar', label: 'Arabic' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'pt_BR', label: 'Portuguese (Brazil)' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
]

const emptyTemplate = { name: '', category: 'marketing', language: 'en_US', header: '', body: '', footer: '', buttons: [], parameters: [] }
const emptyMsgForm = { message: '', recipients: 'all', tag: '', selectedPhones: [], sendMode: 'freeform', templateId: '', templateParams: [], sendProvider: '' }

const WhatsApp = () => {
  const [activeTab, setActiveTab] = useState('contacts')
  const [configStatus, setConfigStatus] = useState(null)
  const [contacts, setContacts] = useState([])
  const [tags, setTags] = useState([])
  const [messages, setMessages] = useState([])
  const [templates, setTemplates] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [showAddModal, setShowAddModal] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '', tags: '' })

  const [csvFile, setCsvFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  const [msgForm, setMsgForm] = useState(emptyMsgForm)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState(null)
  const [recipientSearch, setRecipientSearch] = useState('')
  const [recipientResults, setRecipientResults] = useState([])

  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [tplForm, setTplForm] = useState({ ...emptyTemplate })
  const [buttonInput, setButtonInput] = useState('')
  const [paramInput, setParamInput] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const [selectedIds, setSelectedIds] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  useEffect(() => {
    api.get('/admin/whatsapp/config-status').then(r => setConfigStatus(r.data)).catch(() => {})
  }, [])

  const fetchContacts = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 50 }
      if (search) params.search = search
      if (tagFilter) params.tag = tagFilter
      const res = await api.get('/admin/whatsapp/contacts', { params })
      setContacts(res.data.data || [])
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 })
      setCurrentPage(page)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [search, tagFilter])

  const fetchTags = async () => {
    try { const res = await api.get('/admin/whatsapp/tags'); setTags(res.data.data || []) } catch (err) { console.error(err) }
  }

  const fetchMessages = async () => {
    setLoading(true)
    try { const res = await api.get('/admin/whatsapp/messages'); setMessages(res.data.data || []) } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchTemplates = async () => {
    setLoading(true)
    try { const res = await api.get('/admin/whatsapp/templates'); setTemplates(res.data.data || []) } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (activeTab === 'contacts') { fetchContacts(1); fetchTags() }
    if (activeTab === 'history') fetchMessages()
    if (activeTab === 'templates') fetchTemplates()
  }, [activeTab])

  useEffect(() => { if (activeTab === 'contacts') fetchContacts(1) }, [search, tagFilter])

  // ── Contact handlers ──
  const handleAddContact = async () => {
    if (!newContact.phone.trim()) { Swal.fire('Error', 'Phone number required', 'error'); return }
    try {
      await api.post('/admin/whatsapp/contacts', {
        name: newContact.name,
        phone: newContact.phone,
        tags: newContact.tags ? newContact.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      })
      Swal.fire('Success', 'Contact added', 'success')
      setShowAddModal(false)
      setNewContact({ name: '', phone: '', tags: '' })
      fetchContacts(currentPage)
    } catch (err) { Swal.fire('Error', err.response?.data?.message || 'Failed', 'error') }
  }

  const handleDeleteContact = async (id) => {
    const c = await Swal.fire({ title: 'Delete contact?', showCancelButton: true, confirmButtonColor: '#ef4444' })
    if (!c.isConfirmed) return
    try { await api.delete(`/admin/whatsapp/contacts/${id}`); Swal.fire('Deleted', '', 'success'); fetchContacts(currentPage) }
    catch { Swal.fire('Error', 'Failed', 'error') }
  }

  // ── CSV handlers ──
  const handleCsvUpload = async () => {
    if (!csvFile) { Swal.fire('Error', 'Select a CSV file first', 'error'); return }
    setUploading(true); setUploadResult(null)
    try {
      const fd = new FormData(); fd.append('file', csvFile)
      const res = await api.post('/admin/whatsapp/import-csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUploadResult(res.data)
      Swal.fire('Imported', `${res.data.imported} imported, ${res.data.skipped} skipped`, 'success')
      setCsvFile(null); fetchContacts(1); fetchTags()
    } catch (err) { Swal.fire('Error', err.response?.data?.message || 'Import failed', 'error') }
    finally { setUploading(false) }
  }

  const handleCsvDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0]
    if (file) setCsvFile(file)
  }

  // ── Recipient search ──
  const searchRecipients = async (q) => {
    setRecipientSearch(q)
    if (q.length < 2) { setRecipientResults([]); return }
    try { const res = await api.get('/admin/whatsapp/contacts', { params: { search: q, limit: 20 } }); setRecipientResults(res.data.data || []) }
    catch { console.error() }
  }

  const toggleRecipient = (phone) => {
    setMsgForm(prev => ({
      ...prev,
      selectedPhones: prev.selectedPhones.includes(phone)
        ? prev.selectedPhones.filter(p => p !== phone)
        : [...prev.selectedPhones, phone],
    }))
  }

  // ── Send message ──
  const handleSendMessage = async () => {
    setSending(true); setSendResult(null)
    try {
      const body = {}
      if (msgForm.sendProvider) body.provider = msgForm.sendProvider
      if (msgForm.recipients === 'all') body.recipients = 'all'
      else if (msgForm.recipients === 'tag') { body.tag = msgForm.tag; if (!msgForm.tag) { Swal.fire('Error', 'Select a tag', 'error'); setSending(false); return } }
      else if (msgForm.recipients === 'individual') { body.recipients = msgForm.selectedPhones; if (!msgForm.selectedPhones.length) { Swal.fire('Error', 'Select contacts', 'error'); setSending(false); return } }

      let res
      if (msgForm.sendMode === 'template') {
        if (!msgForm.templateId) { Swal.fire('Error', 'Select a template', 'error'); setSending(false); return }
        body.templateId = msgForm.templateId
        body.params = msgForm.templateParams.filter(Boolean)
        res = await api.post('/admin/whatsapp/send-template', body)
      } else {
        if (!msgForm.message.trim()) { Swal.fire('Error', 'Type a message', 'error'); setSending(false); return }
        body.message = msgForm.message
        res = await api.post('/admin/whatsapp/send', body)
      }

      setSendResult(res.data)
      Swal.fire('Sent', `${res.data.sentCount} sent, ${res.data.failCount} failed`, res.data.failCount === res.data.total ? 'error' : 'success')
      setMsgForm({ ...emptyMsgForm, sendMode: msgForm.sendMode })
    } catch (err) { Swal.fire('Error', err.response?.data?.message || 'Send failed', 'error') }
    finally { setSending(false) }
  }

  const exportContacts = () => {
    const csv = 'Name,Phone,Tags,Source,Last Message,Messages\n' + contacts.map(c =>
      `"${c.name || ''}","${c.phone}","${(c.tags || []).join('; ')}","${c.source}","${c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : ''}","${c.messageCount || 0}"`
    ).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'whatsapp-contacts.csv'; a.click(); URL.revokeObjectURL(url)
  }

  // ── Selection handlers ──
  const toggleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
      setSelectAll(false)
    } else {
      setSelectedIds(contacts.map(c => c._id))
      setSelectAll(true)
    }
  }

  useEffect(() => {
    if (contacts.length > 0 && selectedIds.length === contacts.length) setSelectAll(true)
    else setSelectAll(false)
  }, [selectedIds, contacts])

  const sendToSelected = () => {
    const phones = contacts.filter(c => selectedIds.includes(c._id)).map(c => c.phone)
    if (phones.length === 0) { Swal.fire('Info', 'Select contacts first', 'info'); return }
    setMsgForm(prev => ({ ...prev, recipients: 'individual', selectedPhones: phones, sendMode: 'freeform' }))
    setActiveTab('send')
    Swal.fire('Selected', `${phones.length} contacts ready to receive message`, 'success')
  }

  const sendToAll = () => {
    setMsgForm(prev => ({ ...prev, recipients: 'all', sendMode: 'freeform' }))
    setActiveTab('send')
  }

  // ── Template handlers ──
  const openCreateTemplate = () => { setEditingTemplate(null); setTplForm({ ...emptyTemplate }); setShowTemplateModal(true) }
  const openEditTemplate = (t) => { setEditingTemplate(t); setTplForm({ name: t.name, category: t.category, language: t.language, header: t.header || '', body: t.body, footer: t.footer || '', buttons: t.buttons || [], parameters: t.parameters || [] }); setShowTemplateModal(true) }

  const handleSaveTemplate = async () => {
    if (!tplForm.body.trim()) { Swal.fire('Error', 'Template body is required', 'error'); return }
    try {
      if (editingTemplate) {
        await api.put(`/admin/whatsapp/templates/${editingTemplate._id}`, tplForm)
        Swal.fire('Updated', 'Template updated', 'success')
      } else {
        if (!tplForm.name.trim()) { Swal.fire('Error', 'Template name is required', 'error'); return }
        await api.post('/admin/whatsapp/templates', tplForm)
        Swal.fire('Created', 'Template created', 'success')
      }
      setShowTemplateModal(false); fetchTemplates()
    } catch (err) { Swal.fire('Error', err.response?.data?.message || 'Failed', 'error') }
  }

  const handleDeleteTemplate = async (id) => {
    const c = await Swal.fire({ title: 'Delete template?', showCancelButton: true, confirmButtonColor: '#ef4444' })
    if (!c.isConfirmed) return
    try { await api.delete(`/admin/whatsapp/templates/${id}`); Swal.fire('Deleted', '', 'success'); fetchTemplates() }
    catch { Swal.fire('Error', 'Failed', 'error') }
  }

  const handleSubmitTemplate = async (id) => {
    const c = await Swal.fire({ title: 'Submit for Meta review?', text: 'Template will be marked as pending. Approve it from Meta Business Manager.', showCancelButton: true, confirmButtonColor: '#6366f1' })
    if (!c.isConfirmed) return
    try { await api.post(`/admin/whatsapp/templates/${id}/submit`); Swal.fire('Submitted', '', 'success'); fetchTemplates() }
    catch (err) { Swal.fire('Error', err.response?.data?.message || 'Failed', 'error') }
  }

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'draft' : 'approved'
    const label = newStatus === 'approved' ? 'Approve' : 'Revoke approval'
    const c = await Swal.fire({ title: `${label} template?`, showCancelButton: true, confirmButtonColor: newStatus === 'approved' ? '#10b981' : '#f59e0b' })
    if (!c.isConfirmed) return
    try { await api.put(`/admin/whatsapp/templates/${id}/status`, { status: newStatus }); Swal.fire('Updated', '', 'success'); fetchTemplates() }
    catch (err) { Swal.fire('Error', err.response?.data?.message || 'Failed', 'error') }
  }

  const addTemplateButton = () => {
    if (buttonInput.trim()) { setTplForm(p => ({ ...p, buttons: [...p.buttons, buttonInput.trim()] })); setButtonInput('') }
  }
  const removeTemplateButton = (idx) => { setTplForm(p => ({ ...p, buttons: p.buttons.filter((_, i) => i !== idx) })) }
  const addTemplateParam = () => {
    if (paramInput.trim()) { setTplForm(p => ({ ...p, parameters: [...p.parameters, { name: paramInput.trim(), example: '' }] })); setParamInput('') }
  }
  const removeTemplateParam = (idx) => { setTplForm(p => ({ ...p, parameters: p.parameters.filter((_, i) => i !== idx) })) }
  const updateParamExample = (idx, val) => { setTplForm(p => ({ ...p, parameters: p.parameters.map((pp, i) => i === idx ? { ...pp, example: val } : pp) })) }

  const renderPreview = () => {
    let body = tplForm.body
    tplForm.parameters.forEach((p, i) => { body = body.replace(new RegExp(`\\{\\{${i + 1}\\}\\}`, 'g'), p.example || `{{${i + 1}}}`) })
    return body
  }

  const tabs = [
    { key: 'contacts', label: 'Contacts', icon: User },
    { key: 'upload', label: 'Upload CSV', icon: Upload },
    { key: 'send', label: 'Send Message', icon: Send },
    { key: 'templates', label: 'Templates', icon: FileCode },
    { key: 'history', label: 'History', icon: Clock },
  ]

  const selectedTemplate = templates.find(t => t._id === msgForm.templateId)
  const approvedTemplates = templates.filter(t => t.status === 'approved')

  return (
    <div>
      <div className="page-header">
        <h2>WhatsApp Messenger</h2>
        <p>Manage contacts, templates, and send WhatsApp messages</p>
      </div>

      {configStatus && !configStatus.configured && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          WhatsApp API not configured. Add <strong>WHATSAPP_PHONE_ID</strong> and <strong>WHATSAPP_TOKEN</strong> in backend .env file.
        </div>
      )}

      <div className="wa-stats-grid">
        <div className="stat-card" style={{ '--card-accent': '#25d366' }}>
          <div className="stat-card-inner">
            <div><div className="stat-label">Contacts</div><div className="stat-value">{pagination.total || 0}</div></div>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(37,211,102,0.1)' }}><User size={22} style={{ color: '#25d366' }} /></div>
          </div>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#6366f1' }}>
          <div className="stat-card-inner">
            <div><div className="stat-label">Messages Sent</div><div className="stat-value">{messages.length}</div></div>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(99,102,241,0.1)' }}><Send size={22} style={{ color: '#6366f1' }} /></div>
          </div>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#f59e0b' }}>
          <div className="stat-card-inner">
            <div><div className="stat-label">Templates</div><div className="stat-value">{templates.length}</div></div>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(245,158,11,0.1)' }}><FileCode size={22} style={{ color: '#f59e0b' }} /></div>
          </div>
        </div>
        <div className="stat-card" style={{ '--card-accent': configStatus?.configured ? '#10b981' : '#ef4444' }}>
          <div className="stat-card-inner">
            <div><div className="stat-label">API Status</div><div className="stat-value" style={{ fontSize: '1.1rem' }}>{configStatus?.configured ? `Connected (${configStatus.provider})` : 'Not Set'}</div></div>
            <div className="stat-icon-wrapper" style={{ background: configStatus?.configured ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
              {configStatus?.configured ? <CheckCircle size={22} style={{ color: '#10b981' }} /> : <XCircle size={22} style={{ color: '#ef4444' }} />}
            </div>
          </div>
        </div>
      </div>

      <div className="wa-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`wa-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            <t.icon size={16} /><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════ CONTACTS ═══════════ */}
      {activeTab === 'contacts' && (
        <div className="card">
          <div className="card-header">
            <h3><User size={18} /> Contacts ({pagination.total})</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {selectedIds.length > 0 && (
                <button className="btn btn-success btn-sm" onClick={sendToSelected}><Send size={14} /> Send to {selectedIds.length}</button>
              )}
              {contacts.length > 0 && (
                <button className="btn btn-outline btn-sm" onClick={sendToAll}><Send size={14} /> Send to All</button>
              )}
              <button className="btn btn-outline btn-sm" onClick={exportContacts}><Download size={14} /> Export</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}><Plus size={14} /> Add</button>
            </div>
          </div>
          <div className="search-bar">
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input className="form-control" placeholder="Search name or phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
            </div>
            <select className="form-control" value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={{ maxWidth: 200 }}>
              <option value="">All Tags</option>
              {tags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {loading ? <div className="admin-loader">Loading...</div>
            : contacts.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><MessageCircle size={48} /></div><h3>No contacts yet</h3><p>Add contacts manually or upload a CSV file</p></div>
            ) : (
              <>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>
                          <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
                        </th>
                        <th>Name</th><th>Phone</th><th>Tags</th><th>Source</th><th>Msgs</th><th>Last Sent</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map(c => (
                        <tr key={c._id} className={selectedIds.includes(c._id) ? 'wa-row-selected' : ''}>
                          <td>
                            <input type="checkbox" checked={selectedIds.includes(c._id)} onChange={() => toggleSelectOne(c._id)} style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
                          </td>
                          <td><strong>{c.name || '—'}</strong></td>
                          <td style={{ fontFamily: 'monospace' }}>{c.phone}</td>
                          <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{(c.tags || []).map(t => <span key={t} className="wa-tag">{t}</span>)}</div></td>
                          <td><span className={`status-badge ${c.source === 'csv' ? 'confirmed' : 'draft'}`}>{c.source}</span></td>
                          <td>{c.messageCount || 0}</td>
                          <td>{c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : '—'}</td>
                          <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteContact(c._id)} style={{ padding: '4px 10px' }}><Trash2 size={13} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button disabled={currentPage <= 1} onClick={() => fetchContacts(currentPage - 1)}>Prev</button>
                    <span>Page {currentPage} of {pagination.pages}</span>
                    <button disabled={currentPage >= pagination.pages} onClick={() => fetchContacts(currentPage + 1)}>Next</button>
                  </div>
                )}
              </>
            )}
        </div>
      )}

      {/* ═══════════ UPLOAD CSV ═══════════ */}
      {activeTab === 'upload' && (
        <div className="card">
          <div className="card-header"><h3><Upload size={18} /> Upload CSV / Excel</h3></div>
          <div className="wa-upload-area" onDragOver={e => e.preventDefault()} onDrop={handleCsvDrop}>
            <Upload size={40} style={{ color: 'var(--text-light)', marginBottom: 12 }} />
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Drag & drop your CSV file here</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: 16 }}>or click to browse</p>
            <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
              <FileText size={14} /> Choose File
              <input type="file" accept=".csv,.tsv,.txt" style={{ display: 'none' }} onChange={handleCsvDrop} />
            </label>
            {csvFile && <div className="wa-file-selected"><FileText size={16} /><span>{csvFile.name}</span><span className="wa-file-size">{(csvFile.size / 1024).toFixed(1)} KB</span></div>}
          </div>
          {csvFile && <div style={{ marginTop: 16, textAlign: 'center' }}><button className="btn btn-primary" onClick={handleCsvUpload} disabled={uploading}>{uploading ? 'Importing...' : 'Import Contacts'}</button></div>}
          {uploadResult && (
            <div className="alert alert-success" style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <span>Imported: {uploadResult.imported} | Skipped: {uploadResult.skipped} | Total: {uploadResult.total}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => { setActiveTab('contacts') }}>View Contacts</button>
                <button className="btn btn-success btn-sm" onClick={sendToAll}><Send size={14} /> Send Message to All</button>
              </div>
            </div>
          )}
          <div className="wa-csv-info" style={{ marginTop: 24 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8 }}>CSV Format Guide</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 12 }}>Supported column headers for phone: <code style={{ background: 'var(--border-light)', padding: '2px 6px', borderRadius: 4 }}>phone, Phone, mobile, number</code> &amp; name: <code style={{ background: 'var(--border-light)', padding: '2px 6px', borderRadius: 4 }}>name, Name</code></p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Example: <code style={{ background: 'var(--border-light)', padding: '2px 6px', borderRadius: 4 }}>phone,name</code><br /><code style={{ background: 'var(--border-light)', padding: '2px 6px', borderRadius: 4 }}>919876543210,John Doe</code></p>
          </div>
        </div>
      )}

      {/* ═══════════ SEND MESSAGE ═══════════ */}
      {activeTab === 'send' && (
        <div className="card">
          <div className="card-header"><h3><Send size={18} /> Send WhatsApp Message</h3></div>
          {!configStatus?.configured && <div className="alert alert-danger">WhatsApp API not configured. Go to <strong>Settings</strong> and add your API credentials.</div>}

          {configStatus?.configured && (
            <div className="form-group">
              <label>Send via</label>
              <div className="wa-mode-toggle">
                {configStatus.meta?.configured && (
                  <button className={`wa-mode-btn ${(!msgForm.sendProvider || msgForm.sendProvider === 'meta') ? 'active freeform' : ''}`} onClick={() => setMsgForm(p => ({ ...p, sendProvider: 'meta' }))}>
                    Meta WhatsApp
                  </button>
                )}
                {configStatus.twilio?.configured && (
                  <button className={`wa-mode-btn ${msgForm.sendProvider === 'twilio' ? 'active template' : ''}`} onClick={() => setMsgForm(p => ({ ...p, sendProvider: 'twilio' }))}>
                    Twilio WhatsApp
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Message Type *</label>
            <div className="wa-mode-toggle">
              <button className={`wa-mode-btn ${msgForm.sendMode === 'freeform' ? 'active freeform' : ''}`} onClick={() => setMsgForm(p => ({ ...p, sendMode: 'freeform', templateId: '', templateParams: [] }))}>
                <MessageCircle size={16} /> Free-Form
              </button>
              <button className={`wa-mode-btn ${msgForm.sendMode === 'template' ? 'active template' : ''}`} onClick={() => setMsgForm(p => ({ ...p, sendMode: 'template', message: '' }))}>
                <FileCode size={16} /> Template
              </button>
            </div>
            <div className="wa-mode-hint">
              {msgForm.sendMode === 'freeform'
                ? <span><strong>Free-Form:</strong> Works within 24 hours of customer's last message. No Meta approval needed.</span>
                : <span><strong>Template:</strong> Works anytime. Template must be approved in Meta Business Manager first.</span>
              }
            </div>
          </div>

          {msgForm.sendMode === 'freeform' ? (
            <div className="form-group">
              <label>Message *</label>
              <textarea className="form-control" rows={5} placeholder="Type your WhatsApp message here..." value={msgForm.message} onChange={e => setMsgForm(p => ({ ...p, message: e.target.value }))} />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{msgForm.message.length} characters</div>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Select Template *</label>
                {approvedTemplates.length === 0 ? (
                  <div className="alert alert-warning" style={{ marginBottom: 0 }}>
                    No approved templates. Create a template in the <strong>Templates</strong> tab first, then set status to Approved.
                  </div>
                ) : (
                  <select className="form-control" value={msgForm.templateId} onChange={e => {
                    const tid = e.target.value; const tpl = templates.find(t => t._id === tid)
                    setMsgForm(p => ({ ...p, templateId: tid, templateParams: tpl ? tpl.parameters.map(() => '') : [] }))
                  }}>
                    <option value="">-- Select Template --</option>
                    {approvedTemplates.map(t => <option key={t._id} value={t._id}>{t.name} ({t.category})</option>)}
                  </select>
                )}
              </div>
              {selectedTemplate && selectedTemplate.parameters.length > 0 && (
                <div className="form-group">
                  <label>Template Variables</label>
                  <div className="wa-params-grid">
                    {selectedTemplate.parameters.map((p, i) => (
                      <div key={i} className="wa-param-row">
                        <span className="wa-param-label">{`{{${i + 1}}}`}</span>
                        <input className="form-control" placeholder={p.name || `Variable ${i + 1}`} value={msgForm.templateParams[i] || ''} onChange={e => {
                          const np = [...msgForm.templateParams]; np[i] = e.target.value; setMsgForm(prev => ({ ...prev, templateParams: np }))
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedTemplate && (
                <div className="wa-template-preview-box">
                  <div className="wa-tpl-preview-label">Preview</div>
                  {selectedTemplate.header && <div className="wa-tpl-header">{selectedTemplate.header}</div>}
                  <div className="wa-tpl-body">
                    {(() => {
                      let b = selectedTemplate.body
                      selectedTemplate.parameters.forEach((p, i) => { b = b.replace(new RegExp(`\\{\\{${i + 1}\\}\\}`, 'g'), msgForm.templateParams[i] || `{{${i + 1}}}`) })
                      return b
                    })()}
                  </div>
                  {selectedTemplate.footer && <div className="wa-tpl-footer">{selectedTemplate.footer}</div>}
                  {selectedTemplate.buttons?.length > 0 && (
                    <div className="wa-tpl-buttons">{selectedTemplate.buttons.map((b, i) => <button key={i} className="wa-tpl-btn">{b}</button>)}</div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label>Send To *</label>
            <div className="wa-recipient-options">
              {[['all', 'All Contacts'], ['tag', 'By Tag'], ['individual', 'Individual']].map(([val, lbl]) => (
                <label key={val} className="wa-recipient-option">
                  <input type="radio" name="recipients" value={val} checked={msgForm.recipients === val} onChange={e => setMsgForm(p => ({ ...p, recipients: e.target.value }))} />
                  <span>{lbl}</span>
                </label>
              ))}
            </div>
          </div>

          {msgForm.recipients === 'tag' && (
            <div className="form-group">
              <label>Select Tag</label>
              <select className="form-control" value={msgForm.tag} onChange={e => setMsgForm(p => ({ ...p, tag: e.target.value }))}>
                <option value="">-- Select Tag --</option>
                {tags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {msgForm.recipients === 'individual' && (
            <div className="form-group">
              <label>Search & Select Contacts</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input className="form-control" placeholder="Search by name or phone..." value={recipientSearch} onChange={e => searchRecipients(e.target.value)} style={{ paddingLeft: 36 }} />
              </div>
              {recipientResults.length > 0 && (
                <div className="wa-recipient-dropdown">
                  {recipientResults.map(c => (
                    <div key={c._id} className={`wa-recipient-item ${msgForm.selectedPhones.includes(c.phone) ? 'selected' : ''}`} onClick={() => toggleRecipient(c.phone)}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.84rem' }}>{c.phone}</span>
                      <span>{c.name || 'Unknown'}</span>
                      {msgForm.selectedPhones.includes(c.phone) && <CheckCircle size={14} style={{ color: 'var(--success)' }} />}
                    </div>
                  ))}
                </div>
              )}
              {msgForm.selectedPhones.length > 0 && (
                <div className="wa-selected-phones">
                  {msgForm.selectedPhones.map(p => <span key={p} className="wa-tag">{p}<button onClick={() => toggleRecipient(p)}>&times;</button></span>)}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleSendMessage} disabled={sending || !configStatus?.configured}>
              <Send size={14} /> {sending ? 'Sending...' : 'Send Message'}
            </button>
            {sendResult && <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Sent: {sendResult.sentCount} | Failed: {sendResult.failCount} | Total: {sendResult.total}</span>}
          </div>
        </div>
      )}

      {/* ═══════════ TEMPLATES ═══════════ */}
      {activeTab === 'templates' && (
        <div className="card">
          <div className="card-header">
            <h3><FileCode size={18} /> Message Templates ({templates.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={openCreateTemplate}><Plus size={14} /> Create Template</button>
          </div>
          <div className="alert alert-info" style={{ marginBottom: 16, fontSize: '0.84rem' }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>
              <strong>How it works:</strong> Create a template here → Set status to "Approved" (after Meta approves it from Business Manager) → Use it in Send Message tab.
              Templates with <code>{'{{1}}'}</code>, <code>{'{{2}}'}</code> etc. support dynamic variables.
            </span>
          </div>
          {loading ? <div className="admin-loader">Loading...</div>
            : templates.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><FileCode size={48} /></div><h3>No templates yet</h3><p>Create your first WhatsApp message template</p></div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Name</th><th>Category</th><th>Language</th><th>Body</th><th>Vars</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {templates.map(t => (
                      <tr key={t._id}>
                        <td><strong style={{ fontFamily: 'monospace', fontSize: '0.84rem' }}>{t.name}</strong></td>
                        <td><span className={`status-badge ${t.category === 'marketing' ? 'confirmed' : t.category === 'utility' ? 'shipped' : 'draft'}`}>{t.category}</span></td>
                        <td style={{ fontSize: '0.82rem' }}>{t.language}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.84rem' }}>{t.body}</td>
                        <td>{t.parameters?.length || 0}</td>
                        <td>
                          <span className={`status-badge ${t.status === 'approved' ? 'delivered' : t.status === 'pending' ? 'confirmed' : t.status === 'rejected' ? 'cancelled' : 'draft'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => openEditTemplate(t)} style={{ padding: '4px 8px' }}><Edit3 size={13} /></button>
                            {t.status !== 'approved' && <button className="btn btn-success btn-sm" onClick={() => handleStatusToggle(t._id, t.status)} style={{ padding: '4px 8px' }} title="Approve"><CheckCircle size={13} /></button>}
                            {t.status === 'approved' && <button className="btn btn-warning btn-sm" onClick={() => handleStatusToggle(t._id, t.status)} style={{ padding: '4px 8px' }} title="Revoke"><EyeOff size={13} /></button>}
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTemplate(t._id)} style={{ padding: '4px 8px' }}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {/* ═══════════ HISTORY ═══════════ */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <h3><Clock size={18} /> Message History ({messages.length})</h3>
            <button className="btn btn-outline btn-sm" onClick={fetchMessages}>Refresh</button>
          </div>
          {loading ? <div className="admin-loader">Loading...</div>
            : messages.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><Clock size={48} /></div><h3>No messages sent yet</h3></div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Type</th><th>Message</th><th>Recipients</th><th>Sent</th><th>Failed</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {messages.map(m => (
                      <tr key={m._id}>
                        <td><span className={`status-badge ${m.type === 'bulk' ? 'confirmed' : 'draft'}`}>{m.type}</span></td>
                        <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.message}</td>
                        <td>{m.recipients?.length || 0}</td>
                        <td><span style={{ color: 'var(--success)', fontWeight: 600 }}>{m.sentCount}</span></td>
                        <td>{m.failCount > 0 ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{m.failCount}</span> : '0'}</td>
                        <td><span className={`status-badge ${m.status === 'done' ? 'delivered' : m.status === 'failed' ? 'cancelled' : 'pending'}`}>{m.status}</span></td>
                        <td>{new Date(m.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {/* ═══════════ ADD CONTACT MODAL ═══════════ */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Contact</h3><button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button></div>
            <div className="modal-body">
              <div className="form-group"><label>Phone * (with country code, e.g. 919876543210)</label><input className="form-control" placeholder="919876543210" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="form-group"><label>Name</label><input className="form-control" placeholder="John Doe" value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-group"><label>Tags (comma separated)</label><input className="form-control" placeholder="vip, customer, lead" value={newContact.tags} onChange={e => setNewContact(p => ({ ...p, tags: e.target.value }))} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAddContact}>Add Contact</button></div>
          </div>
        </div>
      )}

      {/* ═══════════ TEMPLATE MODAL ═══════════ */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>{editingTemplate ? 'Edit Template' : 'Create Template'}</h3>
              <button className="modal-close" onClick={() => setShowTemplateModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Template Name *</label>
                  <input className="form-control" placeholder="e.g. furniture_offer" value={tplForm.name} onChange={e => setTplForm(p => ({ ...p, name: e.target.value }))} disabled={!!editingTemplate} />
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>Lowercase, underscores only. Used as Meta template ID.</div>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-control" value={tplForm.category} onChange={e => setTplForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Language</label>
                <select className="form-control" value={tplForm.language} onChange={e => setTplForm(p => ({ ...p, language: e.target.value }))}>
                  {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Header (optional)</label>
                <input className="form-control" placeholder="e.g. *Big Sale!*" value={tplForm.header} onChange={e => setTplForm(p => ({ ...p, header: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Body *</label>
                <textarea className="form-control" rows={4} placeholder="Hi {{1}}, we have a great offer for you! Use code {{2}} for 20% off." value={tplForm.body} onChange={e => setTplForm(p => ({ ...p, body: e.target.value }))} />
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>Use {'{{1}}'}, {'{{2}}'} etc. for dynamic variables</div>
              </div>
              <div className="form-group">
                <label>Footer (optional)</label>
                <input className="form-control" placeholder="e.g. Reply STOP to opt out" value={tplForm.footer} onChange={e => setTplForm(p => ({ ...p, footer: e.target.value }))} />
              </div>

              <div className="form-group">
                <label>Buttons (optional)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-control" placeholder="e.g. Shop Now" value={buttonInput} onChange={e => setButtonInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTemplateButton())} />
                  <button className="btn btn-outline btn-sm" onClick={addTemplateButton} type="button">Add</button>
                </div>
                {tplForm.buttons.length > 0 && (
                  <div className="wa-selected-phones" style={{ marginTop: 8 }}>
                    {tplForm.buttons.map((b, i) => <span key={i} className="wa-tag">{b}<button onClick={() => removeTemplateButton(i)}>&times;</button></span>)}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Variables</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-control" placeholder="e.g. customer_name" value={paramInput} onChange={e => setParamInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTemplateParam())} />
                  <button className="btn btn-outline btn-sm" onClick={addTemplateParam} type="button">Add</button>
                </div>
                {tplForm.parameters.length > 0 && (
                  <div className="wa-params-grid" style={{ marginTop: 8 }}>
                    {tplForm.parameters.map((p, i) => (
                      <div key={i} className="wa-param-row">
                        <span className="wa-param-label">{`{{${i + 1}}}`} ({p.name})</span>
                        <input className="form-control" placeholder="Example value" value={p.example} onChange={e => updateParamExample(i, e.target.value)} />
                        <button className="btn btn-danger btn-sm" onClick={() => removeTemplateParam(i)} style={{ padding: '4px 8px' }}><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="btn btn-outline btn-sm" onClick={() => setShowPreview(p => !p)} style={{ marginBottom: 12 }}>
                {showPreview ? <><EyeOff size={14} /> Hide Preview</> : <><Eye size={14} /> Show Preview</>}
              </button>
              {showPreview && (
                <div className="wa-template-preview-box">
                  {tplForm.header && <div className="wa-tpl-header">{tplForm.header}</div>}
                  <div className="wa-tpl-body">{renderPreview()}</div>
                  {tplForm.footer && <div className="wa-tpl-footer">{tplForm.footer}</div>}
                  {tplForm.buttons.length > 0 && <div className="wa-tpl-buttons">{tplForm.buttons.map((b, i) => <button key={i} className="wa-tpl-btn">{b}</button>)}</div>}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowTemplateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveTemplate}>{editingTemplate ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WhatsApp
