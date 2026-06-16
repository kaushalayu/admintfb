import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import Swal from 'sweetalert2'
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
import ImageUpload from '../components/ImageUpload'

const ProductForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({
    title: '', slug: '', sku: '', description: '', category: '', brand: '',
    price: '', salePrice: '', currency: '₹', inStock: true, stockQuantity: 0,
    featured: false, tags: [], colors: [], sizes: [], specifications: [],
    additionalInfo: '', customContent: '',
    images: [{ url: '', alt: '', isPrimary: true }],
  })
  const [categories, setCategories] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [specKey, setSpecKey] = useState('')
  const [specValue, setSpecValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/categories').then(res => setCategories(res.data.data || [])).catch(() => {})
    if (isEdit) {
      // We need to fetch by ID using a different approach since API uses slug
      api.get('/admin/products?limit=50').then(res => {
        const found = res.data.data.find(p => p._id === id)
        if (found) setForm({
          title: found.title || '',
          slug: found.slug || '',
          sku: found.sku || '',
          description: found.description || '',
          category: found.category?._id || found.category || '',
          brand: found.brand || '',
          price: found.price || '',
          salePrice: found.salePrice || '',
          currency: found.currency || '₹',
          inStock: found.inStock ?? true,
          stockQuantity: found.stockQuantity || 0,
          featured: found.featured || false,
          tags: found.tags || [],
          colors: found.colors || [],
          sizes: found.sizes || [],
          specifications: found.specifications || [],
          additionalInfo: found.additionalInfo || '',
          customContent: found.customContent || '',
          images: found.images?.length > 0 ? found.images : [{ url: '', alt: '', isPrimary: true }],
        })
      }).catch(() => {})
    }
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
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

  const addColor = () => {
    setForm(prev => ({ ...prev, colors: [...prev.colors, { name: '', hex: '#000000' }] }))
  }

  const updateColor = (index, field, value) => {
    const updated = [...form.colors]
    updated[index] = { ...updated[index], [field]: value }
    setForm(prev => ({ ...prev, colors: updated }))
  }

  const removeColor = (index) => {
    setForm(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== index) }))
  }

  const addSize = () => {
    setForm(prev => ({ ...prev, sizes: [...prev.sizes, ''] }))
  }

  const updateSize = (index, value) => {
    const updated = [...form.sizes]
    updated[index] = value
    setForm(prev => ({ ...prev, sizes: updated }))
  }

  const removeSize = (index) => {
    setForm(prev => ({ ...prev, sizes: prev.sizes.filter((_, i) => i !== index) }))
  }

  const addSpec = () => {
    if (specKey.trim() && specValue.trim()) {
      setForm(prev => ({ ...prev, specifications: [...prev.specifications, { key: specKey.trim(), value: specValue.trim() }] }))
      setSpecKey('')
      setSpecValue('')
    }
  }

  const removeSpec = (index) => {
    setForm(prev => ({ ...prev, specifications: prev.specifications.filter((_, i) => i !== index) }))
  }

  const updateImage = (index, field, value) => {
    const updated = [...form.images]
    updated[index] = { ...updated[index], [field]: value }
    setForm(prev => ({ ...prev, images: updated }))
  }

  const addImage = () => {
    setForm(prev => ({ ...prev, images: [...prev.images, { url: '', alt: '', isPrimary: false }] }))
  }

  const removeImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const setPrimaryImage = (index) => {
    const updated = form.images.map((img, i) => ({ ...img, isPrimary: i === index }))
    setForm(prev => ({ ...prev, images: updated }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : undefined,
        stockQuantity: Number(form.stockQuantity),
        images: form.images.filter(img => img.url),
        colors: form.colors.filter(c => c.name),
        sizes: form.sizes.filter(s => s),
      }

      if (isEdit) {
        await api.put(`/admin/products/${id}`, payload)
      } else {
        await api.post('/admin/products', payload)
      }
      navigate('/products')
      Toast.fire({ icon: 'success', title: isEdit ? 'Product updated' : 'Product created' })
    } catch (err) {
      Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Failed to save product' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>{isEdit ? 'Edit Product' : 'Add New Product'}</h3>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Title *</label>
            <input className="form-control" name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Slug</label>
            <input className="form-control" name="slug" value={form.slug} onChange={handleChange} placeholder="Auto-generated" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>SKU</label>
            <input className="form-control" name="sku" value={form.sku} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <select className="form-control" name="category" value={form.category} onChange={handleChange} required>
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Brand</label>
            <input className="form-control" name="brand" value={form.brand} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Currency</label>
            <input className="form-control" name="currency" value={form.currency} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Price *</label>
            <input className="form-control" name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Sale Price</label>
            <input className="form-control" name="salePrice" type="number" step="0.01" value={form.salePrice} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Stock Quantity</label>
            <input className="form-control" name="stockQuantity" type="number" value={form.stockQuantity} onChange={handleChange} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10, gap: 20 }}>
            <label style={{ marginBottom: 0 }}>
              <input type="checkbox" name="inStock" checked={form.inStock} onChange={handleChange} /> In Stock
            </label>
            <label>
              <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} /> Featured
            </label>
          </div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea className="form-control" name="description" value={form.description} onChange={handleChange} rows={4} />
        </div>

        <div className="form-group">
          <label>Additional Info</label>
          <textarea className="form-control" name="additionalInfo" value={form.additionalInfo} onChange={handleChange} rows={3} placeholder="Additional product information..." />
        </div>
        <div className="form-group">
          <label>Custom Content</label>
          <textarea className="form-control" name="customContent" value={form.customContent} onChange={handleChange} rows={3} placeholder="Custom content for product page..." />
        </div>

        {/* Tags */}
        <div className="form-group">
          <label>Tags (press Enter to add)</label>
          <div className="tags-input">
            {form.tags.map((tag, i) => (
              <span key={i} className="tag">{tag} <button type="button" onClick={() => removeTag(tag)}>&times;</button></span>
            ))}
            <input placeholder="Add tag..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} />
          </div>
        </div>

        {/* Colors */}
        <div className="form-group">
          <label>Colors</label>
          {form.colors.map((color, i) => (
            <div key={i} className="color-input-group">
              <input type="color" value={color.hex} onChange={e => updateColor(i, 'hex', e.target.value)} />
              <input className="form-control" placeholder="Color name" value={color.name} onChange={e => updateColor(i, 'name', e.target.value)} style={{ flex: 1 }} />
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeColor(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={addColor}>+ Add Color</button>
        </div>

        {/* Sizes */}
        <div className="form-group">
          <label>Sizes</label>
          {form.sizes.map((size, i) => (
            <div key={i} className="color-input-group">
              <input className="form-control" placeholder="Size" value={size} onChange={e => updateSize(i, e.target.value)} />
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeSize(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={addSize}>+ Add Size</button>
        </div>

        {/* Specifications */}
        <div className="form-group">
          <label>Specifications</label>
          {form.specifications.map((spec, i) => (
            <div key={i} className="color-input-group">
              <span><strong>{spec.key}:</strong> {spec.value}</span>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeSpec(i)}>✕</button>
            </div>
          ))}
          <div className="color-input-group">
            <input className="form-control" placeholder="Key" value={specKey} onChange={e => setSpecKey(e.target.value)} />
            <input className="form-control" placeholder="Value" value={specValue} onChange={e => setSpecValue(e.target.value)} />
            <button type="button" className="btn btn-primary btn-sm" onClick={addSpec}>+</button>
          </div>
        </div>

        {/* Images */}
        <div className="form-group">
          <label>Images</label>
          {form.images.map((img, i) => (
            <div key={i} className="color-input-group" style={{ flexWrap: 'wrap' }}>
              <ImageUpload value={img.url} onChange={(val) => updateImage(i, 'url', val)} label="" accept="image/*" />
              <input className="form-control" placeholder="Alt text" value={img.alt} onChange={e => updateImage(i, 'alt', e.target.value)} style={{ flex: 1, minWidth: 150 }} />
              <button type="button" className={`btn btn-sm ${img.isPrimary ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPrimaryImage(i)}>
                {img.isPrimary ? '★ Primary' : '☆ Set Primary'}
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeImage(i)}>✕</button>
              {img.url && <img src={img.url} alt="" className="image-preview" onError={e => { e.target.style.display = 'none' }} />}
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={addImage}>+ Add Image</button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/products')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default ProductForm
