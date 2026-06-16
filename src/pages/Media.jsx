import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import Swal from 'sweetalert2'
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const Media = () => {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const fetchMedia = async () => {
    try {
      const { data } = await api.get('/admin/media')
      setMedia(data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMedia() }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      await api.post('/admin/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      fetchMedia()
    } catch (err) {
      Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Upload failed' })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title: 'Are you sure?', text: 'Delete this file?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Yes, delete it!' })
    if (!result.isConfirmed) return
    try {
      await api.delete(`/admin/media/${id}`)
      setMedia(prev => prev.filter(m => m._id !== id))
    } catch (err) { Toast.fire({ icon: 'error', title: 'Delete failed' }) }
  }

  const copyUrl = (url) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
    navigator.clipboard?.writeText(`${baseUrl}${url}`)
    Toast.fire({ icon: 'success', title: 'URL copied!' })
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Media Manager ({media.length})</h3>
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
          <button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : '+ Upload Image'}
          </button>
        </div>
      </div>

      {loading ? <div className="empty-state"><h3>Loading...</h3></div> : media.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🖼️</div>
          <h3>No media uploaded yet</h3>
          <p>Click "Upload Image" to add files</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {media.map(item => (
            <div key={item._id} style={{
              background: '#f9fafb', borderRadius: 'var(--radius)', overflow: 'hidden',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f0f0f0', overflow: 'hidden',
              }}>
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}${item.url}`}
                  alt={item.originalName}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  onError={e => { e.target.style.display = 'none'; e.target.parentElement.textContent = 'Error' }}
                />
              </div>
              <div style={{ padding: 10 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.originalName}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{formatSize(item.size)}</p>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => copyUrl(item.url)}>Copy URL</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Media
