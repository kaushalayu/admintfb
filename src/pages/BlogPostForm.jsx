import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Search, Eye, EyeOff, ChevronDown, ChevronUp, FileText, Save, Clock } from 'lucide-react'
import api from '../api/axios'
import RichEditor from '../components/RichEditor'
import Swal from 'sweetalert2'
import ImageUpload from '../components/ImageUpload'

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

// localStorage key — new post aur edit post ke liye alag key
const getDraftKey = (id) => id ? `blog_draft_edit_${id}` : 'blog_draft_new'

const DEFAULT_FORM = {
  title: '', slug: '', content: '', excerpt: '', featuredImage: '', featuredImageAlt: '',
  featuredImageTitle: '', featuredImageCaption: '', featuredImageDescription: '',
  author: 'Admin', category: '', tags: [], published: true,
  publishedAt: new Date().toISOString().slice(0, 16),
  metaTitle: '', metaDescription: '', metaKeywords: '',
  canonicalUrl: '', ogImage: '', ogImageAlt: '', ogTitle: '', ogDescription: '',
  schemaMarkup: '', isIndexed: true, isFeatured: false,
}

const BlogPostForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const DRAFT_KEY = getDraftKey(id)

  const [form, setForm] = useState(DEFAULT_FORM)
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [showSeo, setShowSeo] = useState(false)

  // Auto-draft states
  const [hasDraft, setHasDraft] = useState(false)
  const [showDraftBanner, setShowDraftBanner] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState('') // 'saving' | 'saved' | ''
  const autoSaveTimerRef = useRef(null)
  const formRef = useRef(form)

  // formRef ko hamesha latest form ke saath sync rakho
  useEffect(() => {
    formRef.current = form
  }, [form])

  // ─── Draft localStorage mein save karo ───
  const saveDraftToLocal = useCallback((data) => {
    try {
      const draft = {
        ...data,
        _draftSavedAt: new Date().toISOString(),
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setDraftSavedAt(new Date())
      return true
    } catch {
      return false
    }
  }, [DRAFT_KEY])

  // ─── Draft localStorage se load karo ───
  const loadDraftFromLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  }, [DRAFT_KEY])

  // ─── Draft clear karo ───
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
    setHasDraft(false)
    setShowDraftBanner(false)
    setDraftSavedAt(null)
  }, [DRAFT_KEY])

  // ─── Auto-save: form change hone ke 3 sec baad ───
  useEffect(() => {
    // Sirf tab auto-save karo jab title ya content kuch ho
    if (!form.title && !form.content) return

    setAutoSaveStatus('saving')

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

    autoSaveTimerRef.current = setTimeout(() => {
      saveDraftToLocal(form)
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus(''), 2000)
    }, 3000)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [form, saveDraftToLocal])

  // ─── Page close/refresh pe save karo (beforeunload) ───
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const current = formRef.current
      if (current.title || current.content) {
        saveDraftToLocal(current)
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveDraftToLocal])

  // ─── Page load pe draft check karo ───
  useEffect(() => {
    if (isEdit) return // Edit mode mein draft restore nahi karenge
    const draft = loadDraftFromLocal()
    if (draft && draft.title) {
      setHasDraft(true)
      setShowDraftBanner(true)
    }
  }, [isEdit, loadDraftFromLocal])

  // ─── Draft restore karo ───
  const restoreDraft = () => {
    const draft = loadDraftFromLocal()
    if (!draft) return
    const { _draftSavedAt, ...formData } = draft
    setForm({ ...DEFAULT_FORM, ...formData })
    setDraftSavedAt(new Date(_draftSavedAt))
    setShowDraftBanner(false)
    Toast.fire({ icon: 'info', title: 'Draft restored successfully!' })
  }

  // ─── Manual draft save (server pe — published: false) ───
  const handleSaveDraft = async () => {
    if (!form.title.trim()) {
      Toast.fire({ icon: 'warning', title: 'Please add a title before saving draft' })
      return
    }
    setSavingDraft(true)
    try {
      const payload = {
        ...form,
        published: false, // Draft = unpublished
        publishedAt: null,
      }
      if (isEdit) {
        await api.put(`/admin/blog/${id}`, payload)
      } else {
        await api.post('/admin/blog', payload)
      }
      clearDraft() // Server pe save ho gaya, local draft clear karo
      Toast.fire({ icon: 'success', title: '✓ Draft saved to server!' })
      if (!isEdit) navigate('/blog')
    } catch (err) {
      // Server fail ho to local mein save karo
      saveDraftToLocal(form)
      Toast.fire({ icon: 'warning', title: 'Server save failed — draft saved locally' })
    } finally {
      setSavingDraft(false)
    }
  }

  // ─── Edit mode: existing post load karo ───
  useEffect(() => {
    if (isEdit) {
      api.get(`/admin/blog/${id}`).then(res => {
        const found = res.data.data
        if (found) {
          setForm({
            title: found.title || '',
            slug: found.slug || '',
            content: found.content || '',
            excerpt: found.excerpt || '',
            featuredImage: found.featuredImage || '',
            featuredImageAlt: found.featuredImageAlt || '',
            featuredImageTitle: found.featuredImageTitle || '',
            featuredImageCaption: found.featuredImageCaption || '',
            featuredImageDescription: found.featuredImageDescription || '',
            author: found.author || 'Admin',
            category: found.category || '',
            tags: found.tags || [],
            published: found.published ?? true,
            publishedAt: found.publishedAt ? new Date(found.publishedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
            metaTitle: found.metaTitle || '',
            metaDescription: found.metaDescription || '',
            metaKeywords: found.metaKeywords || '',
            canonicalUrl: found.canonicalUrl || '',
            ogImage: found.ogImage || '',
            ogImageAlt: found.ogImageAlt || '',
            ogTitle: found.ogTitle || '',
            ogDescription: found.ogDescription || '',
            schemaMarkup: found.schemaMarkup || '',
            isIndexed: found.isIndexed ?? true,
            isFeatured: found.isFeatured ?? false,
          })
        }
      }).catch(() => {}).finally(() => setLoading(false))
    }
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const autoFillSeo = () => {
    setForm(prev => ({
      ...prev,
      metaTitle: prev.metaTitle || (prev.title ? prev.title.slice(0, 60) : ''),
      metaDescription: prev.metaDescription || (prev.excerpt ? prev.excerpt.slice(0, 160) : ''),
      ogTitle: prev.ogTitle || (prev.title ? prev.title.slice(0, 60) : ''),
      ogDescription: prev.ogDescription || (prev.excerpt ? prev.excerpt.slice(0, 200) : ''),
      ogImage: prev.ogImage || prev.featuredImage || '',
    }))
  }

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!form.tags.includes(tagInput.trim())) {
        setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      }
      setTagInput('')
    }
  }

  const removeTag = (tag) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  // ─── Publish / Update submit ───
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        publishedAt: form.published ? new Date(form.publishedAt).toISOString() : null,
      }
      if (isEdit) {
        await api.put(`/admin/blog/${id}`, payload)
      } else {
        await api.post('/admin/blog', payload)
      }
      clearDraft() // Publish ho gaya — draft delete karo
      Toast.fire({ icon: 'success', title: isEdit ? 'Post updated!' : 'Post created!' })
      navigate('/blog')
    } catch (err) {
      Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Failed to save post' })
    } finally {
      setSaving(false)
    }
  }

  const seoScore = () => {
    let score = 0
    if (form.metaTitle && form.metaTitle.length >= 30) score += 15
    if (form.metaDescription && form.metaDescription.length >= 50) score += 15
    if (form.metaKeywords) score += 10
    if (form.ogImage) score += 10
    if (form.ogTitle) score += 5
    if (form.ogDescription) score += 5
    if (form.canonicalUrl) score += 10
    if (form.slug) score += 5
    if (form.excerpt) score += 5
    // Image SEO fields
    if (form.featuredImageAlt) score += 10
    if (form.featuredImageTitle) score += 5
    if (form.featuredImageCaption) score += 5
    if (form.ogImageAlt) score += 5
    return Math.min(score, 100)
  }

  const formatDraftTime = (date) => {
    if (!date) return ''
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <FileText size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          {isEdit ? 'Edit Post' : 'New Blog Post'}
        </h3>

        {/* Auto-save status indicator */}
        {autoSaveStatus && (
          <span style={{
            fontSize: 12, color: autoSaveStatus === 'saved' ? '#10b981' : '#6b7280',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {autoSaveStatus === 'saving' ? (
              <><Clock size={13} /> Auto-saving...</>
            ) : (
              <><Save size={13} /> Draft auto-saved locally</>
            )}
          </span>
        )}

        {/* Last saved time */}
        {draftSavedAt && autoSaveStatus === '' && (
          <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> Last saved at {formatDraftTime(draftSavedAt)}
          </span>
        )}
      </div>

      {/* ─── Draft Restore Banner ─── */}
      {showDraftBanner && hasDraft && (
        <div style={{
          margin: '0 0 0 0',
          padding: '12px 20px',
          background: '#fffbeb',
          borderBottom: '1px solid #fcd34d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={16} color="#d97706" />
            <span style={{ fontSize: 14, color: '#92400e', fontWeight: 500 }}>
              You have an unsaved draft from your last session.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={restoreDraft}
              style={{ fontSize: 13 }}
            >
              Restore Draft
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => { clearDraft(); setShowDraftBanner(false) }}
              style={{ fontSize: 13 }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 32 }}><h3>Loading...</h3></div>
      ) : (
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Title *</label>
            <input className="form-control" name="title" value={form.title} onChange={e => {
              handleChange(e)
              if (!isEdit) setForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))
            }} required />
          </div>
          <div className="form-group">
            <label>Slug</label>
            <input className="form-control" name="slug" value={form.slug} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Author</label>
            <input className="form-control" name="author" value={form.author} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input className="form-control" name="category" value={form.category} onChange={handleChange} placeholder="e.g., Technology, Design" />
          </div>
        </div>
        <div className="form-group">
          <label>Excerpt</label>
          <textarea className="form-control" name="excerpt" value={form.excerpt} onChange={handleChange} rows={3} placeholder="Short summary for blog listing..." />
        </div>
        <div className="form-group">
          <ImageUpload
            value={form.featuredImage}
            altValue={form.featuredImageAlt}
            titleValue={form.featuredImageTitle}
            captionValue={form.featuredImageCaption}
            descriptionValue={form.featuredImageDescription}
            onChange={(url, alt) => setForm(prev => ({ ...prev, featuredImage: url, featuredImageAlt: alt || prev.featuredImageAlt }))}
            onAltChange={(alt) => setForm(prev => ({ ...prev, featuredImageAlt: alt }))}
            onTitleChange={(title) => setForm(prev => ({ ...prev, featuredImageTitle: title }))}
            onCaptionChange={(caption) => setForm(prev => ({ ...prev, featuredImageCaption: caption }))}
            onDescriptionChange={(desc) => setForm(prev => ({ ...prev, featuredImageDescription: desc }))}
            label="Featured Image"
            showExtendedMeta={true}
          />
        </div>
        <div className="form-group">
          <label>Content *</label>
          <RichEditor value={form.content} onChange={(html) => setForm(prev => ({ ...prev, content: html }))} placeholder="Write your blog post..." />
        </div>
        <div className="form-group">
          <label>Tags (press Enter to add)</label>
          <div className="tags-input">
            {form.tags.map((tag, i) => (
              <span key={i} className="tag">{tag} <button type="button" onClick={() => removeTag(tag)}>&times;</button></span>
            ))}
            <input placeholder="Add tag..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Publish Date</label>
            <input className="form-control" name="publishedAt" type="datetime-local" value={form.publishedAt} onChange={handleChange} />
          </div>
          <div className="form-group" style={{ display: 'flex', gap: 16, alignItems: 'flex-end', paddingBottom: 10 }}>
            <label className="checkbox-label">
              <input type="checkbox" name="published" checked={form.published} onChange={handleChange} /> Published
            </label>
            <label className="checkbox-label">
              <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} /> Featured
            </label>
          </div>
        </div>

        <div className="seo-accordion">
          <button type="button" className="seo-accordion-header" onClick={() => setShowSeo(!showSeo)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Search size={18} />
              <span>SEO Settings</span>
              <span className={`seo-badge seo-badge-${seoScore() >= 70 ? 'good' : seoScore() >= 40 ? 'avg' : 'poor'}`}>
                SEO Score: {seoScore()}%
              </span>
            </div>
            {showSeo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showSeo && (
            <div className="seo-accordion-body">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={autoFillSeo}>
                  <Eye size={14} style={{ marginRight: 4 }} /> Auto-fill from Content
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Meta Title</label>
                  <input className="form-control"
                    name="metaTitle" value={form.metaTitle} onChange={handleChange}
                    placeholder="SEO title (recommended: 50-60 chars)" />
                </div>
                <div className="form-group">
                  <label>Indexing</label>
                  <label className="checkbox-label" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" name="isIndexed" checked={form.isIndexed} onChange={handleChange} />
                    <span style={{ fontSize: 14 }}>Allow search engines to index {form.isIndexed ? <Eye size={14} style={{ verticalAlign: 'middle', color: '#10b981' }} /> : <EyeOff size={14} style={{ verticalAlign: 'middle', color: '#ef4444' }} />}</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Meta Description</label>
                <textarea className="form-control"
                  name="metaDescription" value={form.metaDescription} onChange={handleChange} rows={2}
                  placeholder="Brief description for search results (recommended: 120-160 chars)" />
              </div>

              <div className="form-group">
                <label>Meta Keywords</label>
                <input className="form-control" name="metaKeywords" value={form.metaKeywords} onChange={handleChange} placeholder="furniture, home decor, interior design (comma separated)" />
              </div>

              <div className="form-group">
                <label>Canonical URL</label>
                <input className="form-control" name="canonicalUrl" value={form.canonicalUrl} onChange={handleChange} placeholder="https://yourdomain.com/blog/this-post" />
              </div>

              <h4 style={{ margin: '16px 0 8px', fontSize: 14, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                Open Graph (Social Sharing)
              </h4>

              <div className="form-row">
                <div className="form-group">
                  <label>OG Title</label>
                  <input className="form-control" name="ogTitle" value={form.ogTitle} onChange={handleChange} placeholder="Title for social share" />
                </div>
                <div className="form-group">
                  <ImageUpload
                    value={form.ogImage}
                    altValue={form.ogImageAlt}
                    onChange={(url, alt) => setForm(prev => ({ ...prev, ogImage: url, ogImageAlt: alt || prev.ogImageAlt }))}
                    onAltChange={(alt) => setForm(prev => ({ ...prev, ogImageAlt: alt }))}
                    label="OG Image"
                    showExtendedMeta={false}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>OG Description</label>
                <textarea className="form-control" name="ogDescription" value={form.ogDescription} onChange={handleChange} rows={2} placeholder="Description for social sharing" />
              </div>

              <h4 style={{ margin: '16px 0 8px', fontSize: 14, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Schema Markup (JSON-LD)
              </h4>
              <div className="form-group">
                <textarea className="form-control" name="schemaMarkup" value={form.schemaMarkup} onChange={handleChange} rows={4}
                  placeholder='{ "@context": "https://schema.org", "@type": "BlogPosting", ... }'
                  style={{ fontFamily: 'monospace', fontSize: 12 }} />
              </div>

              <div className="seo-preview">
                <h4 style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Google Search Preview</h4>
                <div className="google-preview">
                  <div className="gp-url">{(() => {
                    try {
                      if (form.canonicalUrl) {
                        const u = new URL(form.canonicalUrl)
                        return u.hostname + u.pathname
                      }
                    } catch {}
                    return 'yourdomain.com'
                  })()}/{form.slug || 'post-slug'}</div>
                  <div className="gp-title">{(form.metaTitle || form.title || 'Post Title').slice(0, 60)}</div>
                  <div className="gp-desc">{(form.metaDescription || form.excerpt || 'No description provided').slice(0, 160)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Action Buttons ─── */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Publish / Update */}
          <button type="submit" className="btn btn-primary" disabled={saving || savingDraft}>
            {saving ? 'Saving...' : (isEdit ? 'Update Post' : 'Publish Post')}
          </button>

          {/* Save as Draft */}
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleSaveDraft}
            disabled={saving || savingDraft}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Save size={15} />
            {savingDraft ? 'Saving Draft...' : 'Save as Draft'}
          </button>

          <button type="button" className="btn btn-outline" onClick={() => navigate('/blog')} disabled={saving || savingDraft}>
            Cancel
          </button>

          {/* Local draft indicator */}
          {draftSavedAt && (
            <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              Auto-saved locally at {formatDraftTime(draftSavedAt)}
              <button
                type="button"
                onClick={clearDraft}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 11, marginLeft: 4, padding: '0 2px' }}
                title="Clear local draft"
              >
                ✕ clear
              </button>
            </span>
          )}
        </div>
      </form>
      )}
    </div>
  )
}

export default BlogPostForm
