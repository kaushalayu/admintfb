import { useState, useEffect } from 'react'
import api from '../api/axios'
import Swal from 'sweetalert2'
import ImageUpload from '../components/ImageUpload'

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const Settings = () => {
  const [form, setForm] = useState({
    siteName: 'The Furniture Boutique', siteLogo: '', favicon: '',
    address: '', email: '', phone: '',
    facebook: '', twitter: '', instagram: '', youtube: '', skype: '', whatsapp: '',
    flatShipping: 50, freeShippingThreshold: 500, currencySymbol: '₹', taxRate: 0,
    dealEndDate: '', dealTitle: '', dealDesc: '', dealImage: '',
    bannerVideoUrl: '', instagramPosts: [],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/settings')
      .then(res => {
        if (res.data.data) setForm(prev => ({ ...prev, ...res.data.data }))
      })
      .catch(err => console.error(err))
  }, [])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/admin/settings', form)
      Toast.fire({ icon: 'success', title: 'Settings saved!' })
    } catch (err) {
      Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Save failed' })
    } finally { setSaving(false) }
  }

  return (
    <div className="card">
      <div className="card-header"><h3>Site Settings</h3></div>
      <form onSubmit={handleSubmit}>
        <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>General</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Site Name</label>
            <input className="form-control" name="siteName" value={form.siteName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Currency Symbol</label>
            <input className="form-control" name="currencySymbol" value={form.currencySymbol} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <ImageUpload value={form.siteLogo} onChange={(val) => setForm(prev => ({...prev, siteLogo: val}))} label="Logo" />
          </div>
          <div className="form-group">
            <ImageUpload value={form.favicon} onChange={(val) => setForm(prev => ({...prev, favicon: val}))} label="Favicon" accept="image/x-icon,image/png,image/svg+xml" />
          </div>
        </div>

        <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>Contact Info</h4>
        <div className="form-group">
          <label>Address</label>
          <input className="form-control" name="address" value={form.address} onChange={handleChange} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" name="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input className="form-control" name="phone" value={form.phone} onChange={handleChange} />
          </div>
        </div>

        <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>Social Media</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Facebook</label>
            <input className="form-control" name="facebook" value={form.facebook} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Twitter</label>
            <input className="form-control" name="twitter" value={form.twitter} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Instagram</label>
            <input className="form-control" name="instagram" value={form.instagram} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>YouTube</label>
            <input className="form-control" name="youtube" value={form.youtube} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Skype</label>
            <input className="form-control" name="skype" value={form.skype} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>WhatsApp Number</label>
            <input className="form-control" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="+91..." />
          </div>
        </div>

        <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>Shipping & Tax</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Flat Shipping Rate (₹)</label>
            <input className="form-control" name="flatShipping" type="number" value={form.flatShipping} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Free Shipping Threshold (₹)</label>
            <input className="form-control" name="freeShippingThreshold" type="number" value={form.freeShippingThreshold} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Tax Rate (%)</label>
            <input className="form-control" name="taxRate" type="number" step="0.1" value={form.taxRate} onChange={handleChange} />
          </div>
          <div className="form-group" />
        </div>

        <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>Deal of the Week</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Deal End Date</label>
            <input className="form-control" name="dealEndDate" type="datetime-local" value={form.dealEndDate ? new Date(form.dealEndDate).toISOString().slice(0, 16) : ''} onChange={(e) => setForm(prev => ({...prev, dealEndDate: e.target.value ? new Date(e.target.value).toISOString() : ''}))} />
          </div>
          <div className="form-group">
            <label>Deal Title</label>
            <input className="form-control" name="dealTitle" value={form.dealTitle} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label>Deal Description</label>
          <textarea className="form-control" name="dealDesc" rows="2" value={form.dealDesc} onChange={handleChange} />
        </div>
        <div className="form-group">
          <ImageUpload value={form.dealImage} onChange={(val) => setForm(prev => ({...prev, dealImage: val}))} label="Deal Image" />
        </div>

        <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>Video Banner</h4>
        <div className="form-group">
          <label>Banner Video URL</label>
          <input className="form-control" name="bannerVideoUrl" value={form.bannerVideoUrl} onChange={handleChange} placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4" />
          <small style={{ color: '#888', fontSize: 12 }}>YouTube, Vimeo link or direct MP4 URL</small>
        </div>

        <h4 style={{ margin: '16px 0 8px', color: 'var(--primary)' }}>Instagram Posts</h4>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Add up to 6 Instagram post images with links.</p>
        {form.instagramPosts.map((post, i) => (
          <div key={i} className="form-row" style={{ alignItems: 'center', marginBottom: 8 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Image URL</label>
              <input className="form-control" value={post.image} onChange={(e) => {
                const updated = [...form.instagramPosts]
                updated[i] = { ...updated[i], image: e.target.value }
                setForm(prev => ({...prev, instagramPosts: updated}))
              }} placeholder="Image URL" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Link URL</label>
              <input className="form-control" value={post.url} onChange={(e) => {
                const updated = [...form.instagramPosts]
                updated[i] = { ...updated[i], url: e.target.value }
                setForm(prev => ({...prev, instagramPosts: updated}))
              }} placeholder="https://instagram.com/..." />
            </div>
            <button type="button" className="btn btn-danger" style={{ marginTop: 20, padding: '6px 12px' }} onClick={() => {
              setForm(prev => ({...prev, instagramPosts: prev.instagramPosts.filter((_, idx) => idx !== i)}))
            }}>×</button>
          </div>
        ))}
        {form.instagramPosts.length < 6 && (
          <button type="button" className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => {
            setForm(prev => ({...prev, instagramPosts: [...prev.instagramPosts, { image: '', url: '' }]}))
          }}>+ Add Instagram Post</button>
        )}

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 16 }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}

export default Settings
