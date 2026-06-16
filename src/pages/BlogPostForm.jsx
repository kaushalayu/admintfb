import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Search, Eye, EyeOff, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import api from '../api/axios'
import RichEditor from '../components/RichEditor'
import Swal from 'sweetalert2'
import ImageUpload from '../components/ImageUpload'

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const BlogPostForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({
    title: '', slug: '', content: '', excerpt: '', featuredImage: '',
    author: 'Admin', category: '', tags: [], published: true,
    publishedAt: new Date().toISOString().slice(0, 16),
    metaTitle: '', metaDescription: '', metaKeywords: '',
    canonicalUrl: '', ogImage: '', ogTitle: '', ogDescription: '',
    schemaMarkup: '', isIndexed: true, isFeatured: false,
  })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSeo, setShowSeo] = useState(false)
  const [charCount, setCharCount] = useState({ metaTitle: 0, metaDescription: 0 })

  useEffect(() => {
    setCharCount({
      metaTitle: form.metaTitle?.length || 0,
      metaDescription: form.metaDescription?.length || 0,
    })
  }, [form.metaTitle, form.metaDescription])

  useEffect(() => {
    if (isEdit) {
      api.get(`/admin/blog?limit=50`).then(res => {
        const found = res.data.data.find(p => p._id === id)
        if (found) {
          setForm({
            title: found.title || '',
            slug: found.slug || '',
            content: found.content || '',
            excerpt: found.excerpt || '',
            featuredImage: found.featuredImage || '',
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
            ogTitle: found.ogTitle || '',
            ogDescription: found.ogDescription || '',
            schemaMarkup: found.schemaMarkup || '',
            isIndexed: found.isIndexed ?? true,
            isFeatured: found.isFeatured ?? false,
          })
        }
      }).catch(() => {})
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
    if (form.metaTitle && form.metaTitle.length >= 30) score += 20
    if (form.metaDescription && form.metaDescription.length >= 50) score += 20
    if (form.metaKeywords) score += 10
    if (form.ogImage) score += 10
    if (form.ogTitle) score += 10
    if (form.ogDescription) score += 10
    if (form.canonicalUrl) score += 10
    if (form.slug) score += 5
    if (form.excerpt) score += 5
    return score
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3><FileText size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />{isEdit ? 'Edit Post' : 'New Blog Post'}</h3>
      </div>
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
          <ImageUpload value={form.featuredImage} onChange={(val) => setForm(prev => ({...prev, featuredImage: val}))} label="Featured Image" />
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
                  <input className={`form-control ${charCount.metaTitle > 70 ? 'is-invalid' : ''}`}
                    name="metaTitle" value={form.metaTitle} onChange={handleChange}
                    placeholder="SEO title (recommended: 50-60 chars)" maxLength={70} />
                  <div className={`seo-counter ${charCount.metaTitle > 60 ? 'warn' : ''} ${charCount.metaTitle > 70 ? 'over' : ''}`}>
                    {charCount.metaTitle}/70 · {charCount.metaTitle > 70 ? 'Too long!' : charCount.metaTitle >= 50 ? 'Good' : 'Too short'}
                  </div>
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
                <textarea className={`form-control ${charCount.metaDescription > 160 ? 'is-invalid' : ''}`}
                  name="metaDescription" value={form.metaDescription} onChange={handleChange} rows={2}
                  placeholder="Brief description for search results (recommended: 120-160 chars)" maxLength={160} />
                <div className={`seo-counter ${charCount.metaDescription > 160 ? 'over' : charCount.metaDescription >= 120 ? 'warn' : ''}`}>
                  {charCount.metaDescription}/160 · {charCount.metaDescription > 160 ? 'Too long!' : charCount.metaDescription >= 120 ? 'Good length' : 'Consider adding more'}
                </div>
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
                  <input className="form-control" name="ogTitle" value={form.ogTitle} onChange={handleChange} placeholder="Title for social share" maxLength={70} />
                </div>
                <div className="form-group">
                  <ImageUpload value={form.ogImage} onChange={(val) => setForm(prev => ({...prev, ogImage: val}))} label="OG Image" />
                </div>
              </div>

              <div className="form-group">
                <label>OG Description</label>
                <textarea className="form-control" name="ogDescription" value={form.ogDescription} onChange={handleChange} rows={2} placeholder="Description for social sharing" maxLength={200} />
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
                  <div className="gp-url">{form.canonicalUrl ? new URL(form.canonicalUrl).hostname + new URL(form.canonicalUrl).pathname : 'yourdomain.com'}/{form.slug || 'post-slug'}</div>
                  <div className="gp-title">{(form.metaTitle || form.title || 'Post Title').slice(0, 60)}</div>
                  <div className="gp-desc">{(form.metaDescription || form.excerpt || 'No description provided').slice(0, 160)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : (isEdit ? 'Update Post' : 'Create Post')}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/blog')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default BlogPostForm
