import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye, EyeOff, Star } from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const BlogPosts = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchPosts = async () => {
    try {
      const { data } = await api.get(`/admin/blog?page=${page}&limit=10`)
      setPosts(data.data)
      setPagination(data.pagination)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPosts() }, [page])

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/blog/${deleteTarget._id}`)
      setDeleteTarget(null)
      fetchPosts()
    } catch (err) { Toast.fire({ icon: 'error', title: 'Delete failed' }) }
  }

  const seoScore = (row) => {
    let score = 0
    if (row.metaTitle && row.metaTitle.length >= 30) score += 20
    if (row.metaDescription && row.metaDescription.length >= 50) score += 20
    if (row.metaKeywords) score += 10
    if (row.ogImage) score += 10
    if (row.ogTitle) score += 10
    if (row.ogDescription) score += 10
    if (row.canonicalUrl) score += 10
    if (row.slug) score += 5
    if (row.excerpt) score += 5
    return score
  }

  const columns = [
    {
      header: 'Image',
      render: row => row.featuredImage
        ? <img src={row.featuredImage} alt="" className="product-img" onError={e => { e.target.style.display = 'none'; e.target.parentElement.textContent = 'No img' }} />
        : '—',
    },
    { header: 'Title', render: row => <strong>{row.title}</strong> },
    { header: 'Author', accessor: 'author' },
    { header: 'Category', accessor: 'category' },
    {
      header: 'SEO',
      render: row => {
        const score = seoScore(row)
        return (
          <span className={`seo-badge seo-badge-${score >= 70 ? 'good' : score >= 40 ? 'avg' : 'poor'}`}>
            <Search size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
            {score}%
          </span>
        )
      },
    },
    {
      header: 'Status',
      render: row => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {row.isFeatured && <Star size={12} fill="#f59e0b" color="#f59e0b" />}
          <span className={`status-badge ${row.published ? 'published' : 'draft'}`}>
            {row.isIndexed ? <Eye size={11} style={{ marginRight: 3 }} /> : <EyeOff size={11} style={{ marginRight: 3 }} />}
            {row.published ? 'Published' : 'Draft'}
          </span>
        </div>
      ),
    },
    { header: 'Date', render: row => row.publishedAt ? new Date(row.publishedAt).toLocaleDateString() : '—' },
    {
      header: 'Actions',
      render: row => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Link to={`/blog/edit/${row._id}`} className="btn btn-outline btn-sm">Edit</Link>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(row)}>Delete</button>
        </div>
      ),
    },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h3>Blog Posts ({pagination?.total || 0})</h3>
        <Link to="/blog/new" className="btn btn-primary">+ New Post</Link>
      </div>
      <DataTable columns={columns} data={posts} loading={loading} />
      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button key={i + 1} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
          <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {deleteTarget && (
        <Modal title="Delete Post" onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </>
          }
        >
          <p>Delete <strong>{deleteTarget.title}</strong>?</p>
        </Modal>
      )}
    </div>
  )
}

export default BlogPosts
