import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { Pagination, TableSkeleton, ConfirmDialog, ErrorBanner } from '../components/DoctorUI'
import { useToast } from '../components/Toast'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'
import './PatientsList.css'

const PatientsList = () => {
  const { notify, toastEl } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [patients, setPatients] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const sort = searchParams.get('sort') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  const updateParams = (updates) => {
    const params = Object.fromEntries(searchParams)
    const merged = { ...params, ...updates }
    Object.keys(merged).forEach((k) => {
      if (!merged[k]) delete merged[k]
    })
    setSearchParams(merged)
  }

  const fetchPatients = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit }
      if (search) params.search = search
      if (status) params.status = status
      if (sort) params.sort = sort

      const { data } = await axiosClient.get('/admin/patients', { params })
      const res = data.data || data
      setPatients(res.patients || [])
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patients')
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [searchParams])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParams({ search: e.target.search.value, page: 1 })
  }

  const handleToggleStatus = async (id, current) => {
    try {
      const { data } = await axiosClient.patch(`/admin/patients/${id}/status`, {
        status: !current,
      })
      notify(`Patient ${data.data?.isActive ? 'activated' : 'deactivated'} successfully`)
      fetchPatients()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update status', 'error')
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await axiosClient.delete(`/admin/patients/${deleteId}`)
      notify('Patient deleted successfully')
      setDeleteId(null)
      fetchPatients()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete patient', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="patients-list-page">
      {toastEl}

      <div className="d-page-header">
        <div>
          <h1 className="d-page-title">Patients</h1>
          <p className="d-page-subtitle">{pagination.total} patient{pagination.total !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="d-filters-bar">
        <form className="d-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            name="search"
            placeholder="Search by name, email or phone..."
            defaultValue={search}
            className="d-search-input"
          />
          <button type="submit" className="d-btn-search">Search</button>
        </form>
        <div className="d-filter-group">
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value, page: 1 })}
            className="d-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value, page: 1 })}
            className="d-select"
          >
            <option value="">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="patients-table-container">
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : patients.length === 0 ? (
          <div className="d-empty">No patients found</div>
        ) : (
          <table className="patients-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="d-user-cell">
                      <img
                        src={getImageUrl(p.image) || 'https://via.placeholder.com/40?text=P'}
                        alt={p.name}
                        className="d-avatar"
                      />
                      <div>
                        <div className="d-user-name">{p.name}</div>
                        <div className="d-user-sub">{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{p.phone || 'N/A'}</td>
                  <td>{p.gender || 'N/A'}</td>
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <button
                      className={`d-status-badge d-status-${p.isActive ? 'confirmed' : 'cancelled'}`}
                      onClick={() => handleToggleStatus(p._id, p.isActive)}
                      title="Click to toggle"
                    >
                      {p.isActive ? 'Active' : 'Deactivated'}
                    </button>
                  </td>
                  <td>
                    <div className="d-actions">
                      <Link to={`/patients/${p._id}`} className="d-btn d-btn-outline d-btn-sm">View</Link>
                      <button
                        className="d-btn d-btn-danger d-btn-sm"
                        title="Delete"
                        onClick={() => setDeleteId(p._id)}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} pages={pagination.pages} onPageChange={(p) => updateParams({ page: p })} />

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Patient"
        message="Delete this patient and all their appointments? This action cannot be undone."
        confirmText="Delete"
        busy={deleting}
        onCancel={() => { if (!deleting) setDeleteId(null) }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default PatientsList
