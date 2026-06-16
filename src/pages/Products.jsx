import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit3, Trash2, Package } from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })

const Products = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(`/admin/products?page=${page}&limit=10&search=${search}`)
      setProducts(data.data)
      setPagination(data.pagination)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [page, search])

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/products/${deleteTarget._id}`)
      setDeleteTarget(null)
      fetchProducts()
    } catch (err) { Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Delete failed' }) }
  }

  const columns = [
    {
      header: 'Image', width: '60px',
      render: row => (
        <div className="product-img" style={{ background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999', width: 48, height: 48 }}>
          {row.images?.[0]?.url ? <img src={row.images[0].url} alt="" style={{ width: 48, height: 48, objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.parentElement.textContent = 'No img' }} /> : 'No img'}
        </div>
      ),
    },
    { header: 'Title', render: row => <strong>{row.title}</strong> },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Price', render: row => `₹${row.salePrice || row.price}` },
    {
      header: 'Stock', render: row => (
        <span className={`status-badge ${row.inStock ? 'active' : 'inactive'}`}>
          {row.inStock ? `${row.stockQuantity} in stock` : 'Out of stock'}
        </span>
      ),
    },
    { header: 'Featured', render: row => row.featured ? <span className="status-badge active">Yes</span> : 'No' },
    {
      header: 'Actions', width: '120px',
      render: row => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Link to={`/products/edit/${row._id}`} className="btn btn-outline btn-sm"><Edit3 size={14} /></Link>
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(row)}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>Products</h2>
        <p>{pagination?.total || 0} products in your catalog</p>
      </div>
      <div className="card">
        <div className="card-header">
          <h3><Package size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> All Products</h3>
          <Link to="/products/new" className="btn btn-primary"><Plus size={16} /> Add Product</Link>
        </div>
        <div className="search-bar">
          <div style={{ position: 'relative', maxWidth: 320, width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input className="form-control" placeholder="Search products..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ paddingLeft: 36 }} />
          </div>
        </div>
        <DataTable columns={columns} data={products} />
        {pagination && pagination.pages > 1 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            {Array.from({ length: pagination.pages }, (_, i) => (
              <button key={i + 1} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>

      {deleteTarget && (
        <Modal title="Delete Product" onClose={() => setDeleteTarget(null)}
          footer={<><button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></>}>
          <p>Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This action cannot be undone.</p>
        </Modal>
      )}
    </div>
  )
}

export default Products
