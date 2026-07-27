import { useState, useRef } from 'react'
import { Upload, X, Loader, Tag, FileText, Info, Type, AlignLeft } from 'lucide-react'
import api from '../api/axios'

/**
 * ImageUpload — uploads image with full SEO metadata editing.
 *
 * Props:
 *  value              — current image URL string
 *  onChange           — called with (url, altText) when either changes
 *  altValue           — current alt text
 *  onAltChange        — called with new alt text (optional)
 *  titleValue         — current image title
 *  onTitleChange      — called with new title (optional)
 *  captionValue       — current image caption
 *  onCaptionChange    — called with new caption (optional)
 *  descriptionValue   — current image description
 *  onDescriptionChange— called with new description (optional)
 *  label              — label shown above
 *  accept             — file accept string
 *  showExtendedMeta   — show title/caption/description fields (default: false for OG image)
 */

const toSlug = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const ImageUpload = ({
  value,
  onChange,
  altValue = '',
  onAltChange,
  titleValue = '',
  onTitleChange,
  captionValue = '',
  onCaptionChange,
  descriptionValue = '',
  onDescriptionChange,
  label = 'Image',
  accept = 'image/*',
  showExtendedMeta = true,
}) => {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || '')
  const [altText, setAltText] = useState(altValue || '')
  const [titleText, setTitleText] = useState(titleValue || '')
  const [captionText, setCaptionText] = useState(captionValue || '')
  const [descText, setDescText] = useState(descriptionValue || '')
  const [showMeta, setShowMeta] = useState(!!(value && altValue))

  // SEO filename states
  const [pendingFile, setPendingFile] = useState(null)
  const [fileExt, setFileExt] = useState('')
  const [seoName, setSeoName] = useState('')
  const [showNameEditor, setShowNameEditor] = useState(false)

  const inputRef = useRef(null)

  // Step 1: User picks a file → show name editor
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.includes('.') ? '.' + file.name.split('.').pop().toLowerCase() : ''
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, '')
    setPendingFile(file)
    setFileExt(ext)
    setSeoName(toSlug(nameWithoutExt))
    setShowNameEditor(true)
    if (inputRef.current) inputRef.current.value = ''
  }

  // Step 2: Upload after editing name
  const handleUpload = async () => {
    if (!pendingFile) return
    const finalName = toSlug(seoName) + fileExt
    const suggestedAlt = seoName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', pendingFile)
      fd.append('customFilename', finalName)
      const { data } = await api.post('/admin/media/upload', fd)
      const url = data.data.url
      setPreview(url)

      if (!altText) {
        setAltText(suggestedAlt)
        onAltChange?.(suggestedAlt)
      }
      if (!titleText) {
        setTitleText(suggestedAlt)
        onTitleChange?.(suggestedAlt)
      }
      setShowMeta(true)
      onChange(url, altText || suggestedAlt)

      setPendingFile(null)
      setSeoName('')
      setFileExt('')
      setShowNameEditor(false)
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const cancelNameEdit = () => {
    setPendingFile(null)
    setSeoName('')
    setFileExt('')
    setShowNameEditor(false)
  }

  const handleUrlChange = (e) => {
    const v = e.target.value
    setPreview(v)
    if (v) setShowMeta(true)
    onChange(v, altText)
  }

  const handleAltChange = (e) => {
    const v = e.target.value
    setAltText(v)
    onAltChange?.(v)
    onChange(preview, v)
  }

  const handleTitleChange = (e) => {
    const v = e.target.value
    setTitleText(v)
    onTitleChange?.(v)
  }

  const handleCaptionChange = (e) => {
    const v = e.target.value
    setCaptionText(v)
    onCaptionChange?.(v)
  }

  const handleDescChange = (e) => {
    const v = e.target.value
    setDescText(v)
    onDescriptionChange?.(v)
  }

  const clearImage = () => {
    setPreview('')
    setAltText('')
    setTitleText('')
    setCaptionText('')
    setDescText('')
    setShowMeta(false)
    onChange('', '')
    onAltChange?.('')
    onTitleChange?.('')
    onCaptionChange?.('')
    onDescriptionChange?.('')
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
          <Upload size={14} /> Choose File
        </button>
        {preview && (
          <button type="button" className="btn btn-danger btn-sm" onClick={clearImage} title="Remove image">
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── SEO FILENAME EDITOR ── */}
      {showNameEditor && (
        <div style={{
          marginTop: 12, padding: '14px 16px',
          background: 'var(--surface, #f9f9fb)',
          border: '1.5px solid var(--primary, #7c3aed)',
          borderRadius: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <FileText size={14} color="var(--primary, #7c3aed)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary, #7c3aed)' }}>
              SEO Filename
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
              (Google इसे पढ़ता है)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              className="form-control"
              value={seoName}
              onChange={e => setSeoName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
              placeholder="best-furniture-lucknow"
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
              onKeyDown={e => { if (e.key === 'Enter') handleUpload() }}
            />
            <span style={{
              padding: '6px 10px', background: '#e0e7ff', color: '#4338ca',
              borderRadius: 6, fontFamily: 'monospace', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              {fileExt}
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 10px' }}>
            📁 Final: <strong style={{ color: '#333' }}>{toSlug(seoName)}{fileExt}</strong>
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button" className="btn btn-primary btn-sm"
              onClick={handleUpload}
              disabled={uploading || !seoName.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {uploading ? <Loader size={13} className="spin" /> : <Upload size={13} />}
              {uploading ? ' Uploading...' : ' Upload Now'}
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={cancelNameEdit} disabled={uploading}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── IMAGE METADATA (alt, title, caption, description) ── */}
      {showMeta && (
        <div style={{
          marginTop: 12, padding: '14px 16px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Info size={14} color="#6366f1" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>
              Image SEO Details
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>
              (Improves search ranking)
            </span>
          </div>

          {/* Alt Text */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              <Tag size={12} color="#10b981" />
              Alt Text *
              <span style={{ fontWeight: 400, color: '#9ca3af' }}>(Required for SEO & accessibility)</span>
            </label>
            <input
              className="form-control"
              placeholder='e.g. "Teak Wood King Size Bed - The Furniture Boutique"'
              value={altText}
              onChange={handleAltChange}
              style={{ fontSize: 13 }}
            />
          </div>

          {/* Title, Caption, Description — only for featured image */}
          {showExtendedMeta && (
            <>
              {/* Image Title */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  <Type size={12} color="#6366f1" />
                  Image Title
                  <span style={{ fontWeight: 400, color: '#9ca3af' }}>(Shown as tooltip on hover)</span>
                </label>
                <input
                  className="form-control"
                  placeholder='e.g. "Solid Teak Wood King Bed with Storage"'
                  value={titleText}
                  onChange={handleTitleChange}
                  style={{ fontSize: 13 }}
                />
              </div>

              {/* Caption */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  <AlignLeft size={12} color="#f59e0b" />
                  Caption
                  <span style={{ fontWeight: 400, color: '#9ca3af' }}>(Shown below image in blog post)</span>
                </label>
                <input
                  className="form-control"
                  placeholder='e.g. "Our bestselling teak wood king bed, handcrafted in Lucknow"'
                  value={captionText}
                  onChange={handleCaptionChange}
                  style={{ fontSize: 13 }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  <FileText size={12} color="#8b5cf6" />
                  Description
                  <span style={{ fontWeight: 400, color: '#9ca3af' }}>(For image search & media library)</span>
                </label>
                <textarea
                  className="form-control"
                  placeholder='Brief description of the image for media library and structured data...'
                  value={descText}
                  onChange={handleDescChange}
                  rows={2}
                  style={{ fontSize: 13 }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
          <img
            src={getImageSrc(preview)}
            alt={altText || 'preview'}
            title={titleText || undefined}
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
              alt: {altText}
            </div>
          )}
          {captionText && (
            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4, marginBottom: 0, fontStyle: 'italic' }}>
              📝 {captionText}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageUpload
