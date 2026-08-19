import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { PageHeader, LoadingState, EmptyState, ErrorBanner, Pagination, formatDate } from '../components/DoctorUI'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'

const DoctorEMR = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [records, setRecords] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const search = searchParams.get('search') || ''
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

  const fetchRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit }
      if (search) params.search = search
      const { data } = await axiosClient.get('/doctor/emr/records', { params })
      const res = data.data || data
      setRecords(res.records || [])
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load medical records')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [searchParams])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParams({ search: e.target.search.value, page: 1 })
  }

  return (
    <div>
      <PageHeader title="Medical Records" subtitle={`${pagination.total} record${pagination.total !== 1 ? 's' : ''} found`}>
        <Link to="/doctor/emr/new" className="d-btn d-btn-primary">+ Create Record</Link>
      </PageHeader>

      <div className="d-filters-bar">
        <form className="d-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            name="search"
            placeholder="Search by patient name, email or phone..."
            defaultValue={search}
            className="d-search-input"
          />
          <button type="submit" className="d-btn-search">Search</button>
        </form>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="d-table-wrap">
        {loading ? (
          <LoadingState text="Loading medical records..." />
        ) : records.length === 0 ? (
          <EmptyState text="No medical records found. Create one to get started." />
        ) : (
          <table className="d-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Visit Date</th>
                <th>Diagnosis</th>
                <th>Medications</th>
                <th>Reports</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const patient = record.userId || {}
                return (
                  <tr key={record._id}>
                    <td>
                      <div className="d-user-cell">
                        <img
                          src={getImageUrl(patient.image) || 'https://via.placeholder.com/40?text=P'}
                          alt={patient.name}
                          className="d-avatar"
                        />
                        <div>
                          <div className="d-user-name">{patient.name || 'Unknown'}</div>
                          <div className="d-user-sub">{patient.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(record.visitDate)}</td>
                    <td style={{ maxWidth: 240 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {record.diagnosis || '—'}
                      </span>
                    </td>
                    <td>{(record.prescriptions || []).length}</td>
                    <td>
                      <div className="d-actions">
                        <span className="d-tag">{(record.reports || []).length} files</span>
                      </div>
                    </td>
                    <td>{formatDate(record.createdAt)}</td>
                    <td>
                      <div className="d-actions">
                        <Link to={`/doctor/emr/${record._id}`} className="d-btn d-btn-outline d-btn-sm">View</Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} pages={pagination.pages} onPageChange={(p) => updateParams({ page: p })} />
    </div>
  )
}

export default DoctorEMR
