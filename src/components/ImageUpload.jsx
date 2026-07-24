import { useState, useRef } from 'react'
import { Upload, X, Loader, Tag, FileText } from 'lucide-react'
import api from '../api/axios'

/**
 * ImageUpload — uploads image with SEO-friendly filename editing.
 *
 * Props:
 *  value       — current image URL string
 *  onChange    — called with (url, altText) when either changes
 *  altValue    — current alt text string
 *  onAltChange — called with new alt text string (optional)
 *  label       — label shown above
 *  accept      — file accept string
 */

// Convert any string → seo-friendly-slug
const toSlug = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
    .trim()
    .replace(/\s+/g, '-')            // spaces → dashes
    .replace(/-+/g, '-')             // multiple dashes → one

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

  // SEO filename states
  const [pendingFile, setPendingFile] = useState(null)      // file object waiting to upload
  const [fileExt, setFileExt] = useState('')                // .jpg / .png etc
  const [seoName, setSeoName] = useState('')                // editable slug part
  const [showNameEditor, setShowNameEditor] = useState(false)

  const inputRef = useRef(null)

  // Step 1: User picks a file → show name editor, DON'T upload yet
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.includes('.') ? '.' + file.name.split('.').pop().toLowerCase() : ''
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, '')
    const autoSlug = toSlug(nameWithoutExt)

    setPendingFile(file)
    setFileExt(ext)
    setSeoName(autoSlug)
    setShowNameEditor(true)

    // reset file input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = ''
  }

  // Step 2: User clicks "Upload" after editing name
  const handleUpload = async () => {
    if (!pendingFile) return

    const finalName = toSlug(seoName) + fileExt

    // Auto-suggest alt text from the SEO name
    const suggestedAlt = seoName
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', pendingFile)
      fd.append('customFilename', finalName)   // ← send SEO name to backend

      const { data } = await api.post('/admin/media/upload', fd)
      const url = data.data.url
      setPreview(url)

      if (!altText) {
        setAltText(suggestedAlt)
        onAltChange?.(suggestedAlt)
      }
      setShowAlt(true)
      onChange(url, altText || suggestedAlt)

      // reset editor
      setPendingFile(null)
      setSeoName('')
      setFileExt('')
      setShowNameEditor(false)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload failed'
      alert(msg)
    } finally {
      setUploading(false)
    }
  }

  // Cancel name editing
  const cancelNameEdit = () => {
    setPendingFile(null)
    setSeoName('')
    setFileExt('')
    setShowNameEditor(false)
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
        <input ref={inputRef} type="file" accept={accept} onChange={handleFileSelect} style={{ display: 'none' }} />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Upload size={14} />
          {' Choose File'}
        </button>
        {preview && (
          <button type="button" className="btn btn-danger btn-sm" onClick={clearImage} title="Remove image">
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── SEO FILENAME EDITOR (shown after file pick, before upload) ── */}
      {showNameEditor && (
        <div style={{
          marginTop: 12,
          padding: '14px 16px',
          background: 'var(--surface, #f9f9fb)',
          border: '1.5px solid var(--primary, #7c3aed)',
          borderRadius: 10,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <FileText size={14} color="var(--primary, #7c3aed)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary, #7c3aed)' }}>
              SEO Filename Edit करें
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
              (Google इसे पढ़ता है)
            </span>
          </div>

          {/* Name input + extension badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              className="form-control"
              value={seoName}
              onChange={e => setSeoName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
              placeholder="best-furniture-showroom-lucknow"
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
              onKeyDown={e => { if (e.key === 'Enter') handleUpload() }}
            />
            <span style={{
              padding: '6px 10px',
              background: '#e0e7ff',
              color: '#4338ca',
              borderRadius: 6,
              fontFamily: 'monospace',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              {fileExt}
            </span>
          </div>

          {/* Final filename preview */}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 10px' }}>
            📁 Final filename: <strong style={{ color: '#333' }}>{toSlug(seoName)}{fileExt}</strong>
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleUpload}
              disabled={uploading || !seoName.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {uploading ? <Loader size={13} className="spin" /> : <Upload size={13} />}
              {uploading ? ' Uploading...' : ' Upload Now'}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={cancelNameEdit}
              disabled={uploading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
