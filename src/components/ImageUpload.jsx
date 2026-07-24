import { useState, useRef } from 'react'
import { Upload, X, Loader, Tag } from 'lucide-react'
import api from '../api/axios'

/**
 * ImageUpload — uploads image and lets you set SEO-friendly alt text / filename.
 *
 * Props:
 *  value    — current image URL string
 *  onChange — called with (url, altText) when either changes
 *  altValue — current alt text string
 *  onAltChange — called with new alt text string (optional, if you want separate handler)
 *  label    — label shown above
 *  accept   — file accept string
 */
const ImageUpload = ({
  value,
  onChange,
  altValue = '',
  onAltChange,
  label = 'Image',
  accept = 'image/*',
}) => {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || '')
  const [altText, setAltText] = useState(altValue || '')
  const [showAlt, setShowAlt] = useState(!!(value && altValue))
  const inputRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Auto-suggest alt text from filename (SEO friendly)
    const suggestedAlt = file.name
      .replace(/\.[^.]+$/, '')           // remove extension
      .replace(/[-_]+/g, ' ')            // dashes/underscores → spaces
      .replace(/\b\w/g, c => c.toUpperCase()) // Title Case

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/admin/media/upload', fd)
      const url = data.data.url
      setPreview(url)
      // Only pre-fill alt if user hasn't typed one yet
      if (!altText) {
        setAltText(suggestedAlt)
        onAltChange?.(suggestedAlt)
      }
      setShowAlt(true)
      onChange(url, altText || suggestedAlt)
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
    if (v) setShowAlt(true)
    onChange(v, altText)
  }

  const handleAltChange = (e) => {
    const v = e.target.value
    setAltText(v)
    onAltChange?.(v)
    onChange(preview, v)
  }

  const clearImage = () => {
    setPreview('')
    setAltText('')
    setShowAlt(false)
    onChange('', '')
    onAltChange?.('')
  }

  const getImageSrc = (url) => {
    if (!url) return ''
    if (url.startsWith('http') || url.startsWith('data:')) return url
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
    return `${baseUrl}${url}`
  }

  return (
    <div className="image-upload-wrapper">
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14, color: 'var(--text)' }}>
        {label}
      </label>

      {/* URL input + upload button row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="form-control"
          placeholder="Paste image URL or upload file"
          value={preview}
          onChange={handleUrlChange}
          style={{ flex: 1, minWidth: 200 }}
        />
        <input ref={inputRef} type="file" accept={accept} onChange={handleFile} style={{ display: 'none' }} />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ whiteSpace: 'nowrap' }}
        >
          {uploading ? <Loader size={14} className="spin" /> : <Upload size={14} />}
          {uploading ? ' Uploading...' : ' Upload'}
        </button>
        {preview && (
          <button type="button" className="btn btn-danger btn-sm" onClick={clearImage} title="Remove image">
            <X size={14} />
          </button>
        )}
      </div>

      {/* ALT TEXT — shown after upload or URL paste */}
      {showAlt && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Tag size={12} color="var(--primary)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Image Alt Text <span style={{ color: 'var(--primary)', fontWeight: 400 }}>(SEO)</span>
            </span>
          </div>
          <input
            className="form-control"
            placeholder='e.g. "Teak Wood King Size Bed - The Furniture Boutique"'
            value={altText}
            onChange={handleAltChange}
            style={{ fontSize: 13 }}
          />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
            Describe the image for search engines. Include product name &amp; keywords.
          </p>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
          <img
            src={getImageSrc(preview)}
            alt={altText || 'preview'}
            style={{ maxWidth: 200, maxHeight: 120, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb' }}
            onError={e => { e.target.style.display = 'none' }}
          />
          {altText && (
            <div style={{
              position: 'absolute', bottom: 4, left: 4, right: 4,
              background: 'rgba(0,0,0,0.65)', color: '#fff',
              fontSize: 10, borderRadius: 4, padding: '2px 6px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {altText}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageUpload
