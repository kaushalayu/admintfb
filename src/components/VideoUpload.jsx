import { useState, useRef } from 'react'
import { Upload, X, Loader, Video } from 'lucide-react'
import api from '../api/axios'

const VideoUpload = ({ value, onChange, label = 'Video' }) => {
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
      const { data } = await api.post('/admin/media/upload', fd)
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

  const clearVideo = () => {
    setPreview('')
    onChange('')
  }

  const getVideoUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http') || url.startsWith('data:')) return url
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
    return `${baseUrl}${url}`
  }

  const isYouTube = (url) => /(youtube\.com|youtu\.be)/.test(url)

  return (
    <div className="image-upload-wrapper">
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14, color: 'var(--text)' }}>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="form-control" placeholder="Paste video URL or upload" value={preview} onChange={handleUrlChange} style={{ flex: 1, minWidth: 200 }} />
        <input ref={inputRef} type="file" accept="video/*" onChange={handleFile} style={{ display: 'none' }} />
        <button type="button" className="btn btn-outline btn-sm" onClick={() => inputRef.current?.click()} disabled={uploading} style={{ whiteSpace: 'nowrap' }}>
          {uploading ? <Loader size={14} className="spin" /> : <Upload size={14} />}
          {uploading ? ' Uploading...' : ' Upload'}
        </button>
        {preview && (
          <button type="button" className="btn btn-danger btn-sm" onClick={clearVideo}><X size={14} /></button>
        )}
      </div>
      {preview && !isYouTube(preview) && (
        <div style={{ marginTop: 8, position: 'relative', display: 'inline-block', maxWidth: 320 }}>
          <video controls style={{ width: '100%', maxHeight: 180, borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <source src={getVideoUrl(preview)} />
          </video>
        </div>
      )}
      {preview && isYouTube(preview) && (
        <div style={{ marginTop: 8, color: '#888', fontSize: 13 }}>
          <Video size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          YouTube link set
        </div>
      )}
    </div>
  )
}

export default VideoUpload
