import { useState, useRef } from 'react'
import { Upload, X, Loader } from 'lucide-react'
import api from '../api/axios'

const ImageUpload = ({ value, onChange, label = 'Image', accept = 'image/*' }) => {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || '')
  const inputRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/admin/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = data.data.url
      setPreview(url)
      onChange(url)
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleUrlChange = (e) => {
    const v = e.target.value
    setPreview(v)
    onChange(v)
  }

  const clearImage = () => {
    setPreview('')
    onChange('')
  }

  const getImageUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
    return `${baseUrl}${url}`
  }

  return (
    <div className="image-upload-wrapper">
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14, color: 'var(--text)' }}>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="form-control" placeholder="Paste image URL or upload" value={preview} onChange={handleUrlChange} style={{ flex: 1, minWidth: 200 }} />
        <input ref={inputRef} type="file" accept={accept} onChange={handleFile} style={{ display: 'none' }} />
        <button type="button" className="btn btn-outline btn-sm" onClick={() => inputRef.current?.click()} disabled={uploading} style={{ whiteSpace: 'nowrap' }}>
          {uploading ? <Loader size={14} className="spin" /> : <Upload size={14} />}
          {uploading ? ' Uploading...' : ' Upload'}
        </button>
        {preview && (
          <button type="button" className="btn btn-danger btn-sm" onClick={clearImage}><X size={14} /></button>
        )}
      </div>
      {preview && (
        <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
          <img src={getImageUrl(preview)} alt="preview" style={{ maxWidth: 200, maxHeight: 120, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb' }}
            onError={e => { e.target.style.display = 'none' }} />
        </div>
      )}
    </div>
  )
}

export default ImageUpload
